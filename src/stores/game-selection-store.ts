import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameId, isGameId } from '@/features/play/logic/games';

const SELECTED_GAME_KEY = 'selected-game';

interface GameSelectionState {
  selectedGame: GameId;
  isHydrated: boolean;
  setSelectedGame: (game: GameId) => void;
  loadSelectedGame: () => Promise<void>;
}

export const useGameSelectionStore = create<GameSelectionState>((set) => ({
  selectedGame: 'honey-pot-flick',
  isHydrated: false,
  setSelectedGame: (game) => {
    set({ selectedGame: game });
    AsyncStorage.setItem(SELECTED_GAME_KEY, game);
  },
  loadSelectedGame: async () => {
    const stored = await AsyncStorage.getItem(SELECTED_GAME_KEY);
    set({ selectedGame: stored && isGameId(stored) ? stored : 'honey-pot-flick', isHydrated: true });
  },
}));
