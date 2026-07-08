import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameMode, isGameMode } from '@/features/play/logic/game-modes';

const GAME_MODE_KEY = 'game-mode';

interface GameModeState {
  mode: GameMode;
  isHydrated: boolean;
  setMode: (mode: GameMode) => void;
  loadMode: () => Promise<void>;
}

export const useGameModeStore = create<GameModeState>((set) => ({
  mode: 'easy',
  isHydrated: false,
  setMode: (mode) => {
    set({ mode });
    AsyncStorage.setItem(GAME_MODE_KEY, mode);
  },
  loadMode: async () => {
    const stored = await AsyncStorage.getItem(GAME_MODE_KEY);
    set({ mode: stored && isGameMode(stored) ? stored : 'easy', isHydrated: true });
  },
}));
