import AsyncStorage from '@react-native-async-storage/async-storage';
import { FAMILY_BLOB_KEY, MIGRATION_MARKER_KEY, migrationKeys, planPerChildMigration } from './child-data-logic';
import { useDailyRewardsStore } from './daily-rewards-store';
import { useFamilyStore } from './family-store';
import { useFinalTestStore } from './final-test-store';
import { useGameModeStore } from './game-mode-store';
import { useGameSelectionStore } from './game-selection-store';
import { useProgressStore } from './progress-store';
import { useWordListStore } from './word-list-store';

/** Moves the pre-Epic-31 per-device keys onto the first child. See `planPerChildMigration`. */
export async function migratePerChildData(): Promise<void> {
  const { children } = useFamilyStore.getState();
  const childIds = children.map((child) => child.id);
  const keys = [...migrationKeys(childIds[0] ?? null), MIGRATION_MARKER_KEY, FAMILY_BLOB_KEY];
  const entries = await AsyncStorage.multiGet(keys);
  const stored = Object.fromEntries(entries);
  const markerVersion = stored[MIGRATION_MARKER_KEY] ? Number(stored[MIGRATION_MARKER_KEY]) : null;

  const plan = planPerChildMigration({
    childIds,
    markerVersion: Number.isFinite(markerVersion) ? markerVersion : null,
    stored,
    familyBlobStored: stored[FAMILY_BLOB_KEY] != null,
  });

  // Order matters: new keys, then the marker, then deletes, so a kill at any point loses nothing.
  if (plan.writes.length > 0) {
    await AsyncStorage.multiSet(plan.writes.map((write) => [write.key, write.value]));
  }
  if (plan.marker) {
    await AsyncStorage.setItem(plan.marker.key, plan.marker.value);
  }
  if (plan.deletes.length > 0) {
    await AsyncStorage.multiRemove(plan.deletes);
  }
}

/** Reloads every per-child store for this child (null = nobody yet, stores sit empty). */
export async function loadPerChildStores(childId: string | null): Promise<void> {
  await Promise.all([
    useProgressStore.getState().loadForChild(childId),
    useDailyRewardsStore.getState().loadForChild(childId),
    useGameModeStore.getState().loadForChild(childId),
    useGameSelectionStore.getState().loadForChild(childId),
    useFinalTestStore.getState().loadForChild(childId),
    useWordListStore.getState().loadSelectedForChild(childId),
  ]);
}

let started: Promise<void> | null = null;

/**
 * App startup: family and shared lists first, then the one-time migration, then the active child's
 * data. After that, any change of active child (switching, removing the active child, adding the
 * first child) reloads the per-child stores immediately, with no restart.
 */
export function startAppData(): Promise<void> {
  if (!started) {
    started = (async () => {
      await useFamilyStore.getState().loadFamily();
      await useWordListStore.getState().loadLists();
      await migratePerChildData();
      await loadPerChildStores(useFamilyStore.getState().activeChildId);

      useFamilyStore.subscribe((state, previous) => {
        if (state.activeChildId !== previous.activeChildId) {
          void loadPerChildStores(state.activeChildId);
        }
      });
      // A child may have been picked while loading; make sure the stores match.
      const current = useFamilyStore.getState().activeChildId;
      if (current !== useProgressStore.getState().loadedChildId) {
        void loadPerChildStores(current);
      }
    })();
  }
  return started;
}
