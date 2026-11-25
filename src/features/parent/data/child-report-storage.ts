/**
 * Read-only access to any child's stored data for the Parent View (Epic 32), plus the two parent
 * actions that must target the viewed child. None of it touches `activeChildId` or reloads the
 * live per-child stores, so viewing a child never changes who is playing.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  childKey,
  FINAL_TEST_BASE_KEY,
  PROGRESS_SESSIONS_BASE_KEY,
  PROGRESS_WORD_STATS_BASE_KEY,
  SELECTED_LIST_BASE_KEY,
} from '@/stores/child-data-logic';
import { dailyRewardsKey } from '@/stores/daily-rewards-logic';
import { useProgressStore, WordStat } from '@/stores/progress-store';
import { useWordListStore } from '@/stores/word-list-store';
import { ChildReportData, parseChildReportData } from '../logic/report-logic';

export async function loadChildReport(childId: string): Promise<ChildReportData> {
  const [sessions, wordStats, rewards, finalTests] = await Promise.all([
    AsyncStorage.getItem(childKey(PROGRESS_SESSIONS_BASE_KEY, childId)),
    AsyncStorage.getItem(childKey(PROGRESS_WORD_STATS_BASE_KEY, childId)),
    AsyncStorage.getItem(dailyRewardsKey(childId)),
    AsyncStorage.getItem(childKey(FINAL_TEST_BASE_KEY, childId)),
  ]);
  return parseChildReportData({ sessions, wordStats, rewards, finalTests });
}

/** Clears word stats for exactly one child. Their sessions and everyone else's data are untouched. */
export async function clearWordStatsForChild(childId: string, words: string[]): Promise<void> {
  const progress = useProgressStore.getState();
  if (progress.loadedChildId === childId) {
    progress.clearWordStats(words); // the live store owns this child's key; keep it in sync
    return;
  }
  const key = childKey(PROGRESS_WORD_STATS_BASE_KEY, childId);
  const raw = await AsyncStorage.getItem(key);
  const stats: Record<string, WordStat> = raw ? JSON.parse(raw) : {};
  const remove = new Set(words.map((word) => word.trim().toLowerCase()));
  const next = Object.fromEntries(Object.entries(stats).filter(([word]) => !remove.has(word)));
  await AsyncStorage.setItem(key, JSON.stringify(next));
}

/** Makes `listId` the selected list of exactly one child. */
export async function selectListForChild(childId: string, listId: string): Promise<void> {
  const words = useWordListStore.getState();
  if (words.loadedChildId === childId) {
    words.selectList(listId);
    return;
  }
  await AsyncStorage.setItem(childKey(SELECTED_LIST_BASE_KEY, childId), listId);
}
