import { VillainBehaviorTier } from './villain-behavior';

/**
 * Game-agnostic `StealAttempt` state machine (architecture doc Section 25.11.3/25.11.6):
 *
 *   Safe -> Telegraphing -> { Defended | Stolen } -> Safe
 *
 * Pure and RN-independent — no real `setTimeout` lives here. Timing is injected: the host owns
 * the actual wind-up clock (its own `setTimeout` for `tuning.windUpMs`) and calls
 * `resolveStealWindUp` when it elapses, matching the project's habit of splitting pure logic from
 * React (see sprite-animation.ts / villain-pool.ts's `pickNextVillain`).
 *
 * This module only ever tracks one attempt at a time (`triggerStealAttempt` no-ops while already
 * Telegraphing), which matches every launch tier's `maxConcurrent: 1` in `STEAL_TUNING_BY_TIER`.
 * A future tier that genuinely needs more than one concurrent attempt would need to extend this
 * state shape to a list — not warranted today.
 */

export type StealTuning = {
  /** How long (ms) the villain telegraphs before the attempt resolves if left undefended. */
  windUpMs: number;
  /** Whether an undefended wind-up can actually complete into a steal. `false` at the `Taunting`
   *  tutorial tier — the grab always fails/retreats even if unanswered. */
  canComplete: boolean;
  /** Whether tapping/flicking the villain during the wind-up also defends (in addition to the
   *  primary defense: the game's own "next correct action" during Telegraphing). */
  allowTapDefense: boolean;
  /** Whether the host should also open an attempt when the child stalls (dithers too long),
   *  not just on a mistake. Only `Relentless` sets this. */
  triggerOnStall: boolean;
  /** How many attempts may be open at once. This module only supports 1; documented here so a
   *  future tier that needs more is an explicit, deliberate model change. */
  maxConcurrent: number;
};

/**
 * Per-tier tuning table (recommended launch defaults, architecture 25.11.4). `null` at `Passive`
 * means `StealResource` is not active at all at that tier — the host must not instantiate any
 * steal machinery, confirming the tier is steal-free.
 */
export const STEAL_TUNING_BY_TIER: Record<VillainBehaviorTier, StealTuning | null> = {
  [VillainBehaviorTier.Passive]: null,
  [VillainBehaviorTier.Taunting]: {
    windUpMs: 4000,
    canComplete: false,
    allowTapDefense: true,
    triggerOnStall: false,
    maxConcurrent: 1,
  },
  [VillainBehaviorTier.Interfering]: {
    windUpMs: 3000,
    canComplete: true,
    allowTapDefense: true,
    triggerOnStall: false,
    maxConcurrent: 1,
  },
  [VillainBehaviorTier.Relentless]: {
    windUpMs: 1800,
    canComplete: true,
    allowTapDefense: true,
    triggerOnStall: true,
    maxConcurrent: 1,
  },
};

export function getStealTuning(tier: VillainBehaviorTier): StealTuning | null {
  return STEAL_TUNING_BY_TIER[tier];
}

export type StealAttemptStatus = 'Safe' | 'Telegraphing';

export type StealAttempt = {
  status: StealAttemptStatus;
  /** Opaque, host-supplied reference to the resource at risk. Present only while Telegraphing. */
  resource: unknown | null;
};

export const SAFE_STEAL_ATTEMPT: StealAttempt = { status: 'Safe', resource: null };

/**
 * Opens an attempt (Safe -> Telegraphing) on a trigger event. No-op — returns `current`
 * unchanged — if an attempt is already open, or if the host has no resource to put at risk
 * (e.g. the resource is at its floor: `pickResourceInJeopardy()` returning null on the host side
 * is exactly how "only if stash > floor" from the state diagram is enforced here).
 */
export function triggerStealAttempt(current: StealAttempt, resource: unknown | null): StealAttempt {
  if (current.status === 'Telegraphing' || resource == null) {
    return current;
  }
  return { status: 'Telegraphing', resource };
}

/**
 * A defense — either the primary (the game's own "next correct action") or the secondary
 * (tapping/flicking the villain, when `tuning.allowTapDefense`) — always succeeds while
 * Telegraphing. No-op when Safe (nothing to defend).
 */
export function defendStealAttempt(current: StealAttempt): StealAttempt {
  if (current.status !== 'Telegraphing') {
    return current;
  }
  return SAFE_STEAL_ATTEMPT;
}

export type StealAttemptOutcome =
  | 'Stolen' // wind-up elapsed undefended, and the tier allows completion
  | 'Retreated' // wind-up elapsed undefended, but the tier doesn't allow completion (Taunting)
  | 'NoOp'; // nothing was open to resolve

/**
 * Called by the host when its own wind-up timer (`tuning.windUpMs`) elapses undefended. Pure:
 * decides whether the attempt completes into a steal, and always returns to Safe either way.
 */
export function resolveStealWindUp(
  current: StealAttempt,
  tuning: StealTuning,
): { next: StealAttempt; outcome: StealAttemptOutcome; resource: unknown | null } {
  if (current.status !== 'Telegraphing') {
    return { next: current, outcome: 'NoOp', resource: null };
  }

  return {
    next: SAFE_STEAL_ATTEMPT,
    outcome: tuning.canComplete ? 'Stolen' : 'Retreated',
    resource: current.resource,
  };
}
