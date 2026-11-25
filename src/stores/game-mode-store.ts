import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameMode, isGameMode } from '@/features/play/logic/game-modes';
import { childKey, GAME_MODE_BASE_KEY } from './child-data-logic';

interface GameModeState {
  mode: GameMode;
  /** The child whose mode is in memory; writes go to this child's key. */
  loadedChildId: string | null;
  isHydrated: boolean;
  setMode: (mode: GameMode) => void;
  loadForChild: (childId: string | null) => Promise<void>;
}

export const useGameModeStore = create<GameModeState>((set, get) => ({
  mode: 'easy',
  loadedChildId: null,
  isHydrated: false,
  setMode: (mode) => {
    set({ mode });
    const { loadedChildId } = get();
    if (loadedChildId) {
      AsyncStorage.setItem(childKey(GAME_MODE_BASE_KEY, loadedChildId), mode);
    }
  },
  loadForChild: async (childId) => {
    set({ mode: 'easy', loadedChildId: childId, isHydrated: false });
    const stored = childId ? await AsyncStorage.getItem(childKey(GAME_MODE_BASE_KEY, childId)) : null;
    if (get().loadedChildId !== childId) {
      return; // switched again while loading; the newer load owns the state
    }
    set({ mode: stored && isGameMode(stored) ? stored : 'easy', isHydrated: true });
  },
}));
