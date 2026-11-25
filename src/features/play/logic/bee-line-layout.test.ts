import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BUILT_IN_WORD_LISTS } from '@/data/word-lists/built-in-word-lists';
import { BEE_LINE_MODE_CONFIG, ScatteredLetter, buildBeeLineField, findTouchedTile } from './bee-line';
import {
  BEE_LINE_FIELD_EDGE_PAD_PX,
  BEE_LINE_MIN_TAP_TARGET_PX,
  BEE_LINE_TILE_MIN_PX,
  BEE_LINE_TILE_PHONE_MAX_PX,
  BEE_LINE_TILE_TABLET_MAX_PX,
  BUMP_RADIUS_FACTOR,
  getBeeLineTileLayout,
  getTileCapacity,
} from './bee-line-layout';
import { GAME_MODES } from './game-modes';

// Field sizes the screen produces at 320x568 and 375x667 (measured in the web export: the field
// fills everything under the compact header) and a tablet.
const FIELDS = [
  { name: '320x568', width: 288, height: 371 },
  { name: '375x667', width: 343, height: 470 },
  { name: '768x1024', width: 736, height: 793 },
];
const longestWord = BUILT_IN_WORD_LISTS.flatMap((list) => list.words).reduce((a, b) => (b.length > a.length ? b : a));

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Can the head's centre travel from `from` to `to` inside the field without entering the bump
 *  zone of any tile in `obstacles`? Breadth-first search over a 3px grid. */
function isReachable(
  from: { x: number; y: number },
  to: { x: number; y: number },
  obstacles: ScatteredLetter[],
  bumpRadius: number,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
): boolean {
  const step = 3;
  const cols = Math.floor((bounds.maxX - bounds.minX) / step) + 1;
  const rows = Math.floor((bounds.maxY - bounds.minY) / step) + 1;
  const blocked = (x: number, y: number) =>
    obstacles.some((tile) => Math.hypot(tile.position.x - x, tile.position.y - y) <= bumpRadius);
  const toCell = (p: { x: number; y: number }) => ({
    c: Math.min(cols - 1, Math.max(0, Math.round((p.x - bounds.minX) / step))),
    r: Math.min(rows - 1, Math.max(0, Math.round((p.y - bounds.minY) / step))),
  });

  const start = toCell(from);
  const goal = toCell(to);
  const seen = new Uint8Array(cols * rows);
  const queue: number[] = [start.r * cols + start.c];
  seen[queue[0]] = 1;

  for (let head = 0; head < queue.length; head += 1) {
    const cell = queue[head];
    const c = cell % cols;
    const r = Math.floor(cell / cols);
    if (c === goal.c && r === goal.r) {
      return true;
    }
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc;
      const nr = r + dr;
      const index = nr * cols + nc;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows || seen[index]) continue;
      if (blocked(bounds.minX + nc * step, bounds.minY + nr * step)) continue;
      seen[index] = 1;
      queue.push(index);
    }
  }
  return false;
}

describe('getBeeLineTileLayout', () => {
  it('keeps tiles between 40px and the phone cap, and allows bigger tiles on a tablet', () => {
    const phone = getBeeLineTileLayout(FIELDS[1], 3, 0);
    const tablet = getBeeLineTileLayout(FIELDS[2], 3, 0);
    assert.equal(phone.tileSize, BEE_LINE_TILE_PHONE_MAX_PX);
    assert.equal(tablet.tileSize, BEE_LINE_TILE_TABLET_MAX_PX);
  });

  it('shrinks tiles as the letter count grows, before it ever shrinks the gap', () => {
    let previous = Infinity;
    for (let letters = 3; letters <= 13; letters += 1) {
      const layout = getBeeLineTileLayout(FIELDS[0], letters, 0);
      assert.ok(layout.tileSize <= previous, `tile grew at ${letters} letters`);
      assert.ok(layout.tileSize >= BEE_LINE_TILE_MIN_PX);
      assert.equal(layout.minGapPx, layout.tileSize, 'gap is one full tile-width');
      previous = layout.tileSize;
    }
  });

  it('keeps the full gap and drops decoys when the minimum tile cannot hold everything', () => {
    const layout = getBeeLineTileLayout({ width: 240, height: 330 }, 8, 6);
    assert.equal(layout.tileSize, BEE_LINE_TILE_MIN_PX);
    assert.equal(layout.minGapPx, BEE_LINE_TILE_MIN_PX);
    assert.ok(layout.decoyCount < layout.requestedDecoyCount);
    assert.equal(layout.gapCompromised, false);
    assert.ok(getTileCapacity({ width: 240, height: 330 }, layout.tileSize, layout.minCenterSpacingPx) >= 8 + layout.decoyCount);
  });

  it('only reduces the gap, and says so, when the word alone cannot fit at the minimum tile', () => {
    const layout = getBeeLineTileLayout({ width: 120, height: 160 }, 12, 3);
    assert.equal(layout.gapCompromised, true);
    assert.equal(layout.decoyCount, 0);
    assert.ok(layout.minGapPx < layout.tileSize);
  });

  it('never gives an easy-mode tap target less than 44px', () => {
    for (const field of FIELDS) {
      for (let letters = 3; letters <= 13; letters += 1) {
        assert.ok(getBeeLineTileLayout(field, letters, 0).tapTargetPx >= BEE_LINE_MIN_TAP_TARGET_PX);
      }
    }
  });
});

describe('Bee Line layout for the longest built-in word, every mode, at phone sizes', () => {
  for (const field of FIELDS.slice(0, 2)) {
    for (const mode of GAME_MODES) {
      it(`${longestWord} / ${mode} / ${field.name}: full gaps, in bounds, every next letter reachable`, () => {
        const layout = getBeeLineTileLayout(field, longestWord.length, BEE_LINE_MODE_CONFIG[mode].decoyLetterCount);
        assert.equal(layout.gapCompromised, false, 'the longest word keeps its gaps');
        assert.ok(layout.tileSize >= BEE_LINE_TILE_MIN_PX);

        const bounds = { x: 0, y: 0, width: field.width, height: field.height };
        const margin = layout.tileSize / 2 + BEE_LINE_FIELD_EDGE_PAD_PX;
        const reach = { minX: margin, maxX: field.width - margin, minY: margin, maxY: field.height - margin };

        for (let seed = 1; seed <= 25; seed += 1) {
          const built = buildBeeLineField(longestWord, layout.decoyCount, bounds, {
            tileSize: layout.tileSize,
            minTileSpacingPx: layout.minCenterSpacingPx,
            random: seededRandom(seed),
          });

          for (const tile of built.tiles) {
            assert.ok(tile.position.x >= reach.minX - 1e-6 && tile.position.x <= reach.maxX + 1e-6, 'x in bounds');
            assert.ok(tile.position.y >= reach.minY - 1e-6 && tile.position.y <= reach.maxY + 1e-6, 'y in bounds');
          }
          for (let i = 0; i < built.tiles.length; i += 1) {
            for (let j = i + 1; j < built.tiles.length; j += 1) {
              const a = built.tiles[i].position;
              const b = built.tiles[j].position;
              const edgeGap = Math.hypot(a.x - b.x, a.y - b.y) - layout.tileSize;
              assert.ok(edgeGap >= layout.minGapPx - 1e-6, `seed ${seed}: tiles ${i}/${j} gap ${edgeGap}`);
            }
          }

          const correct = built.tiles.filter((tile) => tile.kind === 'correct').sort((a, b) => a.orderIndex! - b.orderIndex!);
          for (let k = 1; k < correct.length; k += 1) {
            // Letters 0..k-1 are already collected (removed); everything else is a wrong tile.
            const obstacles = built.tiles.filter((tile) => tile.id !== correct[k].id && !correct.slice(0, k).includes(tile));
            assert.ok(
              isReachable(correct[k - 1].position, correct[k].position, obstacles, layout.tileSize * BUMP_RADIUS_FACTOR, reach),
              `seed ${seed}: letter ${k} cannot be reached from letter ${k - 1} without crossing a wrong tile`,
            );
          }
        }
      });
    }
  }
});

describe('placement across word lengths and modes', () => {
  it('keeps the minimum edge-to-edge gap for every word length in the built-in lists', () => {
    const lengths = [...new Set(BUILT_IN_WORD_LISTS.flatMap((list) => list.words.map((word) => word.length)))];
    for (const field of FIELDS) {
      for (const length of lengths) {
        for (const mode of GAME_MODES) {
          const word = longestWord.slice(0, length);
          const layout = getBeeLineTileLayout(field, length, BEE_LINE_MODE_CONFIG[mode].decoyLetterCount);
          const built = buildBeeLineField(word, layout.decoyCount, { x: 0, y: 0, ...field }, {
            tileSize: layout.tileSize,
            minTileSpacingPx: layout.minCenterSpacingPx,
            random: seededRandom(length * 7 + 1),
          });
          for (let i = 0; i < built.tiles.length; i += 1) {
            for (let j = i + 1; j < built.tiles.length; j += 1) {
              const a = built.tiles[i].position;
              const b = built.tiles[j].position;
              assert.ok(Math.hypot(a.x - b.x, a.y - b.y) - layout.tileSize >= layout.minGapPx - 1e-6);
            }
          }
        }
      }
    }
  });
});

describe('findTouchedTile', () => {
  const tile = (id: string, orderIndex: number | null, x: number): ScatteredLetter => ({
    id,
    letter: 'a',
    kind: orderIndex === null ? 'decoy' : 'correct',
    orderIndex,
    position: { x, y: 0 },
  });
  const tiles = [tile('c0', 0, 0), tile('c1', 1, 200), tile('d0', null, 400)];

  it('picks up the next letter only when the head centre is clearly over it', () => {
    assert.equal(findTouchedTile({ x: 40 * 0.45, y: 0 }, tiles, new Set(), 0, 40)?.id, 'c0');
    assert.equal(findTouchedTile({ x: 40 * 0.5, y: 0 }, tiles, new Set(), 0, 40), null);
  });

  it('bumps a wrong tile only well inside its visible area, which is smaller than the tile', () => {
    assert.equal(findTouchedTile({ x: 200 + 40 * 0.25, y: 0 }, tiles, new Set(), 0, 40)?.id, 'c1');
    assert.equal(findTouchedTile({ x: 200 + 40 * 0.35, y: 0 }, tiles, new Set(), 0, 40), null);
    assert.equal(findTouchedTile({ x: 400 + 40 * 0.4, y: 0 }, tiles, new Set(), 0, 40), null);
    assert.ok(BUMP_RADIUS_FACTOR < 0.5);
  });

  it('ignores tiles that are already collected', () => {
    assert.equal(findTouchedTile({ x: 0, y: 0 }, tiles, new Set(['c0']), 1, 40), null);
  });
});
