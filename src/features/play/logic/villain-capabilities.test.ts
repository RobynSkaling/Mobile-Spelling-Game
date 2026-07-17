import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { VillainBehaviorTier } from '@/data/characters/villain-behavior';
import { getVillainCapabilities } from './villain-capabilities';

describe('getVillainCapabilities', () => {
  it('is Taunt-only at Passive and Taunting', () => {
    assert.deepEqual(getVillainCapabilities(VillainBehaviorTier.Passive), ['Taunt']);
    assert.deepEqual(getVillainCapabilities(VillainBehaviorTier.Taunting), ['Taunt']);
  });

  it('adds StealResource at Interfering and Relentless', () => {
    assert.deepEqual(getVillainCapabilities(VillainBehaviorTier.Interfering), ['Taunt', 'StealResource']);
    assert.deepEqual(getVillainCapabilities(VillainBehaviorTier.Relentless), ['Taunt', 'StealResource']);
  });
});
