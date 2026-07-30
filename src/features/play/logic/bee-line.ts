import { GameMode } from './game-modes';
import { Bounds, DECOY_LETTER_POOL, Point, shuffleLetters } from './honey-pot-flick';

/**
 * Bee Line's pure, RN-independent gameplay foundation (roadmap Epics 14/15, engineering Epic 18;
 * `docs-private/mama-bears-spelling-bee-architecture.md` Sections 26.3–26.6). Bee Line is a
 * *sibling* of Honey Pot Flick built on the same `GameMode`/`GAME_MODE_CONFIG` pattern (26.1) — it
 * does not fork the four-tier ladder. Everything here is pure and unit-tested off-React, the same
 * convention `honey-pot-flick.ts` and `steal-attempt.ts` already established.
 *
 * Scope note (updated Epic 21): `decoyLetterCount`/`randomizePositionsPerAttempt` now carry real
 * (if unratified — see `BEE_LINE_MODE_CONFIG`'s own comments) values at `crazy`/`impossible`;
 * `easy`/`hard` stay at 0/false, matching Epic 14's tier ladder.
 * Scope note (updated Epic 23): `timer`/`music` now carry real (if unratified) values at
 * `impossible` only — `computeTimeBudgetMs` is this file's pure timer-budget function, mirroring
 * how `applyScore`/`resolvePickup` stay pure and RN-independent. `easy`/`hard`/`crazy` all keep both
 * fields `undefined`, per UX Step 17's explicit instruction not to let any lighter timer leak below
 * `impossible`.
 * Score math (`applyScore`, Epic 20) does live here, alongside `resolvePickup` — architecture 26.5's
 * instruction was that mistake CLASSIFICATION and mistake SCORING stay tunable independently of one
 * another (two separate tuning objects, `BeeLineTuning` vs. `BeeLineScoreTuning`), not that they
 * live in separate files. `applyScore` never reaches into `resolvePickup`'s internals or vice versa.
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

/**
 * Pure time-budget calculation for the `impossible`-tier timer (architecture 26.7): scales linearly
 * with word length (`wordLength * secondsPerLetter` seconds), then clamps to `[floorMs, ceilingMs]`
 * so a very short word isn't an instant-fail and a very long word doesn't get an unbounded budget —
 * "a 3-letter word gets less time than an 8-letter word" (roadmap Epic 16), within a fair floor/
 * ceiling. `wordLength <= 0` (defensive only — a real word from a word list is never empty) clamps
 * to `floorMs` rather than producing a negative or `NaN` budget, since the raw product is `<= 0` and
 * `Math.max` immediately floors it before the ceiling clamp ever runs.
 */
export function computeTimeBudgetMs(wordLength: number, cfg: BeeLineTimerConfig): number {
  const rawMs = Math.max(wordLength, 0) * cfg.secondsPerLetter * 1000;
  return Math.min(Math.max(rawMs, cfg.floorMs), cfg.ceilingMs);
}

export type BeeLineModeConfig = {
  /** 'tap' at easy, 'drag' at hard+ (roadmap Epic 14 acceptance criteria). */
  input: BeeLineInput;
  /** Whether the bee-towed growing trail visual is shown. UX Step 14: easy shows a faint STATIC
   *  connector in the "word so far" strip but no towed-trail motion; hard+ show the real towed trail. */
  showTowedTrail: boolean;
  /** Decoy tiles mixed onto the field. OPEN TUNING (Epic 21) — real at crazy/impossible, 0 at
   *  easy/hard. Bee Line's drag-and-hunt field may want different numbers than Honey Pot Flick's
   *  flick field, so these are NOT assumed equal to game-modes.ts's decoyLetterCount. */
  decoyLetterCount: number;
  /** Re-randomize tile positions on every attempt (impossible) vs. keep them fixed within a word
   *  so a retry lands on the same layout (easy-crazy). True only at impossible (Epic 21) — see
   *  `BEE_LINE_MODE_CONFIG`. */
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
    // Epic 21 launch placeholder — NOT ratified by product/UX (roadmap Epic 21's own open
    // question). Deliberately lower than game-modes.ts's GAME_MODE_CONFIG.crazy.decoyLetterCount
    // (6): Bee Line's field is a smaller ~340x340px square (BeeLineScreen.tsx's styles.field) than
    // Honey Pot Flick's pot-catching field, and DEFAULT_MIN_TILE_SPACING_PX (64px) between every
    // tile pair (correct + decoy) leaves less room before buildBeeLineField's rejection-sampler
    // starts falling back to crowded placements. Mirrors HPF's tier-escalation shape without
    // copying its exact numbers, per the roadmap's explicit "not required to match" note.
    decoyLetterCount: 3,
    randomizePositionsPerAttempt: false,
  },
  impossible: {
    input: 'drag',
    showTowedTrail: true,
    // Epic 21 launch placeholder — NOT ratified (same caveat as crazy above). Escalates from
    // crazy's 3, mirroring HPF's own crazy(6)->impossible(8) step shape, while staying below HPF's
    // 8 for the same smaller-field reasoning.
    decoyLetterCount: 5,
    // The one non-placeholder decision this epic locks in: impossible rebuilds the field on every
    // attempt (architecture 26.4) so no spatial pattern can be memorized. crazy stays false so a
    // retry reuses the same field/layout.
    randomizePositionsPerAttempt: true,
    // Epic 23 launch placeholder — NOT ratified by product/UX (same caveat as decoyLetterCount
    // above; see this epic's roadmap addendum). secondsPerLetter: 1.5 puts a typical 5-6 letter
    // word (the built-in lists' median length, per Epic 21's own crowding note) at 7.5-9s — tight
    // enough to feel like a real race for the "confident 9-year-old" this tier targets, without
    // being unwinnable. floorMs: 4000 keeps even a very short word from being an instant-fail
    // blink-and-you-lose budget. ceilingMs: 15000 caps the longest built-in words (up to 13
    // letters) well short of the ~29s the raw per-letter formula would otherwise produce, keeping
    // the "race against the clock" feel intact even for a long word.
    timer: { secondsPerLetter: 1.5, floorMs: 4000, ceilingMs: 15000 },
    // Epic 23 launch placeholder — NOT ratified. startRate/endRate (1.0 -> 1.4) mirror architecture
    // 26.7's own "e.g. 1.0 -> ~1.4" example. rampMs here is a required-by-type filler value only —
    // BeeLineScreen.tsx's playLoop() call sites always spread this cue and override rampMs with
    // that attempt's real computeTimeBudgetMs(...) result, so the acceleration curve peaks exactly
    // at that attempt's actual deadline regardless of word length; this static rampMs (set to
    // ceilingMs, the longest a real ramp could run) is never itself heard.
    music: { trackId: 'bee-line-impossible-chase', loop: true, startRate: 1.0, endRate: 1.4, rampMs: 15000 },
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
  | 'wrong-letter'; // a decoy / not-in-word letter (only possible at crazy+, per Epic 21's decoy counts)

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
 * render/score/character layers should react to. No score math in this function itself — `outcome`
 * is the hand-off to `applyScore` below, so mistake CLASSIFICATION and mistake SCORING stay tunable
 * independently of one another (two separate tuning objects) even though both live in this file.
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

// ---------------------------------------------------------------------------
// Running score — additive/subtractive per-attempt "feel" score (architecture 26.6)
// ---------------------------------------------------------------------------

export type BeeLineScoreTuning = {
  /** Credit per correctly collected letter. */
  perCorrect: number;
  /** Subtracted on a 'wrong-order' outcome. */
  wrongOrderPenalty: number;
  /** Subtracted on a 'wrong-letter' outcome. */
  wrongLetterPenalty: number;
  /** impossible-tier timeout, if it dips score (architecture 26.7 — Epic 23's concern, not this
   *  epic's; left undefined/unused here). */
  timeoutPenalty?: number;
};

/**
 * Launch placeholder ONLY — not yet ratified by product (see roadmap Epic 15/20's open question,
 * mirroring how `DEFAULT_BEE_LINE_TUNING` above is flagged). The one constraint product HAS stated
 * a lean on is `wrongLetterPenalty` > `wrongOrderPenalty`, since a wrong-letter mistake also scatters
 * the whole trail — these exact numbers are free to change with zero other code changes once
 * product/UX sets real values from a playable build.
 */
export const DEFAULT_BEE_LINE_SCORE_TUNING: BeeLineScoreTuning = {
  perCorrect: 10,
  wrongOrderPenalty: 5,
  wrongLetterPenalty: 15,
};

export type BeeLineScoreState = {
  /** Additive/subtractive running total for the CURRENT word attempt. May be negative mid-attempt.
   *  A pure in-game FEEL value. NOT session-store.score, NOT a mastery record — see architecture
   *  26.6's two hard boundaries. Callers reset this to `{ running: 0 }` per word attempt; it is not
   *  this module's job to decide when that reset happens. */
  running: number;
};

/**
 * Pure additive/subtractive score update, kept deliberately separate from `resolvePickup`'s chain
 * classification (architecture 26.6): a 'correct' pickup credits `perCorrect`, a 'wrong-order' or
 * 'wrong-letter' pickup subtracts its respective penalty — including below zero, since the running
 * score is cosmetic feel for the current attempt, not a floor-clamped total. Never touches
 * `session-store.ts`'s `score` or `progress-store.ts` mastery data; callers own wiring those
 * separately (see `BeeLineScreen.tsx`'s `handleWordComplete`).
 */
export function applyScore(
  state: BeeLineScoreState,
  outcome: CollectionOutcome,
  tuning: BeeLineScoreTuning,
): BeeLineScoreState {
  const delta =
    outcome === 'correct'
      ? tuning.perCorrect
      : outcome === 'wrong-order'
      ? -tuning.wrongOrderPenalty
      : -tuning.wrongLetterPenalty;

  return { running: state.running + delta };
}
