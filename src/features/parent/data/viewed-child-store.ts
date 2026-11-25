import { create } from 'zustand';
import { useFamilyStore } from '@/stores/family-store';

/**
 * The child the Parent View last showed. In memory only: it survives trips to the list editor or
 * Manage children and back, but is forgotten when the parent area re-locks (every Home visit), so
 * the next visit opens on whoever is playing.
 */
interface ViewedChildState {
  viewedChildId: string | null;
  setViewedChildId: (id: string | null) => void;
}

export const useViewedChildStore = create<ViewedChildState>((set) => ({
  viewedChildId: null,
  setViewedChildId: (id) => set({ viewedChildId: id }),
}));

useFamilyStore.subscribe((state, previous) => {
  if (previous.parentUnlocked && !state.parentUnlocked) {
    useViewedChildStore.getState().setViewedChildId(null);
  }
});
