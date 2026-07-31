import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { VillainBehaviorTier } from '@/data/characters/villain-behavior';
import { getBeeLineVillainCapabilities } from './bee-line-villain-capabilities';

describe('getBeeLineVillainCapabilities', () => {
  it('is empty (villain absent/idle, no heckle) at Passive and Taunting', () => {
    assert.deepEqual(getBeeLineVillainCapabilities(VillainBehaviorTier.Passive), []);
    assert.deepEqual(getBeeLineVillainCapabilities(VillainBehaviorTier.Taunting), []);
  });

  it('is Taunt-only at Interfering and Relentless', () => {
    assert.deepEqual(getBeeLineVillainCapabilities(VillainBehaviorTier.Interfering), ['Taunt']);
    assert.deepEqual(getBeeLineVillainCapabilities(VillainBehaviorTier.Relentless), ['Taunt']);
  });

  it('never grants StealResource at any tier — Bee Line has no honey-steal mechanic', () => {
    const allTiers = [
      VillainBehaviorTier.Passive,
      VillainBehaviorTier.Taunting,
      VillainBehaviorTier.Interfering,
      VillainBehaviorTier.Relentless,
    ];
    for (const tier of allTiers) {
      assert.ok(!getBeeLineVillainCapabilities(tier).includes('StealResource'));
    }
  });
});
