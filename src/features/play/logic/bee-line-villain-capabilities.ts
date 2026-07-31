import { VillainBehaviorTier, VillainCapability } from '@/data/characters/villain-behavior';

/**
 * Bee Line's per-game `tier -> capabilities` data (architecture 26.8) — the concrete kit this game
 * unlocks at each tier from the shared, game-agnostic tier ladder (`villain-behavior.ts`).
 *
 * Deliberately capability-light compared to `villain-capabilities.ts` (Honey Pot Flick's table):
 * no tier ever lists `'StealResource'`. UX Step 19 stages Bee Line's villain as a non-mechanical
 * heckling spectator only, never a honey-steal threat, so `Passive`/`Taunting` are empty (villain
 * absent/idle, no heckle at all — `easy`/`hard` never stage a villain) and `Interfering`/
 * `Relentless` list only `'Taunt'` (an animation-only reaction to mistakes/completions, zero
 * gameplay effect). Because `'StealResource'` never appears here, there is no `StealAttemptHost`,
 * no larder interaction, and no `honeyStash` touch anywhere Bee Line's code reads this table.
 */
export const BEE_LINE_VILLAIN_CAPABILITIES: Record<VillainBehaviorTier, VillainCapability[]> = {
  [VillainBehaviorTier.Passive]: [],
  [VillainBehaviorTier.Taunting]: [],
  [VillainBehaviorTier.Interfering]: ['Taunt'],
  [VillainBehaviorTier.Relentless]: ['Taunt'],
};

export function getBeeLineVillainCapabilities(tier: VillainBehaviorTier): VillainCapability[] {
  return BEE_LINE_VILLAIN_CAPABILITIES[tier] ?? [];
}
