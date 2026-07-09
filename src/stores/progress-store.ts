import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSIONS_KEY = 'progress.sessions';
const WORD_STATS_KEY = 'progress.wordStats';
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

function persist(sessions: SessionRecord[], wordStats: Record<string, WordStat>) {
  AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  AsyncStorage.setItem(WORD_STATS_KEY, JSON.stringify(wordStats));
}

interface ProgressState {
  sessions: SessionRecord[];
  wordStats: Record<string, WordStat>;
  currentSessionId: string | null;
  isHydrated: boolean;
  loadProgress: () => Promise<void>;
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
  isHydrated: false,

  loadProgress: async () => {
    const [storedSessions, storedWordStats] = await Promise.all([
      AsyncStorage.getItem(SESSIONS_KEY),
      AsyncStorage.getItem(WORD_STATS_KEY),
    ]);

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
    persist(nextSessions, get().wordStats);
  },

  recordCorrectFlick: () => {
    const { sessions, currentSessionId, wordStats } = get();
    const nextSessions = sessions.map((session) =>
      session.id === currentSessionId ? { ...session, correctFlicks: session.correctFlicks + 1 } : session,
    );

    set({ sessions: nextSessions });
    persist(nextSessions, wordStats);
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
    persist(nextSessions, nextWordStats);
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
    persist(nextSessions, nextWordStats);
  },

  clearWordStats: (words) => {
    const keysToRemove = new Set(words.map((word) => word.trim().toLowerCase()));
    const { sessions, wordStats } = get();
    const nextWordStats = Object.fromEntries(
      Object.entries(wordStats).filter(([key]) => !keysToRemove.has(key)),
    );

    set({ wordStats: nextWordStats });
    persist(sessions, nextWordStats);
  },
}));
