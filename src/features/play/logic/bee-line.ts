import { GameMode } from './game-modes';
import { Bounds, DECOY_LETTER_POOL, Point, shuffleLetters } from './honey-pot-flick';

/**
 * Bee Line's pure, RN-independent gameplay foundation (roadmap Epics 14/15, engineering Epic 18;
 * `docs-private/mama-bears-spelling-bee-architecture.md` Sections 26.3–26.6). Bee Line is a
 * *sibling* of Honey Pot Flick built on the same `GameMode`/`GAME_MODE_CONFIG` pattern (26.1) — it
 * does not fork the four-tier ladder. Everything here is pure and unit-tested off-React, the same
 * convention `honey-pot-flick.ts` and `steal-attempt.ts` already established.
 *
 * Scope note (Epic 18 only): `decoyLetterCount`/`randomizePositionsPerAttempt` are wired but left
 * at their "off" defaults for every tier, and `timer`/`music` are left undefined everywhere —
 * those are Epic 21 (decoys) and Epic 23 (`impossible` timer/music)'s tuning work, not this one's.
 * Score math (`applyScore`) deliberately does not live here — that is Epic 20, kept separate per
 * architecture 26.5's own instruction that mistake CLASSIFICATION and mistake SCORING be tunable
 * independently of one another.
 */

export type BeeLineInput = 'tap' | 'drag';

/** Present only at `impossible` (Epic 23); `undefined` elsewhere means "no clock at this tier." */
export type BeeLineTimerConfig = {
  secondsPerLetter: number;
  floorMs: number;
  ceilingMs: number;
};

/** Present only at `impossible` (Epic 23); `undefined` elsewhere means "no accelerating music." */
export type AcceleratingMusicCue = {
  trackId: string;
  loop: true;
  startRate: number;
  endRate: number;
  rampMs: number;
};

export type BeeLineModeConfig = {
  /** 'tap' at easy, 'drag' at hard+ (roadmap Epic 14 acceptance criteria). */
  input: BeeLineInput;
  /** Whether the bee-towed growing trail visual is shown. UX Step 14: easy shows a faint STATIC
   *  connector in the "word so far" strip but no towed-trail motion; hard+ show the real towed trail. */
  showTowedTrail: boolean;
  /** Decoy tiles mixed onto the field. OPEN TUNING (Epic 21). Left at 0 for every tier in Epic 18 —
   *  Bee Line's drag-and-hunt field may want different numbers than Honey Pot Flick's flick field,
   *  so these are NOT assumed equal to game-modes.ts's decoyLetterCount. */
  decoyLetterCount: number;
  /** Re-randomize tile positions on every attempt (impossible) vs. keep them fixed within a word
   *  so a retry lands on the same layout (easy-crazy). Left false everywhere in Epic 18 (Epic 21
   *  turns this on for impossible). */
  randomizePositionsPerAttempt: boolean;
  /** Present only at impossible (Epic 23); undefined means "no clock." */
  timer?: BeeLineTimerConfig;
  /** Present only at impossible (Epic 23); undefined means "no accelerating background music." */
  music?: AcceleratingMusicCue;
};

export const BEE_LINE_MODE_CONFIG: Record<GameMode, BeeLineModeConfig> = {
  easy: {
    input: 'tap',
    showTowedTrail: false,
    decoyLetterCount: 0,
    randomizePositionsPerAttempt: false,
  },
  hard: {
    input: 'drag',
    showTowedTrail: true,
    decoyLetterCount: 0,
    randomizePositionsPerAttempt: false,
  },
  crazy: {
    input: 'drag',
    showTowedTrail: true,
    decoyLetterCount: 0,
    randomizePositionsPerAttempt: false,
  },
  impossible: {
    input: 'drag',
    showTowedTrail: true,
    decoyLetterCount: 0,
    randomizePositionsPerAttempt: false,
  },
};

// ---------------------------------------------------------------------------
// Field and letter data model (architecture 26.4)
// ---------------------------------------------------------------------------

export type LetterTileKind = 'correct' | 'decoy';

export type ScatteredLetter = {
  /** Stable id for React keys and for referencing a tile across collection/mistake events. */
  id: string;
  letter: string;
  kind: LetterTileKind;
  /** For a 'correct' tile: its 0-based index in the target word's spelling (handles repeated
   *  letters correctly — each occurrence is its own tile with its own orderIndex).
   *  For a 'decoy' tile: null. */
  orderIndex: number | null;
  position: Point;
};

export type BeeLineField = {
  word: string;
  tiles: ScatteredLetter[];
};

/** Default minimum center-to-center spacing (px) enforced between any two tiles on the field. */
export const DEFAULT_MIN_TILE_SPACING_PX = 64;

const MAX_PLACEMENT_ATTEMPTS = 200;

function randomFieldPosition(field: Bounds, tileSize: number, random: () => number): Point {
  const margin = tileSize / 2 + 4;
  const minX = field.x + margin;
  const maxX = field.x + Math.max(field.width - margin * 2, 0);
  const minY = field.y + margin;
  const maxY = field.y + Math.max(field.height - margin * 2, 0);

  return {
    x: minX + random() * Math.max(maxX - minX, 0),
    y: minY + random() * Math.max(maxY - minY, 0),
  };
}

function isFarEnoughFromPlaced(candidate: Point, placed: Point[], minSpacingPx: number): boolean {
  return placed.every((point) => Math.hypot(point.x - candidate.x, point.y - candidate.y) >= minSpacingPx);
}

/**
 * Rejection-samples a position for one tile: tries random field positions (up to
 * `MAX_PLACEMENT_ATTEMPTS`) until one clears `minSpacingPx` from every already-placed tile.
 * Falls back to the last attempted position if the field is too crowded to satisfy the spacing
 * within the attempt budget, rather than looping forever or throwing.
 */
function placeTile(
  field: Bounds,
  tileSize: number,
  minSpacingPx: number,
  placed: Point[],
  random: () => number,
): Point {
  let candidate = randomFieldPosition(field, tileSize, random);

  for (
    let attempt = 0;
    attempt < MAX_PLACEMENT_ATTEMPTS && !isFarEnoughFromPlaced(candidate, placed, minSpacingPx);
    attempt += 1
  ) {
    candidate = randomFieldPosition(field, tileSize, random);
  }

  return candidate;
}

export type BuildBeeLineFieldOptions = {
  /** Visual tile size (px), used to keep tiles fully within `field`'s bounds. Defaults to
   *  `DEFAULT_MIN_TILE_SPACING_PX`. */
  tileSize?: number;
  /** Minimum center-to-center spacing (px) enforced between any two tiles, so decoys never
   *  literally overlap or hide a correct tile (UX Step 16). Defaults to `tileSize`. */
  minTileSpacingPx?: number;
  /** Injectable RNG for deterministic tests, mirroring villain-pool.ts's `pickNextVillain`. */
  random?: () => number;
};

/**
 * Builds a scattered field for `word` with `decoyCount` decoys, placed within `field` bounds with
 * minimum spacing so no tile overlaps or hides another (UX Step 16's "decoys must not literally
 * hide correct letters"). Pure — RNG injected for testability, mirroring honey-pot-flick.ts.
 * Reuses honey-pot-flick.ts's `DECOY_LETTER_POOL`/`shuffleLetters` for decoy selection.
 *
 * Repeated letters (e.g. "bee") are modeled per-occurrence via `orderIndex` on each tile, so
 * "collect the second e" is unambiguous.
 *
 * Position randomization is not a separate code path here — callers decide *when* to call this:
 * once per word (a retry reuses the same `BeeLineField`) at easy/hard/crazy, or once per attempt
 * at impossible (Epic 21), per architecture 26.4.
 */
export function buildBeeLineField(
  word: string,
  decoyCount: number,
  field: Bounds,
  options: BuildBeeLineFieldOptions = {},
): BeeLineField {
  const random = options.random ?? Math.random;
  const tileSize = options.tileSize ?? DEFAULT_MIN_TILE_SPACING_PX;
  const minTileSpacingPx = options.minTileSpacingPx ?? tileSize;

  const wordLetters = word.split('');
  const availableDecoys = shuffleLetters(
    DECOY_LETTER_POOL.filter((letter) => !wordLetters.includes(letter)),
    random,
  ).slice(0, Math.max(decoyCount, 0));

  const placed: Point[] = [];
  const tiles: ScatteredLetter[] = [];

  wordLetters.forEach((letter, index) => {
    const position = placeTile(field, tileSize, minTileSpacingPx, placed, random);
    placed.push(position);
    tiles.push({ id: `correct-${index}`, letter, kind: 'correct', orderIndex: index, position });
  });

  availableDecoys.forEach((letter, index) => {
    const position = placeTile(field, tileSize, minTileSpacingPx, placed, random);
    placed.push(position);
    tiles.push({ id: `decoy-${index}`, letter, kind: 'decoy', orderIndex: null, position });
  });

  return { word, tiles };
}

// ---------------------------------------------------------------------------
// The collect-in-order / trail state machine (architecture 26.5)
// ---------------------------------------------------------------------------

export type CollectionOutcome =
  | 'correct' // the next letter in spelling order — collected, chain grows
  | 'wrong-order' // a genuine word letter, but not the next one needed
  | 'wrong-letter'; // a decoy / not-in-word letter (only possible at crazy+, once Epic 21 lands)

/** What a mistake does to the in-progress chain. The whole open "does wrong-order break the
 *  chain?" fork (roadmap Epic 15) is this enum — flipping a tuning value, not a redesign. */
export type ChainPolicy = 'keep-chain' | 'break-chain';

export type BeeLineTuning = {
  /**
   * Wrong-order behavior — the roadmap Epic 15 open fork.
   *   'keep-chain'  -> mis-pick is rejected/bounced, trail intact, only the score dips (UX Step 18's
   *                    current RECOMMENDATION for a forgiving mid-tier).
   *   'break-chain' -> wrong-order partially/fully breaks the chain like a wrong letter.
   * Both are expressible with no redesign; launch value follows UX Step 18 unless product overrides.
   */
  wrongOrderPolicy: ChainPolicy;
  /**
   * Wrong-letter behavior. Product intent (roadmap Epic 15) is 'break-chain' — scatter the whole
   * trail and restart the word. Kept as tuning for symmetry and because easy (no decoys) never
   * reaches this branch, so its value there is moot.
   */
  wrongLetterPolicy: ChainPolicy;
};

/**
 * Launch default per UX Step 18's *recommendation* — NOT yet ratified by product (see roadmap
 * Epic 15's open question, carried forward in Epic 18/20's roadmap entries). Flip
 * `wrongOrderPolicy` to 'break-chain' if product decides the mid-tier should be less forgiving;
 * no other code needs to change.
 */
export const DEFAULT_BEE_LINE_TUNING: BeeLineTuning = {
  wrongOrderPolicy: 'keep-chain',
  wrongLetterPolicy: 'break-chain',
};

export type CollectionState = {
  word: string;
  /** Tile ids collected so far, in pickup order. While the chain is intact this is a correct
   *  prefix of the word's spelling; a 'break-chain' outcome empties it (scatter + restart). */
  collected: string[];
  /** 0-based index of the next letter the child must collect. */
  nextExpectedIndex: number;
  /** False immediately after a chain break, while the render layer scatters/re-collects the
   *  tiles; the host calls `acknowledgeChainBreak` once that animation finishes. True otherwise,
   *  including for a freshly-started or freshly-completed word. */
  chainIntact: boolean;
  status: 'in-progress' | 'complete';
};

export function createCollectionState(word: string): CollectionState {
  return { word, collected: [], nextExpectedIndex: 0, chainIntact: true, status: 'in-progress' };
}

export type ResolvePickupResult = {
  next: CollectionState;
  outcome: CollectionOutcome;
  /** True when this pickup emptied the chain (drives the scatter animation). */
  chainBroke: boolean;
};

function applyMistake(
  state: CollectionState,
  outcome: Exclude<CollectionOutcome, 'correct'>,
  policy: ChainPolicy,
): ResolvePickupResult {
  if (policy === 'keep-chain') {
    return { next: state, outcome, chainBroke: false };
  }

  return {
    next: { ...state, collected: [], nextExpectedIndex: 0, chainIntact: false, status: 'in-progress' },
    outcome,
    chainBroke: true,
  };
}

/**
 * Pure transition. Classifies the pickup, applies the tier's ChainPolicy, and reports what the
 * render/score/character layers should react to. No score math here — scoring is Epic 20, kept
 * separate so mistake CLASSIFICATION and mistake SCORING can be tuned independently.
 *
 * `easy` participation (roadmap Epic 15's open sub-question, resolved per UX Step 18): `easy` has
 * no decoys (Epic 18's `BEE_LINE_MODE_CONFIG.easy.decoyLetterCount` is 0), so this function can
 * only ever be called with 'correct'-kind tiles there — it can only return `correct` or
 * `wrong-order`, never `wrong-letter`, and therefore (under the default 'keep-chain' policy) never
 * reports `chainBroke: true`. No special-casing is needed; the tier just never reaches that branch.
 *
 * Contract: the host only calls this while `state.status === 'in-progress'`, and only for a tile
 * still present on the field (a collected tile has already been removed from the field's
 * hit-testable set per architecture 26.4, so it cannot be picked up a second time). Once `status`
 * becomes `'complete'`, the host moves on to the next word via `createCollectionState` rather than
 * resolving further pickups against this state.
 */
export function resolvePickup(
  state: CollectionState,
  tile: ScatteredLetter,
  tuning: BeeLineTuning = DEFAULT_BEE_LINE_TUNING,
): ResolvePickupResult {
  if (tile.kind === 'decoy') {
    return applyMistake(state, 'wrong-letter', tuning.wrongLetterPolicy);
  }

  if (tile.orderIndex !== state.nextExpectedIndex) {
    return applyMistake(state, 'wrong-order', tuning.wrongOrderPolicy);
  }

  const collected = [...state.collected, tile.id];
  const nextExpectedIndex = state.nextExpectedIndex + 1;
  const status = nextExpectedIndex === state.word.length ? 'complete' : 'in-progress';

  return {
    next: { ...state, collected, nextExpectedIndex, chainIntact: true, status },
    outcome: 'correct',
    chainBroke: false,
  };
}

/**
 * Called by the host once it has finished playing the chain-break scatter animation, so the field
 * reads as "ready to try again" rather than permanently flagged mid-break. Pure and a no-op if the
 * chain is already intact.
 */
export function acknowledgeChainBreak(state: CollectionState): CollectionState {
  if (state.chainIntact) {
    return state;
  }

  return { ...state, chainIntact: true };
}
