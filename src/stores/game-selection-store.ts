import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameId, isGameId } from '@/features/play/logic/games';
import { childKey, SELECTED_GAME_BASE_KEY } from './child-data-logic';

interface GameSelectionState {
  selectedGame: GameId;
  /** The child whose selection is in memory; writes go to this child's key. */
  loadedChildId: string | null;
  isHydrated: boolean;
  setSelectedGame: (game: GameId) => void;
  loadForChild: (childId: string | null) => Promise<void>;
}

export const useGameSelectionStore = create<GameSelectionState>((set, get) => ({
  selectedGame: 'honey-pot-flick',
  loadedChildId: null,
  isHydrated: false,
  setSelectedGame: (game) => {
    set({ selectedGame: game });
    const { loadedChildId } = get();
    if (loadedChildId) {
      AsyncStorage.setItem(childKey(SELECTED_GAME_BASE_KEY, loadedChildId), game);
    }
  },
  loadForChild: async (childId) => {
    set({ selectedGame: 'honey-pot-flick', loadedChildId: childId, isHydrated: false });
    const stored = childId ? await AsyncStorage.getItem(childKey(SELECTED_GAME_BASE_KEY, childId)) : null;
    if (get().loadedChildId !== childId) {
      return; // switched again while loading; the newer load owns the state
    }
    set({ selectedGame: stored && isGameId(stored) ? stored : 'honey-pot-flick', isHydrated: true });
  },
}));
