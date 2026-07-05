import { create } from 'zustand';

interface SessionState {
  currentWord: string | null;
  score: number;
  setCurrentWord: (word: string | null) => void;
  incrementScore: () => void;
  resetScore: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  currentWord: null,
  score: 0,
  setCurrentWord: (word) => set({ currentWord: word }),
  incrementScore: () => set((state) => ({ score: state.score + 1 })),
  resetScore: () => set({ score: 0 }),
}));
