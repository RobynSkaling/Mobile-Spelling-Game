import { create } from 'zustand';
import { GameMode } from '@/features/play/logic/game-modes';
import { getEligibleVillains, pickNextVillain, VILLAIN_POOL_CONFIG } from '@/data/characters/villain-pool';

/** Starting size of the honey larder for a fresh session (architecture 25.11.2). */
export const HONEY_LARDER_START = 3;
/** The larder can never be emptied below this — a villain can never take the child's last pot. */
export const HONEY_LARDER_FLOOR = 1;

interface SessionState {
  currentWord: string | null;
  score: number;
  /** Session-local gameplay currency, kept fully separate from `score`/progress-store's mastery
   *  records — a steal must never distort the educational data parents see (architecture 25.11.2). */
  honeyStash: number;
  /** Pots stolen but not yet recovered. Completing a word recovers one of these first, on top of
   *  its normal +1 earn (architecture 25.11.5's redemption loop). */
  stolenOutstanding: number;
  /** The on-screen villain for this session, picked once per mount — see `pickSessionVillain`. */
  villainId: string | null;
  /** The previous session's villain, so the next pick can exclude it (architecture 25.10.3). */
  lastVillainId: string | null;
  setCurrentWord: (word: string | null) => void;
  incrementScore: () => void;
  resetScore: () => void;
  /** Picks this session's villain from the shared pool, excluding the last session's villain, and
   *  records the pick as the new `lastVillainId`. Call once per new game/PlayScreen mount. */
  pickSessionVillain: (mode: GameMode) => void;
  /** +1 pot for completing a word; recovers one previously-stolen pot first, if any are
   *  outstanding (architecture 25.11.3/25.11.5). */
  earnHoneyPot: () => void;
  /** Takes one pot if the larder is above its floor. Returns whether a pot was actually taken —
   *  the floor is enforced here as the source of truth, on top of the caller's own
   *  `pickResourceInJeopardy`-style check before opening a steal attempt. */
  stealHoneyPot: () => boolean;
  resetHoneyStash: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  currentWord: null,
  score: 0,
  honeyStash: HONEY_LARDER_START,
  stolenOutstanding: 0,
  villainId: null,
  lastVillainId: null,

  setCurrentWord: (word) => set({ currentWord: word }),
  incrementScore: () => set((state) => ({ score: state.score + 1 })),
  resetScore: () => set({ score: 0 }),

  pickSessionVillain: (mode) => {
    const { lastVillainId } = get();
    const eligible = getEligibleVillains(VILLAIN_POOL_CONFIG, mode);
    const villainId = pickNextVillain(eligible, lastVillainId);
    set({ villainId, lastVillainId: villainId ?? lastVillainId });
  },

  earnHoneyPot: () =>
    set((state) => {
      const recovered = state.stolenOutstanding > 0 ? 1 : 0;
      return {
        honeyStash: state.honeyStash + 1 + recovered,
        stolenOutstanding: state.stolenOutstanding - recovered,
      };
    }),

  stealHoneyPot: () => {
    const { honeyStash } = get();
    if (honeyStash <= HONEY_LARDER_FLOOR) {
      return false;
    }
    set((state) => ({
      honeyStash: state.honeyStash - 1,
      stolenOutstanding: state.stolenOutstanding + 1,
    }));
    return true;
  },

  resetHoneyStash: () => set({ honeyStash: HONEY_LARDER_START, stolenOutstanding: 0 }),
}));
