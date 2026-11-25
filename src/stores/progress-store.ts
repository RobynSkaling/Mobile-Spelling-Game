import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { childKey, PROGRESS_SESSIONS_BASE_KEY, PROGRESS_WORD_STATS_BASE_KEY } from './child-data-logic';

const MAX_STORED_SESSIONS = 50;

export type SessionRecord = {
  id: string;
  startedAt: number;
  wordsCompleted: number;
  correctFlicks: number;
  missedFlicks: number;
};

export type WordStat = {
  word: string;
  timesCompleted: number;
  timesMissed: number;
  lastPlayedAt: number;
};

/** Writes to the loaded child's keys; with no child loaded (before setup) there is nowhere to write. */
function persist(childId: string | null, sessions: SessionRecord[], wordStats: Record<string, WordStat>) {
  if (!childId) {
    return;
  }
  AsyncStorage.setItem(childKey(PROGRESS_SESSIONS_BASE_KEY, childId), JSON.stringify(sessions));
  AsyncStorage.setItem(childKey(PROGRESS_WORD_STATS_BASE_KEY, childId), JSON.stringify(wordStats));
}

interface ProgressState {
  sessions: SessionRecord[];
  wordStats: Record<string, WordStat>;
  currentSessionId: string | null;
  /** The child whose progress is in memory; every write goes to this child's keys. */
  loadedChildId: string | null;
  isHydrated: boolean;
  loadForChild: (childId: string | null) => Promise<void>;
  startSession: () => void;
  recordCorrectFlick: () => void;
  recordMissedFlick: (word: string) => void;
  recordWordCompleted: (word: string) => void;
  clearWordStats: (words: string[]) => void;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  sessions: [],
  wordStats: {},
  currentSessionId: null,
  loadedChildId: null,
  isHydrated: false,

  loadForChild: async (childId) => {
    // Reset synchronously so the previous child's progress is never shown or written for the new child.
    set({ sessions: [], wordStats: {}, currentSessionId: null, loadedChildId: childId, isHydrated: false });
    const [storedSessions, storedWordStats] = childId
      ? await Promise.all([
          AsyncStorage.getItem(childKey(PROGRESS_SESSIONS_BASE_KEY, childId)),
          AsyncStorage.getItem(childKey(PROGRESS_WORD_STATS_BASE_KEY, childId)),
        ])
      : [null, null];
    if (get().loadedChildId !== childId) {
      return; // switched again while loading; the newer load owns the state
    }

    set({
      sessions: storedSessions ? JSON.parse(storedSessions) : [],
      wordStats: storedWordStats ? JSON.parse(storedWordStats) : {},
      isHydrated: true,
    });
  },

  startSession: () => {
    const id = `session-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const newSession: SessionRecord = {
      id,
      startedAt: Date.now(),
      wordsCompleted: 0,
      correctFlicks: 0,
      missedFlicks: 0,
    };
    const nextSessions = [newSession, ...get().sessions].slice(0, MAX_STORED_SESSIONS);

    set({ sessions: nextSessions, currentSessionId: id });
    persist(get().loadedChildId, nextSessions, get().wordStats);
  },

  recordCorrectFlick: () => {
    const { sessions, currentSessionId, wordStats } = get();
    const nextSessions = sessions.map((session) =>
      session.id === currentSessionId ? { ...session, correctFlicks: session.correctFlicks + 1 } : session,
    );

    set({ sessions: nextSessions });
    persist(get().loadedChildId, nextSessions, wordStats);
  },

  recordMissedFlick: (word) => {
    const key = word.trim().toLowerCase();
    if (!key) {
      return;
    }

    const { sessions, currentSessionId, wordStats } = get();
    const nextSessions = sessions.map((session) =>
      session.id === currentSessionId ? { ...session, missedFlicks: session.missedFlicks + 1 } : session,
    );
    const existing = wordStats[key] ?? { word: key, timesCompleted: 0, timesMissed: 0, lastPlayedAt: Date.now() };
    const nextWordStats = {
      ...wordStats,
      [key]: { ...existing, timesMissed: existing.timesMissed + 1, lastPlayedAt: Date.now() },
    };

    set({ sessions: nextSessions, wordStats: nextWordStats });
    persist(get().loadedChildId, nextSessions, nextWordStats);
  },

  recordWordCompleted: (word) => {
    const key = word.trim().toLowerCase();
    if (!key) {
      return;
    }

    const { sessions, currentSessionId, wordStats } = get();
    const nextSessions = sessions.map((session) =>
      session.id === currentSessionId ? { ...session, wordsCompleted: session.wordsCompleted + 1 } : session,
    );
    const existing = wordStats[key] ?? { word: key, timesCompleted: 0, timesMissed: 0, lastPlayedAt: Date.now() };
    const nextWordStats = {
      ...wordStats,
      [key]: { ...existing, timesCompleted: existing.timesCompleted + 1, lastPlayedAt: Date.now() },
    };

    set({ sessions: nextSessions, wordStats: nextWordStats });
    persist(get().loadedChildId, nextSessions, nextWordStats);
  },

  clearWordStats: (words) => {
    const keysToRemove = new Set(words.map((word) => word.trim().toLowerCase()));
    const { sessions, wordStats } = get();
    const nextWordStats = Object.fromEntries(
      Object.entries(wordStats).filter(([key]) => !keysToRemove.has(key)),
    );

    set({ wordStats: nextWordStats });
    persist(get().loadedChildId, sessions, nextWordStats);
  },
}));
