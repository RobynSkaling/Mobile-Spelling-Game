import { GameMode } from '@/features/play/logic/game-modes';

/**
 * Game-agnostic escalation ladder + capability vocabulary (architecture doc Section 25.10.4).
 * Reused across every game in the portfolio — the tier names/order encode a deliberate,
 * cross-game age-targeting curve and must not be renamed, renumbered, or redefined per-game.
 */
export enum VillainBehaviorTier {
  Passive = 0, // present only: idle + occasional taunt animation, zero gameplay effect
  Taunting = 1, // reacts to the child's misses with taunt/challenge states, still no gameplay effect
  Interfering = 2, // actively interferes with gameplay state (the "steals a honey pot" band)
  Relentless = 3, // maximum, compounding/faster interference
}

/** Abstract, game-neutral interference vocabulary. A game maps each of these to a concrete
 *  handler; a game that doesn't implement one simply never lists it. */
export type VillainCapability =
  | 'Taunt' // play Challenging/BeingNaughty state + optional taunt audio on trigger
  | 'StealResource' // remove/consume a resource the child needs
  | 'ObscureTarget' // hide or move the thing the child is aiming at
  | 'InjectDecoy'; // add misleading elements beyond the mode's baseline

export type VillainBehaviorProfile = {
  tier: VillainBehaviorTier;
  capabilities: VillainCapability[];
  /** Optional tuning knobs the game's handlers read; all optional so a profile can be
   *  capability-only. */
  interferenceIntervalMs?: number;
  maxConcurrentInterferences?: number;
};

/**
 * The shared `mode -> tier` ladder (25.10.4). Aligned to the age-targeting curve every planned
 * game in the portfolio shares (easy/hard/crazy/impossible ~= 6/7/8/9-year-olds). A game that
 * needs a genuinely different difficulty shape should add its own modes/overrides rather than
 * repurposing these four.
 */
export const MODE_TIER: Record<GameMode, VillainBehaviorTier> = {
  easy: VillainBehaviorTier.Passive,
  hard: VillainBehaviorTier.Taunting,
  crazy: VillainBehaviorTier.Interfering,
  impossible: VillainBehaviorTier.Relentless,
};

export function getVillainBehaviorTier(mode: GameMode): VillainBehaviorTier {
  return MODE_TIER[mode];
}
