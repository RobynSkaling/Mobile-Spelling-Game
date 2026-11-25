import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { childKey, FINAL_TEST_BASE_KEY } from './child-data-logic';
import { appendFinalTestResult, FinalTestResult } from './final-test-results-logic';

interface FinalTestState {
  results: FinalTestResult[];
  loadedChildId: string | null;
  isHydrated: boolean;
  loadForChild: (childId: string | null) => Promise<void>;
  recordResult: (result: FinalTestResult) => void;
}

export const useFinalTestStore = create<FinalTestState>((set, get) => ({
  results: [],
  loadedChildId: null,
  isHydrated: false,

  loadForChild: async (childId) => {
    // Reset synchronously so the previous child's results are never shown for the new child.
    set({ results: [], loadedChildId: childId, isHydrated: false });
    const stored = childId ? await AsyncStorage.getItem(childKey(FINAL_TEST_BASE_KEY, childId)) : null;
    if (get().loadedChildId !== childId) {
      return; // switched again while loading; the newer load owns the state
    }
    set({ results: stored ? JSON.parse(stored) : [], isHydrated: true });
  },

  recordResult: (result) => {
    const { results, loadedChildId } = get();
    if (!loadedChildId) {
      return;
    }
    const next = appendFinalTestResult(results, result);
    set({ results: next });
    AsyncStorage.setItem(childKey(FINAL_TEST_BASE_KEY, loadedChildId), JSON.stringify(next));
  },
}));
