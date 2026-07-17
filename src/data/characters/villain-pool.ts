import { GameMode } from '@/features/play/logic/game-modes';
import { getCharactersByRole } from './character-roster';

/**
 * Game-agnostic villain pool model (architecture doc Section 25.10.2). A sibling to
 * character-roster.ts / character-images.ts — carries no PlayScreen/Honey-Pot-Flick assumptions
 * so future games can reuse it unchanged.
 */
export type VillainPoolConfig = {
  /** Villain ids eligible in any mode that has no explicit override below.
   *  Ids reference CHARACTER_ROSTER entries with role === 'villain'. */
  defaultPool: string[];
  /** Optional per-mode narrowing. A mode listed here uses this subset instead
   *  of defaultPool; a mode absent here falls back to defaultPool. */
  poolByMode?: Partial<Record<GameMode, string[]>>;
};

export function getEligibleVillains(config: VillainPoolConfig, mode: GameMode): string[] {
  return config.poolByMode?.[mode] ?? config.defaultPool;
}

/**
 * Pick a villain uniformly at random from the eligible pool, excluding the immediately previous
 * villain. Pure — RNG is injected for testability. See architecture 25.10.3.
 *
 * Rules:
 *  - eligible.length === 0 -> return null (misconfiguration; caller no-ops).
 *  - eligible.length === 1 -> return that villain, EVEN IF it repeats lastVillainId
 *    (a one-villain pool can only ever repeat; the no-repeat rule yields to it).
 *  - lastVillainId == null (nothing played yet) -> uniform pick over the full pool.
 *  - otherwise -> uniform pick over (eligible minus lastVillainId).
 */
export function pickNextVillain(
  eligible: string[],
  lastVillainId: string | null,
  random: () => number = Math.random,
): string | null {
  if (eligible.length === 0) return null;
  if (eligible.length === 1) return eligible[0];
  const candidates =
    lastVillainId == null ? eligible : eligible.filter((id) => id !== lastVillainId);
  // candidates is guaranteed non-empty here: eligible.length >= 2, and the filter
  // removes at most one id. (If lastVillainId isn't in eligible, nothing is removed.)
  const index = Math.floor(random() * candidates.length);
  return candidates[index];
}

/**
 * The shared villain pool actually used by the app today: every villain in CHARACTER_ROSTER is
 * eligible in every mode (25.10.2's confirmed product decision — a single shared pool, not
 * narrowed per mode). `poolByMode` stays unset so per-mode subsets remain a cheap future data
 * edit rather than a model change. Deriving `defaultPool` from CHARACTER_ROSTER (rather than
 * hand-listing ids here) keeps this in sync automatically as villains are added to the roster.
 */
export const VILLAIN_POOL_CONFIG: VillainPoolConfig = {
  defaultPool: getCharactersByRole('villain').map((character) => character.id),
};
