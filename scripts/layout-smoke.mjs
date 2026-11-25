// Layout smoke check: builds (or serves) the web export, drives headless Chrome over the DevTools
// protocol, and fails if anything needed to play Honey Pot Flick or Bee Line is off-screen, overlapping
// or (Bee Line) too crowded at phone sizes.
// Plain Node (>= 22, for the global WebSocket) — no extra dependencies.
//
//   npm run smoke:layout                      build the web export, check every size and mode
//   npm run smoke:layout -- --dist <dir>      reuse an existing `expo export --platform web` folder
//   npm run smoke:layout -- --shots <dir>     also save a PNG per case (<route>-<size>-<mode>.png)
//   npm run smoke:layout -- --sizes 320x568   only these viewports (comma-separated WxH)
//   CHROME_PATH=<chrome.exe> npm run smoke:layout   if Chrome isn't in a default location
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const DEFAULT_VIEWPORTS = [
  { name: '320x568', width: 320, height: 568 },
  { name: '375x667', width: 375, height: 667 },
  { name: '768x1024', width: 768, height: 1024 },
];
const sizesArg = process.argv.slice(2).find((_, i, all) => all[i - 1] === '--sizes');
const VIEWPORTS = sizesArg
  ? sizesArg.split(',').map((size) => {
      const [width, height] = size.split('x').map(Number);
      return { name: size, width, height };
    })
  : DEFAULT_VIEWPORTS;
const MODES = ['easy', 'hard', 'crazy', 'impossible'];
const MAX_WAIT_MS = 15000;

const args = process.argv.slice(2);
const argValue = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function fail(message) {
  console.error(`\nSMOKE CHECK ERROR: ${message}`);
  process.exitCode = 2;
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

/** The longest word across the built-in lists, read straight from the source so it can't drift. */
function longestBuiltInWord() {
  const source = fs.readFileSync(path.join(repoRoot, 'src/data/word-lists/built-in-word-lists.ts'), 'utf8');
  const words = [...source.matchAll(/'([a-z]+)'/g)].map((match) => match[1]);
  return words.reduce((longest, word) => (word.length > longest.length ? word : longest), '');
}

function buildWebExport() {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'layout-smoke-web-'));
  console.log(`Building web export into ${outDir} ...`);
  const result = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', outDir], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    throw new Error('expo export failed (see output above)');
  }
  return outDir;
}

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.mp3': 'audio/mpeg',
  '.css': 'text/css',
};

function serve(root, port) {
  const server = http.createServer((req, res) => {
    let file = path.join(root, decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(root, 'index.html');
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

async function connect(debugPort) {
  let targets;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json();
      break;
    } catch {
      await sleep(250);
    }
  }
  const page = targets?.find((target) => target.type === 'page');
  if (!page) {
    throw new Error('Could not connect to headless Chrome');
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error('DevTools websocket failed'));
  });

  let nextId = 0;
  const pending = new Map();
  const pageErrors = [];
  ws.onmessage = (message) => {
    const data = JSON.parse(message.data);
    if (pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    }
    if (data.method === 'Runtime.exceptionThrown') {
      const details = data.params.exceptionDetails;
      pageErrors.push(details.exception?.description ?? details.text);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = (nextId += 1);
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    return response.result?.result?.value;
  };

  return { ws, send, evaluate, pageErrors };
}

// Runs in the page. Returns the rect of every element with the given test id.
const COLLECT_RECTS = `(() => {
  const rects = (id) => [...document.querySelectorAll('[data-testid="' + id + '"]')].map((el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
  });
  const ids = ['info-line', 'back-button', 'reset-button', 'honey-larder', 'prompt-card', 'flick-field', 'honey-pot',
    'letter-tray', 'letter-tile', 'hint-button', 'megaphone-button'];
  const out = {};
  for (const id of ids) out[id] = rects(id);
  out.page = { innerWidth: window.innerWidth, innerHeight: window.innerHeight,
    scrollHeight: document.documentElement.scrollHeight, scrollWidth: document.documentElement.scrollWidth };
  return out;
})()`;

const round = (value) => Math.round(value * 10) / 10;

/** Pure: turns the collected rects into a list of human-readable problems. */
function findFlickLayoutProblems(rects, { mode, expectedLetters }) {
  const problems = [];
  const { innerWidth, innerHeight } = rects.page;
  const EPS = 0.5;

  const required = ['info-line', 'back-button', 'honey-larder', 'prompt-card', 'flick-field', 'honey-pot', 'letter-tray', 'megaphone-button'];
  if (mode === 'easy') {
    required.push('hint-button');
  }
  for (const id of required) {
    if (rects[id].length !== 1) {
      problems.push(`expected exactly one "${id}", found ${rects[id].length}`);
    }
  }
  if (rects['letter-tile'].length !== expectedLetters) {
    problems.push(`expected ${expectedLetters} letter tiles, found ${rects['letter-tile'].length}`);
  }

  const onScreen = (label, rect) => {
    if (rect.left < -EPS || rect.top < -EPS || rect.right > innerWidth + EPS || rect.bottom > innerHeight + EPS) {
      problems.push(
        `${label} is off-screen: [${round(rect.left)},${round(rect.top)} - ${round(rect.right)},${round(rect.bottom)}] ` +
          `in ${innerWidth}x${innerHeight}`,
      );
    }
  };
  for (const id of Object.keys(rects)) {
    if (id === 'page') continue;
    rects[id].forEach((rect, index) => onScreen(rects[id].length > 1 ? `${id}[${index}]` : id, rect));
  }

  const overlaps = (a, b) =>
    a.left < b.right - EPS && b.left < a.right - EPS && a.top < b.bottom - EPS && b.top < a.bottom - EPS;
  const sections = ['back-button', 'reset-button', 'honey-larder', 'prompt-card', 'flick-field', 'letter-tray', 'hint-button', 'megaphone-button'];
  for (let i = 0; i < sections.length; i += 1) {
    for (let j = i + 1; j < sections.length; j += 1) {
      const a = rects[sections[i]][0];
      const b = rects[sections[j]][0];
      if (a && b && overlaps(a, b)) {
        problems.push(`${sections[i]} overlaps ${sections[j]}`);
      }
    }
  }

  // Text rows get squeezed to nothing (not clipped) when the screen is over-full, so check they kept their height.
  const infoLine = rects['info-line'][0];
  if (infoLine && infoLine.height < 10) {
    problems.push(`info line was squeezed to ${round(infoLine.height)}px: the screen is over-full`);
  }

  const field = rects['flick-field'][0];
  const pot = rects['honey-pot'][0];
  if (field && pot && (pot.left < field.left - EPS || pot.right > field.right + EPS || pot.top < field.top - EPS || pot.bottom > field.bottom + EPS)) {
    problems.push('honey pot is outside the flick field');
  }

  if (rects.page.scrollHeight > innerHeight + 1) {
    problems.push(`page scrolls: scrollHeight ${rects.page.scrollHeight} > viewport ${innerHeight}`);
  }
  return problems;
}


// Bee Line (Epic 29). Tile hexes expose `bee-line-hex-<id>` (drawn size); easy mode's tap targets are
// `bee-line-tile-<id>`.
const COLLECT_BEE_LINE_RECTS = `(() => {
  const toRect = (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
  };
  const byId = (id) => [...document.querySelectorAll('[data-testid="' + id + '"]')].map(toRect);
  const byPrefix = (prefix) => [...document.querySelectorAll('[data-testid^="' + prefix + '"]')].map(toRect);
  return {
    'info-line': byId('info-line'), 'back-button': byId('back-button'), 'prompt-row': byId('prompt-row'),
    'word-so-far': byId('word-so-far'), 'bee-line-field': byId('bee-line-field'),
    'megaphone-button': byId('megaphone-button'),
    hexes: byPrefix('bee-line-hex-'), tapTargets: byPrefix('bee-line-tile-'),
    page: { innerWidth: window.innerWidth, innerHeight: window.innerHeight,
      scrollHeight: document.documentElement.scrollHeight, scrollWidth: document.documentElement.scrollWidth },
  };
})()`;

const MIN_FIELD_SHARE = 0.6;
const MIN_TILE_PX = 40;

function findBeeLineLayoutProblems(rects, { mode, wordLength }) {
  const problems = [];
  const { innerWidth, innerHeight } = rects.page;
  const EPS = 0.5;

  for (const id of ['info-line', 'back-button', 'prompt-row', 'word-so-far', 'bee-line-field', 'megaphone-button']) {
    if (rects[id].length !== 1) problems.push(`expected exactly one "${id}", found ${rects[id].length}`);
  }
  if (rects.hexes.length < wordLength) {
    problems.push(`expected at least ${wordLength} tiles, found ${rects.hexes.length}`);
  }

  const onScreen = (label, rect) => {
    if (rect.left < -EPS || rect.top < -EPS || rect.right > innerWidth + EPS || rect.bottom > innerHeight + EPS) {
      problems.push(`${label} is off-screen: [${round(rect.left)},${round(rect.top)} - ${round(rect.right)},${round(rect.bottom)}] in ${innerWidth}x${innerHeight}`);
    }
  };
  for (const id of ['info-line', 'back-button', 'prompt-row', 'word-so-far', 'bee-line-field', 'megaphone-button']) {
    rects[id].forEach((rect) => onScreen(id, rect));
  }
  rects.hexes.forEach((rect, index) => onScreen(`tile[${index}]`, rect));

  const field = rects['bee-line-field'][0];
  if (field) {
    const share = field.height / innerHeight;
    if (share < MIN_FIELD_SHARE) {
      problems.push(`play field is only ${Math.round(share * 100)}% of the screen height (needs ${MIN_FIELD_SHARE * 100}%)`);
    }
    rects.hexes.forEach((rect, index) => {
      if (rect.left < field.left - EPS || rect.right > field.right + EPS || rect.top < field.top - EPS || rect.bottom > field.bottom + EPS) {
        problems.push(`tile[${index}] is outside the play field`);
      }
    });
  }

  const infoLine = rects['info-line'][0];
  if (infoLine && infoLine.height < 10) {
    problems.push(`info line was squeezed to ${round(infoLine.height)}px: the screen is over-full`);
  }

  const centre = (r) => ({ x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 });
  for (let i = 0; i < rects.hexes.length; i += 1) {
    const a = rects.hexes[i];
    if (a.width < MIN_TILE_PX - EPS) problems.push(`tile[${i}] is ${round(a.width)}px, below the ${MIN_TILE_PX}px minimum`);
    for (let j = i + 1; j < rects.hexes.length; j += 1) {
      const b = rects.hexes[j];
      const gap = Math.hypot(centre(a).x - centre(b).x, centre(a).y - centre(b).y) - a.width;
      if (gap < a.width - EPS) {
        problems.push(`tiles ${i} and ${j} have only ${round(gap)}px between them (need ${round(a.width)}px, one tile-width)`);
      }
    }
  }

  if (mode === 'easy') {
    rects.tapTargets.forEach((rect, index) => {
      if (rect.width < 44 - EPS || rect.height < 44 - EPS) {
        problems.push(`tap target ${index} is ${round(rect.width)}x${round(rect.height)}, below 44`);
      }
    });
  }

  if (rects.page.scrollHeight > innerHeight + 1) {
    problems.push(`page scrolls: scrollHeight ${rects.page.scrollHeight} > viewport ${innerHeight}`);
  }
  return problems;
}

/** The requested decoy count per mode, read from bee-line.ts so the report can say when decoys were dropped. */
function beeLineRequestedDecoys() {
  const source = fs.readFileSync(path.join(repoRoot, 'src/features/play/logic/bee-line.ts'), 'utf8');
  const config = source.slice(source.indexOf('BEE_LINE_MODE_CONFIG: Record'));
  const counts = [...config.matchAll(/decoyLetterCount: (\d+)/g)].map((match) => Number(match[1]));
  return Object.fromEntries(MODES.map((mode, index) => [mode, counts[index] ?? 0]));
}

const GAMES = [
  {
    name: 'Honey Pot Flick',
    route: 'play',
    tileSelector: '[data-testid="letter-tile"]',
    readySelector: '[data-testid="honey-pot"]',
    collect: COLLECT_RECTS,
    check: (rects, { mode, tileCount }) => findFlickLayoutProblems(rects, { mode, expectedLetters: tileCount }),
    summary: (rects, tileCount) => {
      const tile = rects['letter-tile'][0];
      const field = rects['flick-field'][0];
      return `${tileCount} letters, tile ${tile ? round(tile.width) : '?'}px, field ${field ? round(field.height) : '?'}px tall`;
    },
  },
  {
    name: 'Bee Line',
    route: 'bee-line',
    tileSelector: '[data-testid^="bee-line-hex-"]',
    readySelector: '[data-testid="bee-line-field"]',
    collect: COLLECT_BEE_LINE_RECTS,
    check: (rects, { mode, word }) => findBeeLineLayoutProblems(rects, { mode, wordLength: word.length }),
    summary: (rects, tileCount, { word, mode }) => {
      const tile = rects.hexes[0];
      const field = rects['bee-line-field'][0];
      const requested = beeLineRequestedDecoys()[mode];
      const dropped = word.length + requested - tileCount;
      return (
        `${tileCount} letters, tile ${tile ? round(tile.width) : '?'}px, field ${field ? round(field.height) : '?'}px tall ` +
        `(${field ? Math.round((field.height / rects.page.innerHeight) * 100) : '?'}%)` +
        (dropped > 0 ? ` [${dropped} decoy${dropped === 1 ? '' : 's'} dropped to keep the gaps]` : '')
      );
    },
  },
];

async function waitForPlayable(evaluate, game, expectedLetters) {
  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    const ready = await evaluate(
      `document.querySelectorAll('${game.tileSelector}').length === ${expectedLetters} && !!document.querySelector('${game.readySelector}')`,
    );
    if (ready) {
      await sleep(400);
      return true;
    }
    await sleep(250);
  }
  return false;
}

async function main() {
  const chromePath = findChrome();
  if (!chromePath) {
    return fail('Chrome not found. Set CHROME_PATH to a Chrome/Chromium/Edge executable.');
  }

  const word = longestBuiltInWord();
  const shotsDir = argValue('--shots');
  if (shotsDir) fs.mkdirSync(shotsDir, { recursive: true });

  let webRoot = argValue('--dist');
  if (webRoot) {
    webRoot = path.resolve(webRoot);
  } else {
    webRoot = buildWebExport();
  }

  const httpPort = await freePort();
  const debugPort = await freePort();
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'layout-smoke-chrome-'));
  const server = await serve(webRoot, httpPort);
  const chrome = spawn(
    chromePath,
    ['--headless=new', `--remote-debugging-port=${debugPort}`, '--no-first-run', '--disable-gpu', `--user-data-dir=${profileDir}`, 'about:blank'],
    { stdio: 'ignore' },
  );

  let client;
  const failures = [];
  try {
    client = await connect(debugPort);
    const { send, evaluate, pageErrors } = client;
    await send('Runtime.enable');
    await send('Page.enable');
    const base = `http://127.0.0.1:${httpPort}`;

    console.log(`Checking "${word}" (${word.length} letters)\n`);
    for (const viewport of VIEWPORTS) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: true,
      });
      for (const game of GAMES) {
        for (const mode of MODES) {
          await send('Page.navigate', { url: `${base}/home` });
          await sleep(1200);
          const list = { id: 'smoke-list', name: 'Smoke', words: [word], isBuiltIn: false, createdAt: 0, updatedAt: 0 };
          await evaluate(`
            localStorage.setItem('profile', JSON.stringify({ id: 'smoke', name: 'Smoke', avatar: '🐝' }));
            localStorage.setItem('word-lists.custom', ${JSON.stringify(JSON.stringify([list]))});
            localStorage.setItem('word-lists.selectedId', 'smoke-list');
            localStorage.setItem('game-mode', '${mode}');
            true`);
          pageErrors.length = 0;
          await send('Page.navigate', { url: `${base}/${game.route}` });

          // Decoy counts live in the game configs; read the tile count off the page instead of duplicating them.
          const tileCount = await (async () => {
            const deadline = Date.now() + MAX_WAIT_MS;
            while (Date.now() < deadline) {
              const count = await evaluate(`document.querySelectorAll('${game.tileSelector}').length`);
              if (count >= word.length) return count;
              await sleep(250);
            }
            return -1;
          })();
          const label = `${game.name.padEnd(15)} ${viewport.name} ${mode.padEnd(10)}`;
          if (tileCount < 0 || !(await waitForPlayable(evaluate, game, tileCount))) {
            failures.push(`${label}: the screen never showed its letters`);
            console.log(`FAIL ${label} screen never became playable`);
            continue;
          }

          const rects = await evaluate(game.collect);
          const problems = game.check(rects, { mode, tileCount, word });
          if (pageErrors.length > 0) {
            problems.push(`JavaScript error: ${pageErrors[0].split('\n')[0]}`);
          }
          const summary = game.summary(rects, tileCount, { word, mode });
          if (problems.length === 0) {
            console.log(`ok   ${label} ${summary}`);
          } else {
            console.log(`FAIL ${label} ${summary}`);
            problems.forEach((problem) => console.log(`       - ${problem}`));
            failures.push(`${label}: ${problems.join('; ')}`);
          }

          if (shotsDir) {
            await sleep(4000); // let the word-reveal banner fade so the screenshot shows the board
            const shot = await send('Page.captureScreenshot', { format: 'png' });
            fs.writeFileSync(path.join(shotsDir, `${game.route}-${viewport.name}-${mode}.png`), Buffer.from(shot.result.data, 'base64'));
          }
        }
      }
    }
  } finally {
    client?.ws.close();
    if (process.platform === 'win32' && chrome.pid) {
      spawnSync('taskkill', ['/pid', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      chrome.kill('SIGKILL');
    }
    server.close();
    await sleep(500);
    fs.rmSync(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  }

  if (failures.length > 0) {
    console.error(`\nLAYOUT SMOKE CHECK FAILED (${failures.length} case${failures.length === 1 ? '' : 's'})`);
    process.exitCode = 1;
  } else {
    console.log('\nLayout smoke check passed.');
  }
}

main()
  .catch((error) => fail(error.message))
  .finally(() => setTimeout(() => process.exit(process.exitCode ?? 0), 100));
