/**
 * Pure family/profile logic for Epic 30 (parent account + multiple child profiles). A sibling to
 * family-store.ts with no AsyncStorage/Zustand dependency, so every rule here is unit-tested — the
 * same "pure logic beside the store" split as daily-rewards-logic.ts.
 *
 * The parent account is local to the device (roadmap Section 13, decision 1): a PIN-protected
 * parent area that owns the child profiles. The PIN is a speed bump for children, not a security
 * boundary — it is still never stored in plain text.
 */
import { sha256Hex } from '@/shared/lib/crypto/sha256';

/** Editable cap on child profiles per device (roadmap Epic 30). */
export const MAX_CHILDREN = 6;

export const PIN_LENGTH = 4;

export type ChildProfile = {
  id: string;
  name: string;
  avatar: string;
  /** 1-12. Null only for a profile migrated from the old single-profile model (no age known yet). */
  birthMonth: number | null;
  birthYear: number | null;
  createdAt: number;
};

export type ParentAccount = {
  /** Null until the parent sets a PIN (fresh install before setup, or a migrated single profile). */
  pinHash: string | null;
  pinSalt: string | null;
};

export type FamilyState = {
  parent: ParentAccount;
  children: ChildProfile[];
  activeChildId: string | null;
  schemaVersion: number;
};

export const FAMILY_SCHEMA_VERSION = 1;

export function createEmptyFamily(): FamilyState {
  return {
    parent: { pinHash: null, pinSalt: null },
    children: [],
    activeChildId: null,
    schemaVersion: FAMILY_SCHEMA_VERSION,
  };
}

// --- PIN -------------------------------------------------------------------------------------

export function isValidPin(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
}

export function hashPin(pin: string, salt: string): string {
  return sha256Hex(`mama-bear-pin:${salt}:${pin}`);
}

/** Returns a new ParentAccount holding a salted hash of `pin`. `salt` is injected for testability;
 *  the store passes a random one. */
export function createParentPin(pin: string, salt: string): ParentAccount {
  if (!isValidPin(pin)) {
    throw new Error(`PIN must be ${PIN_LENGTH} digits`);
  }
  return { pinHash: hashPin(pin, salt), pinSalt: salt };
}

export function verifyPin(parent: ParentAccount, pin: string): boolean {
  if (!parent.pinHash || !parent.pinSalt) {
    return false;
  }
  return hashPin(pin, parent.pinSalt) === parent.pinHash;
}

export function hasParentPin(parent: ParentAccount): boolean {
  return parent.pinHash !== null;
}

// --- Forgotten-PIN adult challenge ------------------------------------------------------------

export type AdultChallenge = { question: string; answer: number };

/** A multi-step arithmetic question a 5–9-year-old is unlikely to answer, e.g. "(7 × 8) + 23".
 *  `random` returns [0, 1) and is injected so tests are repeatable. */
export function makeAdultChallenge(random: () => number = Math.random): AdultChallenge {
  const between = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
  const a = between(6, 12);
  const b = between(6, 12);
  const c = between(11, 39);
  return { question: `(${a} × ${b}) + ${c}`, answer: a * b + c };
}

// --- Age --------------------------------------------------------------------------------------

/** Whole years of age, from birth month/year only (we deliberately don't store a full birth date —
 *  roadmap Section 13, decision 4). The child counts as having had their birthday from the first of
 *  their birth month. Returns null if the birth month/year is unknown. Used by Epic 33's age-based
 *  grace days. */
export function getAge(
  birthMonth: number | null,
  birthYear: number | null,
  today: { year: number; month: number },
): number | null {
  if (birthMonth === null || birthYear === null) {
    return null;
  }
  const age = today.year - birthYear - (today.month < birthMonth ? 1 : 0);
  return Math.max(0, age);
}

// --- Children ---------------------------------------------------------------------------------

export type ChildInput = {
  name: string;
  avatar: string;
  birthMonth: number;
  birthYear: number;
};

export type FamilyResult = { family: FamilyState; error: null } | { family: null; error: string };

/** Oldest and youngest birth years the add-child form accepts, relative to the current year. */
export const BIRTH_YEAR_RANGE = { minAge: 2, maxAge: 16 };

export function validateChildInput(input: ChildInput, currentYear: number): string | null {
  if (input.name.trim().length === 0) {
    return 'Please enter a name.';
  }
  if (input.name.trim().length > 24) {
    return 'Please use a shorter name (24 letters or fewer).';
  }
  if (!Number.isInteger(input.birthMonth) || input.birthMonth < 1 || input.birthMonth > 12) {
    return 'Please choose a birth month.';
  }
  if (
    !Number.isInteger(input.birthYear) ||
    input.birthYear > currentYear - BIRTH_YEAR_RANGE.minAge ||
    input.birthYear < currentYear - BIRTH_YEAR_RANGE.maxAge
  ) {
    return 'Please choose a birth year.';
  }
  return null;
}

export function addChild(
  family: FamilyState,
  input: ChildInput,
  meta: { id: string; createdAt: number; currentYear: number },
): FamilyResult {
  if (family.children.length >= MAX_CHILDREN) {
    return { family: null, error: `A family can have up to ${MAX_CHILDREN} children.` };
  }
  const error = validateChildInput(input, meta.currentYear);
  if (error) {
    return { family: null, error };
  }

  const child: ChildProfile = {
    id: meta.id,
    name: input.name.trim(),
    avatar: input.avatar,
    birthMonth: input.birthMonth,
    birthYear: input.birthYear,
    createdAt: meta.createdAt,
  };
  return {
    family: {
      ...family,
      children: [...family.children, child],
      // The first child added becomes the active player straight away.
      activeChildId: family.activeChildId ?? child.id,
    },
    error: null,
  };
}

export function updateChild(family: FamilyState, id: string, input: ChildInput, currentYear: number): FamilyResult {
  if (!family.children.some((child) => child.id === id)) {
    return { family: null, error: 'That child could not be found.' };
  }
  const error = validateChildInput(input, currentYear);
  if (error) {
    return { family: null, error };
  }
  return {
    family: {
      ...family,
      children: family.children.map((child) =>
        child.id === id
          ? { ...child, name: input.name.trim(), avatar: input.avatar, birthMonth: input.birthMonth, birthYear: input.birthYear }
          : child,
      ),
    },
    error: null,
  };
}

/** Removing the only child is refused: a family always has someone to play as. If the active child
 *  is removed, the first remaining child becomes active. */
export function removeChild(family: FamilyState, id: string): FamilyResult {
  if (!family.children.some((child) => child.id === id)) {
    return { family: null, error: 'That child could not be found.' };
  }
  if (family.children.length === 1) {
    return { family: null, error: 'A family needs at least one child. Add another child before removing this one.' };
  }
  const children = family.children.filter((child) => child.id !== id);
  const activeChildId = family.activeChildId === id ? children[0].id : family.activeChildId;
  return { family: { ...family, children, activeChildId }, error: null };
}

/** The avatar a new child's form starts on: the first option no sibling uses yet, so siblings don't
 *  end up looking identical on "Who's playing?" by default. Falls back to the first option. */
export function suggestAvatar(children: Pick<ChildProfile, 'avatar'>[], options: string[]): string {
  const used = new Set(children.map((child) => child.avatar));
  return options.find((option) => !used.has(option)) ?? options[0];
}

export function setActiveChild(family: FamilyState, id: string): FamilyState {
  return family.children.some((child) => child.id === id) ? { ...family, activeChildId: id } : family;
}

export function getActiveChild(family: Pick<FamilyState, 'children' | 'activeChildId'>): ChildProfile | null {
  return family.children.find((child) => child.id === family.activeChildId) ?? null;
}

// --- Launch routing ---------------------------------------------------------------------------

export type LaunchRoute = '/parent-setup' | '/whos-playing' | '/home';

/** Where the app should open (roadmap Epic 30): first-time setup when there are no children yet,
 *  "Who's playing?" when there are 2+, otherwise straight to Home. */
export function getLaunchRoute(family: Pick<FamilyState, 'children'>): LaunchRoute {
  if (family.children.length === 0) {
    return '/parent-setup';
  }
  return family.children.length >= 2 ? '/whos-playing' : '/home';
}

// --- Parent gate destination -------------------------------------------------------------------

/** Parent-only screens the PIN gate may forward to after a correct PIN. */
export const PARENT_GATE_DESTINATIONS = ['/parent', '/children', '/child-edit'] as const;

/** Where the gate goes after a correct PIN. Only known parent-only screens are allowed (optionally
 *  with a query string); anything else — missing, unknown, or a crafted URL — falls back to Parent
 *  View, so a link can't use the gate to send the app somewhere unexpected. */
export function getGateDestination(next: string | undefined): string {
  if (next && PARENT_GATE_DESTINATIONS.some((path) => next === path || next.startsWith(`${path}?`))) {
    return next;
  }
  return '/parent';
}

// --- Migration from the pre-Epic-30 single profile ---------------------------------------------

export type LegacyProfile = { id: string; name: string; avatar: string };

/** An existing install's single `profile` becomes the first child of a new family, keeping its id
 *  (so Epic 31 can attach the per-device progress to it). Birth month/year are unknown until the
 *  parent adds them; no PIN is set until the parent first opens a parent-only area. */
export function migrateLegacyProfile(legacy: LegacyProfile, createdAt: number): FamilyState {
  return {
    ...createEmptyFamily(),
    children: [
      {
        id: legacy.id,
        name: legacy.name,
        avatar: legacy.avatar,
        birthMonth: null,
        birthYear: null,
        createdAt,
      },
    ],
    activeChildId: legacy.id,
  };
}
