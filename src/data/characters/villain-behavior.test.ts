import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GAME_MODES } from '@/features/play/logic/game-modes';
import { getVillainBehaviorTier, MODE_TIER, VillainBehaviorTier } from './villain-behavior';

describe('MODE_TIER', () => {
  it('maps every mode to the shared age-targeting ladder in ascending order', () => {
    assert.equal(MODE_TIER.easy, VillainBehaviorTier.Passive);
    assert.equal(MODE_TIER.hard, VillainBehaviorTier.Taunting);
    assert.equal(MODE_TIER.crazy, VillainBehaviorTier.Interfering);
    assert.equal(MODE_TIER.impossible, VillainBehaviorTier.Relentless);
  });

  it('has an entry for every GameMode', () => {
    for (const mode of GAME_MODES) {
      assert.ok(mode in MODE_TIER, `missing tier mapping for mode '${mode}'`);
    }
  });
});

describe('getVillainBehaviorTier', () => {
  it('resolves the tier for a given mode', () => {
    assert.equal(getVillainBehaviorTier('crazy'), VillainBehaviorTier.Interfering);
  });
});
