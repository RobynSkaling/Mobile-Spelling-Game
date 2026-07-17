import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getEligibleVillains, pickNextVillain, VillainPoolConfig } from './villain-pool';

describe('getEligibleVillains', () => {
  it('falls back to defaultPool when the mode has no override', () => {
    const config: VillainPoolConfig = { defaultPool: ['a', 'b'] };
    assert.deepEqual(getEligibleVillains(config, 'easy'), ['a', 'b']);
  });

  it('uses the per-mode subset when one is configured', () => {
    const config: VillainPoolConfig = { defaultPool: ['a', 'b'], poolByMode: { crazy: ['b'] } };
    assert.deepEqual(getEligibleVillains(config, 'crazy'), ['b']);
    assert.deepEqual(getEligibleVillains(config, 'easy'), ['a', 'b']);
  });
});

describe('pickNextVillain', () => {
  it('returns null for an empty pool', () => {
    assert.equal(pickNextVillain([], null), null);
    assert.equal(pickNextVillain([], 'a'), null);
  });

  it('always returns the sole villain in a single-villain pool, even if it repeats', () => {
    assert.equal(pickNextVillain(['a'], 'a'), 'a');
    assert.equal(pickNextVillain(['a'], null), 'a');
  });

  it('picks uniformly over the full pool when nothing has been played yet', () => {
    const random = () => 0; // index 0
    assert.equal(pickNextVillain(['a', 'b', 'c'], null, random), 'a');
    const randomLast = () => 0.999999; // index 2
    assert.equal(pickNextVillain(['a', 'b', 'c'], null, randomLast), 'c');
  });

  it('excludes the previous villain from the candidate set', () => {
    // With 'b' excluded, candidates are ['a', 'c']; random() = 0 -> index 0 -> 'a'.
    const random = () => 0;
    assert.equal(pickNextVillain(['a', 'b', 'c'], 'b', random), 'a');
    // random() close to 1 -> last candidate index -> 'c'.
    const randomLast = () => 0.999999;
    assert.equal(pickNextVillain(['a', 'b', 'c'], 'b', randomLast), 'c');
  });

  it('never returns the excluded villain across the full RNG range', () => {
    for (let step = 0; step <= 10; step += 1) {
      const value = step / 10 === 1 ? 0.999999 : step / 10;
      const result = pickNextVillain(['a', 'b'], 'a', () => value);
      assert.equal(result, 'b');
    }
  });
});
