/**
 * Pure per-child storage logic for Epic 31: key scoping, per-child cleanup, and the one-time
 * migration planner. No AsyncStorage/Zustand here, so all of it is unit-tested; the stores and
 * `per-child-data.ts` just execute what this module decides.
 */
import { dailyRewardsKey } from './daily-rewards-logic';

/** Base keys of the per-child stores. Final Test results are new in Epic 31 (no legacy key). */
export const PROGRESS_SESSIONS_BASE_KEY = 'progress.sessions';
export const PROGRESS_WORD_STATS_BASE_KEY = 'progress.wordStats';
export const GAME_MODE_BASE_KEY = 'game-mode';
export const SELECTED_GAME_BASE_KEY = 'selected-game';
export const SELECTED_LIST_BASE_KEY = 'word-lists.selectedId';
export const FINAL_TEST_BASE_KEY = 'finalTests';

export const FAMILY_BLOB_KEY = 'family.v1';
export const LEGACY_PROFILE_KEY = 'profile';
export const MIGRATION_MARKER_KEY = 'perChildData.migratedVersion';
export const PER_CHILD_DATA_VERSION = 1;

/** `progress.sessions` -> `progress.sessions.child.<id>`. */
export function childKey(baseKey: string, childId: string): string {
  return `${baseKey}.child.${childId}`;
}

/** Every AsyncStorage key that belongs to one child. Removing a child removes exactly these. */
export function childDataKeys(childId: string): string[] {
  return [
    childKey(PROGRESS_SESSIONS_BASE_KEY, childId),
    childKey(PROGRESS_WORD_STATS_BASE_KEY, childId),
    dailyRewardsKey(childId),
    childKey(GAME_MODE_BASE_KEY, childId),
    childKey(SELECTED_GAME_BASE_KEY, childId),
    childKey(SELECTED_LIST_BASE_KEY, childId),
    childKey(FINAL_TEST_BASE_KEY, childId),
  ];
}

/** The pre-Epic-31 per-device keys, mapped to the per-child key each moves to. */
export function legacyKeyMoves(childId: string): { from: string; to: string }[] {
  return [
    { from: PROGRESS_SESSIONS_BASE_KEY, to: childKey(PROGRESS_SESSIONS_BASE_KEY, childId) },
    { from: PROGRESS_WORD_STATS_BASE_KEY, to: childKey(PROGRESS_WORD_STATS_BASE_KEY, childId) },
    { from: dailyRewardsKey(), to: dailyRewardsKey(childId) },
    { from: GAME_MODE_BASE_KEY, to: childKey(GAME_MODE_BASE_KEY, childId) },
    { from: SELECTED_GAME_BASE_KEY, to: childKey(SELECTED_GAME_BASE_KEY, childId) },
    { from: SELECTED_LIST_BASE_KEY, to: childKey(SELECTED_LIST_BASE_KEY, childId) },
  ];
}

export type MigrationInput = {
  /** Ids in family order; the first child inherits the per-device data. */
  childIds: string[];
  /** Value of MIGRATION_MARKER_KEY, or null if never written. */
  markerVersion: number | null;
  /** Current values of every key the planner may care about (missing/absent = undefined or null). */
  stored: Record<string, string | null | undefined>;
  /** True once the family blob is actually in storage; only then is the legacy profile deletable. */
  familyBlobStored: boolean;
};

export type MigrationPlan = {
  /** Written first. */
  writes: { key: string; value: string }[];
  /** Written after `writes`, once all data is safely in its new place. */
  marker: { key: string; value: string } | null;
  /** Only after `writes` and `marker` are done. */
  deletes: string[];
};

const EMPTY_PLAN: MigrationPlan = { writes: [], marker: null, deletes: [] };

function has(stored: MigrationInput['stored'], key: string): boolean {
  return stored[key] !== undefined && stored[key] !== null;
}

/**
 * Decides what the one-time move to per-child keys must write and delete. Safe to re-run at any
 * point: it is computed from what is in storage now.
 *  - Writes come before the marker, which comes before deletes, so a kill at any step loses nothing.
 *  - A write never overwrites a key that already exists.
 *  - Once the marker is set, data is never copied again (the first child may since have been
 *    removed); only leftover legacy keys from an interrupted cleanup are deleted.
 *  - With no children yet (fresh install) nothing happens: there is no one to attach data to.
 */
export function planPerChildMigration(input: MigrationInput): MigrationPlan {
  const { childIds, markerVersion, stored, familyBlobStored } = input;
  if (childIds.length === 0) {
    return EMPTY_PLAN;
  }

  const moves = legacyKeyMoves(childIds[0]);
  const alreadyMigrated = markerVersion !== null && markerVersion >= PER_CHILD_DATA_VERSION;

  const writes = alreadyMigrated
    ? []
    : moves
        .filter((move) => has(stored, move.from) && !has(stored, move.to))
        .map((move) => ({ key: move.to, value: stored[move.from] as string }));

  const deletes = moves.filter((move) => has(stored, move.from)).map((move) => move.from);
  if (familyBlobStored && has(stored, LEGACY_PROFILE_KEY)) {
    deletes.push(LEGACY_PROFILE_KEY);
  }

  const marker = alreadyMigrated ? null : { key: MIGRATION_MARKER_KEY, value: String(PER_CHILD_DATA_VERSION) };
  return { writes, marker, deletes };
}

/** Every key the planner reads, so the executor can fetch them in one call. */
export function migrationKeys(childId: string | null): string[] {
  const keys = [LEGACY_PROFILE_KEY];
  if (childId) {
    for (const move of legacyKeyMoves(childId)) {
      keys.push(move.from, move.to);
    }
  }
  return keys;
}
