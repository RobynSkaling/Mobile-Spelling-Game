import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addChild,
  ChildInput,
  ChildProfile,
  createEmptyFamily,
  createParentPin,
  FamilyState,
  getActiveChild,
  LegacyProfile,
  migrateLegacyProfile,
  ParentAccount,
  removeChild,
  setActiveChild,
  updateChild,
  verifyPin,
} from './family-logic';
import { childDataKeys, FAMILY_BLOB_KEY, LEGACY_PROFILE_KEY } from './child-data-logic';

/** The whole family is one JSON blob (atomic writes), like daily-rewards-store. */
const FAMILY_KEY = FAMILY_BLOB_KEY;

function persist(family: FamilyState) {
  AsyncStorage.setItem(FAMILY_KEY, JSON.stringify(family));
}

function randomSalt(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function newChildId(): string {
  return `child-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

type ActionResult = { error: string | null };

interface FamilyStore {
  parent: ParentAccount;
  children: ChildProfile[];
  activeChildId: string | null;
  schemaVersion: number;
  isHydrated: boolean;
  /** In memory only, never persisted: true after the parent PIN is entered, until `lockParentArea`.
   *  Home locks it on every visit, so leaving the parent area always re-locks it. */
  parentUnlocked: boolean;

  loadFamily: () => Promise<void>;
  setParentPin: (pin: string) => void;
  /** Checks the PIN and, if right, unlocks the parent area. */
  unlockParentArea: (pin: string) => boolean;
  lockParentArea: () => void;
  addChild: (input: ChildInput) => ActionResult & { childId: string | null };
  updateChild: (id: string, input: ChildInput) => ActionResult;
  removeChild: (id: string) => ActionResult;
  setActiveChild: (id: string) => void;
}

function snapshot(state: FamilyStore): FamilyState {
  return {
    parent: state.parent,
    children: state.children,
    activeChildId: state.activeChildId,
    schemaVersion: state.schemaVersion,
  };
}

const INITIAL = createEmptyFamily();

export const useFamilyStore = create<FamilyStore>((set, get) => {
  /** Apply a new family state, in memory and on disk. */
  const commit = (family: FamilyState) => {
    set({ parent: family.parent, children: family.children, activeChildId: family.activeChildId, schemaVersion: family.schemaVersion });
    persist(family);
  };

  return {
    ...INITIAL,
    isHydrated: false,
    parentUnlocked: false,

    loadFamily: async () => {
      const stored = await AsyncStorage.getItem(FAMILY_KEY);
      let family: FamilyState;

      if (stored) {
        family = JSON.parse(stored);
      } else {
        // First launch after Epic 30: carry the old single profile over as the first child. Written
        // before anything else reads the family, and the legacy key is not deleted, so a crash
        // mid-way just re-runs this harmlessly on the next launch.
        const legacy = await AsyncStorage.getItem(LEGACY_PROFILE_KEY);
        family = legacy ? migrateLegacyProfile(JSON.parse(legacy) as LegacyProfile, Date.now()) : createEmptyFamily();
        if (legacy) {
          persist(family);
        }
      }

      set({ ...family, isHydrated: true });
    },

    setParentPin: (pin) => {
      commit({ ...snapshot(get()), parent: createParentPin(pin, randomSalt()) });
      // Setting (or resetting) the PIN is itself proof the parent is present.
      set({ parentUnlocked: true });
    },

    unlockParentArea: (pin) => {
      const ok = verifyPin(get().parent, pin);
      if (ok) {
        set({ parentUnlocked: true });
      }
      return ok;
    },

    lockParentArea: () => set({ parentUnlocked: false }),

    addChild: (input) => {
      const id = newChildId();
      const result = addChild(snapshot(get()), input, { id, createdAt: Date.now(), currentYear: new Date().getFullYear() });
      if (!result.family) {
        return { error: result.error, childId: null };
      }
      commit(result.family);
      return { error: null, childId: id };
    },

    updateChild: (id, input) => {
      const result = updateChild(snapshot(get()), id, input, new Date().getFullYear());
      if (!result.family) {
        return { error: result.error };
      }
      commit(result.family);
      return { error: null };
    },

    removeChild: (id) => {
      const result = removeChild(snapshot(get()), id);
      if (!result.family) {
        return { error: result.error };
      }
      commit(result.family);
      // After commit, so a removed active child has already been swapped out of the per-child stores
      // (which stop writing for it) before its keys are deleted. Only this child's keys are touched.
      AsyncStorage.multiRemove(childDataKeys(id));
      return { error: null };
    },

    setActiveChild: (id) => commit(setActiveChild(snapshot(get()), id)),
  };
});

/** The child currently playing, or null before setup. Replaces the old `useProfileStore().profile`. */
export function useActiveChild(): ChildProfile | null {
  const children = useFamilyStore((state) => state.children);
  const activeChildId = useFamilyStore((state) => state.activeChildId);
  return getActiveChild({ children, activeChildId });
}
