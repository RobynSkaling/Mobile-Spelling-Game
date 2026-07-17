import { VillainBehaviorTier, VillainCapability } from '@/data/characters/villain-behavior';

/**
 * Honey Pot Flick's per-game `tier -> capabilities` data (architecture 25.10.4). The abstract
 * tier ladder is game-agnostic; this table is the concrete kit this game unlocks at each tier.
 *
 * `Relentless`'s extra intensity over `Interfering` comes entirely from `StealTuning` (a tighter
 * wind-up, the stall trigger) rather than an extra capability like `ObscureTarget` — that's not
 * built this epic (see architecture 25.11's scope).
 *
 * `Taunting` lists only `'Taunt'` here even though its `StealTuning` (steal-attempt.ts) also
 * telegraphs a (never-completing) steal attempt: this table describes what can actually mutate
 * gameplay state, and a telegraph that can never complete never does. Whether the telegraph
 * itself runs at a tier is decided by `getStealTuning(tier)` being non-null, not by this table.
 */
export const HONEY_POT_FLICK_CAPABILITIES: Record<VillainBehaviorTier, VillainCapability[]> = {
  [VillainBehaviorTier.Passive]: ['Taunt'],
  [VillainBehaviorTier.Taunting]: ['Taunt'],
  [VillainBehaviorTier.Interfering]: ['Taunt', 'StealResource'],
  [VillainBehaviorTier.Relentless]: ['Taunt', 'StealResource'],
};

export function getVillainCapabilities(tier: VillainBehaviorTier): VillainCapability[] {
  return HONEY_POT_FLICK_CAPABILITIES[tier] ?? [];
}
