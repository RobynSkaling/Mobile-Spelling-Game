import { GameMode } from './game-modes';
import {
  BEE_LINE_FIELD_EDGE_PAD_PX,
  BEE_LINE_GAP_FACTOR,
  BUMP_RADIUS_FACTOR,
  PICKUP_RADIUS_FACTOR,
} from './bee-line-layout';
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
    // (6). Since Epic 29 the screen plans the field with getBeeLineTileLayout, which drops decoys
    // (never the gaps) if a long word plus these decoys can't fit on a small phone.
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

/** Tile size used when a caller doesn't pass one (e.g. tests); the screen always passes the size
 *  `getBeeLineTileLayout` worked out for its real field. */
export const DEFAULT_TILE_SIZE_PX = 48;

export type BuildBeeLineFieldOptions = {
  /** Visual tile size (px), used to keep tiles fully within `field`'s bounds. Defaults to
   *  `DEFAULT_TILE_SIZE_PX`. */
  tileSize?: number;
  /** Minimum center-to-center spacing (px) enforced between any two tiles, so decoys never
   *  literally overlap or hide a correct tile (UX Step 16). Defaults to one tile plus one full
   *  tile-width of empty space edge to edge (Epic 29). */
  minTileSpacingPx?: number;
  /** Injectable RNG for deterministic tests, mirroring villain-pool.ts's `pickNextVillain`. */
  random?: () => number;
};

type Lattice = { columns: number; rows: number; stepX: number; stepY: number };

/** The lattice (columns x rows >= `count`) that spreads across the whole range, picking the column
 *  count that keeps neighbours furthest apart. A single column/row has no step on that axis, so it
 *  contributes no spacing limit there. */
function fitLattice(rangeX: number, rangeY: number, count: number): Lattice {
  let best: Lattice | null = null;
  let bestSpacing = -1;

  for (let columns = 1; columns <= Math.max(count, 1); columns += 1) {
    const rows = Math.ceil(Math.max(count, 1) / columns);
    const stepX = columns > 1 ? rangeX / (columns - 1) : Infinity;
    const stepY = rows > 1 ? rangeY / (rows - 1) : Infinity;
    const spacing = Math.min(stepX, stepY);

    if (spacing > bestSpacing) {
      bestSpacing = spacing;
      best = { columns, rows, stepX, stepY };
    }
  }

  return best as Lattice;
}

/**
 * Places `count` tile centres inside `field` so that every pair is at least `minSpacingPx` apart.
 * Tiles are scattered over a lattice with random jitter: each tile takes a random lattice cell and
 * may wander off its cell centre by at most half of the spare room, which makes the spacing a
 * guarantee instead of something a random sampler merely tends to achieve. If the field can't hold
 * `count` tiles at the requested spacing, the spacing shrinks just enough to fit (callers avoid this
 * by planning with `getBeeLineTileLayout` first).
 */
function placeTilesOnLattice(
  field: Bounds,
  tileSize: number,
  minSpacingPx: number,
  count: number,
  random: () => number,
): Point[] {
  const margin = tileSize / 2 + BEE_LINE_FIELD_EDGE_PAD_PX;
  const rangeX = Math.max(field.width - margin * 2, 0);
  const rangeY = Math.max(field.height - margin * 2, 0);
  const { columns, rows, stepX, stepY } = fitLattice(rangeX, rangeY, count);

  const spacingX = Math.min(stepX, minSpacingPx);
  const spacingY = Math.min(stepY, minSpacingPx);
  // Half the room beyond the required spacing; a lone column/row can use the whole range.
  const jitterX = columns > 1 ? Math.max(stepX - spacingX, 0) / 2 : rangeX / 2;
  const jitterY = rows > 1 ? Math.max(stepY - spacingY, 0) / 2 : rangeY / 2;

  const cells = shuffleLetters(
    Array.from({ length: columns * rows }, (_, index) => index),
    random,
  ).slice(0, count);

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  return cells.map((cell) => {
    const column = cell % columns;
    const row = Math.floor(cell / columns);
    const centreX = columns > 1 ? column * stepX : rangeX / 2;
    const centreY = rows > 1 ? row * stepY : rangeY / 2;

    return {
      x: field.x + margin + clamp(centreX + (random() * 2 - 1) * jitterX, 0, rangeX),
      y: field.y + margin + clamp(centreY + (random() * 2 - 1) * jitterY, 0, rangeY),
    };
  });
}

/**
 * Builds a scattered field for `word` with `decoyCount` decoys, placed within `field` bounds with
 * a guaranteed minimum edge-to-edge gap so no tile overlaps or hides another (UX Step 16's "decoys
 * must not literally hide correct letters", tightened in Epic 29 to one full tile-width). Pure —
 * RNG injected for testability, mirroring honey-pot-flick.ts.
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
  const tileSize = options.tileSize ?? DEFAULT_TILE_SIZE_PX;
  const minTileSpacingPx = options.minTileSpacingPx ?? tileSize * (1 + BEE_LINE_GAP_FACTOR);

  const wordLetters = word.split('');
  const decoyLetters = shuffleLetters(
    DECOY_LETTER_POOL.filter((letter) => !wordLetters.includes(letter)),
    random,
  ).slice(0, Math.max(decoyCount, 0));

  const positions = placeTilesOnLattice(
    field,
    tileSize,
    minTileSpacingPx,
    wordLetters.length + decoyLetters.length,
    random,
  );

  const tiles: ScatteredLetter[] = [
    ...wordLetters.map(
      (letter, index): ScatteredLetter => ({
        id: `correct-${index}`,
        letter,
        kind: 'correct',
        orderIndex: index,
        position: positions[index],
      }),
    ),
    ...decoyLetters.map(
      (letter, index): ScatteredLetter => ({
        id: `decoy-${index}`,
        letter,
        kind: 'decoy',
        orderIndex: null,
        position: positions[wordLetters.length + index],
      }),
    ),
  ];

  return { word, tiles };
}

/**
 * Which tile (if any) the steered head is touching right now. Checks every uncollected tile, not
 * just the next one, so brushing a wrong tile still counts as a mistake — but with two different
 * reach distances (Epic 29): the *next expected* letter is only picked up when the head's centre is
 * clearly over it, and every other tile only bumps when the head's centre is well inside the visible
 * tile, so grazing past a wrong letter is forgiven.
 */
export function findTouchedTile(
  head: Point,
  tiles: ScatteredLetter[],
  collectedIds: ReadonlySet<string>,
  nextExpectedIndex: number,
  tileSize: number,
): ScatteredLetter | null {
  for (const tile of tiles) {
    if (collectedIds.has(tile.id)) {
      continue;
    }

    const isNext = tile.kind === 'correct' && tile.orderIndex === nextExpectedIndex;
    const reach = tileSize * (isNext ? PICKUP_RADIUS_FACTOR : BUMP_RADIUS_FACTOR);
    if (Math.hypot(head.x - tile.position.x, head.y - tile.position.y) <= reach) {
      return tile;
    }
  }

  return null;
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
