import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  acknowledgeChainBreak,
  BEE_LINE_MODE_CONFIG,
  buildBeeLineField,
  createCollectionState,
  DEFAULT_BEE_LINE_TUNING,
  resolvePickup,
  ScatteredLetter,
} from './bee-line';
import { GAME_MODES } from './game-modes';

const FIELD = { x: 0, y: 0, width: 300, height: 300 };

describe('BEE_LINE_MODE_CONFIG', () => {
  it('has an entry for every game mode', () => {
    for (const mode of GAME_MODES) {
      assert.ok(BEE_LINE_MODE_CONFIG[mode], `expected a config for ${mode}`);
    }
  });

  it('is tap-only with no towed trail at easy, drag+trail at hard and above', () => {
    assert.equal(BEE_LINE_MODE_CONFIG.easy.input, 'tap');
    assert.equal(BEE_LINE_MODE_CONFIG.easy.showTowedTrail, false);
    assert.equal(BEE_LINE_MODE_CONFIG.hard.input, 'drag');
    assert.equal(BEE_LINE_MODE_CONFIG.hard.showTowedTrail, true);
    assert.equal(BEE_LINE_MODE_CONFIG.crazy.input, 'drag');
    assert.equal(BEE_LINE_MODE_CONFIG.impossible.input, 'drag');
  });

  it('leaves decoys/randomization/timer/music unset at every tier (Epic 18 scope only)', () => {
    for (const mode of GAME_MODES) {
      const config = BEE_LINE_MODE_CONFIG[mode];
      assert.equal(config.decoyLetterCount, 0);
      assert.equal(config.randomizePositionsPerAttempt, false);
      assert.equal(config.timer, undefined);
      assert.equal(config.music, undefined);
    }
  });
});

describe('buildBeeLineField', () => {
  it('produces one correct tile per letter, in spelling order via orderIndex', () => {
    const field = buildBeeLineField('cat', 0, FIELD);
    const correctTiles = field.tiles.filter((tile) => tile.kind === 'correct');

    assert.equal(correctTiles.length, 3);
    assert.deepEqual(
      correctTiles.map((tile) => tile.letter),
      ['c', 'a', 't'],
    );
    assert.deepEqual(
      correctTiles.map((tile) => tile.orderIndex),
      [0, 1, 2],
    );
  });

  it('models repeated letters as one tile per occurrence with distinct orderIndex', () => {
    const field = buildBeeLineField('bee', 0, FIELD);
    const correctTiles = field.tiles.filter((tile) => tile.kind === 'correct');

    assert.equal(correctTiles.length, 3);
    assert.deepEqual(
      correctTiles.map((tile) => tile.orderIndex),
      [0, 1, 2],
    );
    assert.deepEqual(
      correctTiles.map((tile) => tile.letter),
      ['b', 'e', 'e'],
    );
  });

  it('adds the requested number of decoy tiles, structurally identical except kind/orderIndex', () => {
    const field = buildBeeLineField('cat', 4, FIELD);
    const decoyTiles = field.tiles.filter((tile) => tile.kind === 'decoy');

    assert.equal(decoyTiles.length, 4);
    for (const tile of decoyTiles) {
      assert.equal(tile.orderIndex, null);
      assert.equal(typeof tile.letter, 'string');
      assert.equal(tile.letter.length, 1);
      assert.ok(typeof tile.position.x === 'number' && typeof tile.position.y === 'number');
    }
  });

  it('never picks a decoy letter that is already in the word', () => {
    const field = buildBeeLineField('cat', 8, FIELD);
    const decoyLetters = field.tiles.filter((tile) => tile.kind === 'decoy').map((tile) => tile.letter);

    assert.ok(decoyLetters.every((letter) => !'cat'.includes(letter)));
  });

  it('keeps every tile at least minTileSpacingPx away from every other tile', () => {
    const field = buildBeeLineField('spelling', 6, FIELD, { minTileSpacingPx: 40 });

    for (let i = 0; i < field.tiles.length; i += 1) {
      for (let j = i + 1; j < field.tiles.length; j += 1) {
        const a = field.tiles[i].position;
        const b = field.tiles[j].position;
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        assert.ok(distance >= 40 - 0.001, `tiles ${i} and ${j} are only ${distance}px apart`);
      }
    }
  });

  it('keeps every tile within the field bounds', () => {
    const field = buildBeeLineField('honey', 5, FIELD, { tileSize: 50 });

    for (const tile of field.tiles) {
      assert.ok(tile.position.x >= FIELD.x && tile.position.x <= FIELD.x + FIELD.width);
      assert.ok(tile.position.y >= FIELD.y && tile.position.y <= FIELD.y + FIELD.height);
    }
  });

  it('is deterministic given an injected RNG', () => {
    const random = () => 0.5;
    const first = buildBeeLineField('cat', 2, FIELD, { random });
    const second = buildBeeLineField('cat', 2, FIELD, { random });

    assert.deepEqual(first, second);
  });
});

describe('createCollectionState', () => {
  it('starts empty, intact, in-progress', () => {
    const state = createCollectionState('cat');
    assert.deepEqual(state, {
      word: 'cat',
      collected: [],
      nextExpectedIndex: 0,
      chainIntact: true,
      status: 'in-progress',
    });
  });
});

describe('resolvePickup', () => {
  function correctTile(letter: string, orderIndex: number): ScatteredLetter {
    return { id: `correct-${orderIndex}`, letter, kind: 'correct', orderIndex, position: { x: 0, y: 0 } };
  }

  function decoyTile(letter: string): ScatteredLetter {
    return { id: `decoy-${letter}`, letter, kind: 'decoy', orderIndex: null, position: { x: 0, y: 0 } };
  }

  it('classifies the next expected letter as correct and advances the chain', () => {
    const state = createCollectionState('cat');
    const result = resolvePickup(state, correctTile('c', 0), DEFAULT_BEE_LINE_TUNING);

    assert.equal(result.outcome, 'correct');
    assert.equal(result.chainBroke, false);
    assert.deepEqual(result.next.collected, ['correct-0']);
    assert.equal(result.next.nextExpectedIndex, 1);
    assert.equal(result.next.status, 'in-progress');
  });

  it('completes the word on the final correct letter', () => {
    let state = createCollectionState('at');
    state = resolvePickup(state, correctTile('a', 0), DEFAULT_BEE_LINE_TUNING).next;
    const result = resolvePickup(state, correctTile('t', 1), DEFAULT_BEE_LINE_TUNING);

    assert.equal(result.outcome, 'correct');
    assert.equal(result.next.status, 'complete');
  });

  it('classifies a genuine word letter picked out of order as wrong-order', () => {
    const state = createCollectionState('cat');
    const result = resolvePickup(state, correctTile('t', 2), DEFAULT_BEE_LINE_TUNING);

    assert.equal(result.outcome, 'wrong-order');
  });

  it('classifies a decoy tile as wrong-letter', () => {
    const state = createCollectionState('cat');
    const result = resolvePickup(state, decoyTile('z'), DEFAULT_BEE_LINE_TUNING);

    assert.equal(result.outcome, 'wrong-letter');
  });

  describe('ChainPolicy: keep-chain', () => {
    it('bounces a wrong-order pickup back without touching the collected chain', () => {
      let state = createCollectionState('cats');
      state = resolvePickup(state, correctTile('c', 0), DEFAULT_BEE_LINE_TUNING).next;

      const result = resolvePickup(state, correctTile('s', 3), {
        wrongOrderPolicy: 'keep-chain',
        wrongLetterPolicy: 'break-chain',
      });

      assert.equal(result.chainBroke, false);
      assert.deepEqual(result.next, state);
    });
  });

  describe('ChainPolicy: break-chain', () => {
    it('scatters (empties) the chain on a wrong-letter pickup by default', () => {
      let state = createCollectionState('cats');
      state = resolvePickup(state, correctTile('c', 0), DEFAULT_BEE_LINE_TUNING).next;

      const result = resolvePickup(state, decoyTile('z'), DEFAULT_BEE_LINE_TUNING);

      assert.equal(result.outcome, 'wrong-letter');
      assert.equal(result.chainBroke, true);
      assert.deepEqual(result.next.collected, []);
      assert.equal(result.next.nextExpectedIndex, 0);
      assert.equal(result.next.chainIntact, false);
    });

    it('also breaks the chain on wrong-order when wrongOrderPolicy is break-chain', () => {
      let state = createCollectionState('cats');
      state = resolvePickup(state, correctTile('c', 0), DEFAULT_BEE_LINE_TUNING).next;

      const result = resolvePickup(state, correctTile('s', 3), {
        wrongOrderPolicy: 'break-chain',
        wrongLetterPolicy: 'break-chain',
      });

      assert.equal(result.outcome, 'wrong-order');
      assert.equal(result.chainBroke, true);
      assert.deepEqual(result.next.collected, []);
    });
  });

  it('easy (no decoys, default keep-chain) can only ever wobble, never scatter', () => {
    // easy has no decoys per BEE_LINE_MODE_CONFIG, so resolvePickup is only ever called with
    // 'correct'-kind tiles there. Simulate every possible pickup against a word with no decoys.
    const word = 'cat';
    let state = createCollectionState(word);
    const tiles = word.split('').map((letter, index) => correctTile(letter, index));

    // Pick the last letter first (a wrong-order mistake) and confirm it never scatters under
    // easy's tuning.
    const wrongOrderResult = resolvePickup(state, tiles[2], DEFAULT_BEE_LINE_TUNING);
    assert.equal(wrongOrderResult.outcome, 'wrong-order');
    assert.equal(wrongOrderResult.chainBroke, false);
    assert.equal(wrongOrderResult.next.status, 'in-progress');

    // Now actually complete the word in order and confirm no wrong-letter outcome is reachable —
    // there is no decoy tile to construct from an easy-tier field in the first place.
    for (const tile of tiles) {
      const result = resolvePickup(state, tile, DEFAULT_BEE_LINE_TUNING);
      assert.notEqual(result.outcome, 'wrong-letter');
      assert.equal(result.chainBroke, false);
      state = result.next;
    }
    assert.equal(state.status, 'complete');
  });
});

describe('acknowledgeChainBreak', () => {
  it('flips chainIntact back to true after a break', () => {
    let state = createCollectionState('cats');
    state = resolvePickup(state, { id: 'decoy-z', letter: 'z', kind: 'decoy', orderIndex: null, position: { x: 0, y: 0 } }, DEFAULT_BEE_LINE_TUNING).next;
    assert.equal(state.chainIntact, false);

    const acknowledged = acknowledgeChainBreak(state);
    assert.equal(acknowledged.chainIntact, true);
  });

  it('is a no-op when the chain is already intact', () => {
    const state = createCollectionState('cats');
    assert.deepEqual(acknowledgeChainBreak(state), state);
  });
});
