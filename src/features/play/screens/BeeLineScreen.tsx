import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { theme } from '@/shared/lib/theme';
import { useProfileStore } from '@/stores/profile-store';
import { useWordListStore } from '@/stores/word-list-store';
import { useGameModeStore } from '@/stores/game-mode-store';
import { useProgressStore } from '@/stores/progress-store';
import { speechService } from '@/shared/lib/speech';
import { soundEffectsService } from '@/shared/lib/sound-effects';
import { gameMusicService } from '@/shared/lib/music';
import { Confetti } from '@/shared/ui/Confetti';
import { HexTile } from '@/shared/ui/HexTile';
import { Character } from '@/shared/ui/Character';
import { useCharacterAnimationState } from '@/shared/ui/useCharacterAnimationState';
import { GAME_MODE_CONFIG } from '@/features/play/logic/game-modes';
import { Bounds, Point, getNextWord, toContainerRelative } from '@/features/play/logic/honey-pot-flick';
import { appendTrailPathPoint, resolveTrailSegmentPositions } from '@/features/play/logic/snake-trail';
import { getVillainBehaviorTier } from '@/data/characters/villain-behavior';
import { getEligibleVillains, pickNextVillain, VILLAIN_POOL_CONFIG } from '@/data/characters/villain-pool';
import { getBeeLineVillainCapabilities } from '@/features/play/logic/bee-line-villain-capabilities';
import {
  acknowledgeChainBreak,
  applyScore,
  BEE_LINE_MODE_CONFIG,
  BeeLineField,
  BeeLineScoreState,
  buildBeeLineField,
  CollectionState,
  computeTimeBudgetMs,
  createCollectionState,
  DEFAULT_BEE_LINE_SCORE_TUNING,
  DEFAULT_BEE_LINE_TUNING,
  resolvePickup,
  ScatteredLetter,
} from '@/features/play/logic/bee-line';

const TILE_SIZE = 64;
// `hard`+'s Snake/Centipede rework (roadmap Epic 19 revision note, post-playtest — see the roadmap
// doc for why the original fixed-dock drag mechanic was replaced). There is no dock/drop-target
// anymore: the head is steered continuously, and these two constants replace `DOCK_HIT_RADIUS`.
// How close the steered head needs to get to a still-uncollected tile to pick it up on contact.
const HEAD_PICKUP_RADIUS_PX = TILE_SIZE * 0.75;
// Center-to-center spacing between trailing body segments, so a long word's tail doesn't sprawl
// too far behind the head but segments still read as visually distinct tiles.
const TRAIL_SEGMENT_SPACING_PX = TILE_SIZE * 0.6;
// A new head-path sample is only kept once the finger has moved at least this far from the last
// recorded one — keeps the path array from growing needlessly while the finger holds still.
const TRAIL_PATH_MIN_POINT_SPACING_PX = 4;
// Generous cap so even a long, wandering drag on the longest supported word can't grow the path
// array unbounded.
const TRAIL_PATH_MAX_POINTS = 600;
const CELEBRATION_BURST_MS = 800;
const CELEBRATION_HOLD_MS = 900;
const CELEBRATION_FADE_MS = 300;
const CELEBRATION_TOTAL_MS = CELEBRATION_BURST_MS + CELEBRATION_HOLD_MS + CELEBRATION_FADE_MS;
const NEXT_WORD_DELAY_MS = CELEBRATION_TOTAL_MS + 100;
// How long the "whole trail bursts apart" beat holds before the field is ready to try again
// (architecture 26.5's chainIntact:false window) — now reachable at crazy/impossible since Epic 21
// gave those tiers real decoyLetterCount values.
const CHAIN_BREAK_HOLD_MS = 450;
// Epic 20's mistake-feedback timings. The wobble/flash and scatter beats are deliberately short —
// UX Step 18 wants a quick, silly consequence, not a moment that eats into play time.
const WOBBLE_DURATION_MS = 320;
const MISTAKE_OUTLINE_HOLD_MS = 380;
const SCORE_POPUP_DURATION_MS = 700;
const BEE_HEADSHAKE_DURATION_MS = 420;
// The comedic "sproing/poof" scatter burst runs for exactly as long as the field takes to rebuild
// (CHAIN_BREAK_HOLD_MS), so the snapshot overlay below fades out right as the rebuilt field lands.
const SCATTER_BURST_DURATION_MS = CHAIN_BREAK_HOLD_MS;

// Epic 23's impossible-tier timer/fuse/firework timings. Longer than the wrong-letter scatter's
// CHAIN_BREAK_HOLD_MS/SCATTER_BURST_DURATION_MS above — the roadmap explicitly wants the timeout
// explosion staged as "the bigger, firework-scale burst" on UX Step 18's shared comedic ladder, so
// it needs to read as a bigger beat, not a same-sized one with different colors.
const FIREWORK_BURST_DURATION_MS = 650;
const TIMEOUT_HOLD_MS = FIREWORK_BURST_DURATION_MS + 150;
const FIREWORK_PARTICLE_COUNT = 10;
const FIREWORK_BURST_RADIUS_PX = 90;
// Small fuse/sparkler burn-down bar (UX Step 17: the fuse is the PRIMARY read, never a numeral) —
// rendered above the steered head, front-of-trail, only when modeConfig.timer is defined.
const FUSE_BAR_WIDTH_PX = 84;
const FUSE_BAR_HEIGHT_PX = 10;

/** A snapshot of the in-progress trail's positions/letters, captured the instant a wrong-letter
 *  mistake OR an impossible-tier timeout is detected — before the collection state that produced it
 *  gets reset. Rendered as its own overlay during the scatter/firework burst so the trail visibly
 *  "poofs apart"/"explodes" instead of vanishing instantly (the polish gap Epic 19.5 flagged and
 *  Epic 20 fixed for the mistake path; Epic 23 reuses the same capture-before-reset technique for
 *  the timeout path rather than inventing a second snapshot shape for an identical need). */
type ScatterSnapshot = {
  headPosition: Point;
  headLetter: string;
  trailPositions: Point[];
  trailLetters: string;
};

/**
 * Fixed geometry for the firework burst's particles — a fan spread mostly UPWARD (roadmap: "a
 * single big upward 'whoosh'... vs. confetti falling from above"), not an all-directions firework,
 * so it reads distinctly from both the win-celebration confetti (falls from above) and the
 * wrong-letter scatter (tiles fling outward/downward with rotation). Computed once at module scope
 * — a fixed prop table for a handful of `Animated.View`s, not a reusable particle-system
 * abstraction (this codebase's stated no-premature-abstraction convention; mirrors how the existing
 * scatter burst is just a handful of `Animated.View`s too).
 */
const FIREWORK_PARTICLES = Array.from({ length: FIREWORK_PARTICLE_COUNT }, (_, index) => {
  // -90deg is straight up; spread +/-75deg around it so every particle still reads as "upward."
  const angleDeg = -90 + (index - (FIREWORK_PARTICLE_COUNT - 1) / 2) * (150 / (FIREWORK_PARTICLE_COUNT - 1));
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    dx: Math.cos(angleRad) * FIREWORK_BURST_RADIUS_PX,
    dy: Math.sin(angleRad) * FIREWORK_BURST_RADIUS_PX,
    // Bright gold/hot-pink (roadmap's exact palette call), alternating per particle.
    color: index % 2 === 0 ? theme.colors.gold : theme.colors.accent,
  };
});

export function BeeLineScreen() {
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [field, setField] = useState<BeeLineField | null>(null);
  const [collectionState, setCollectionState] = useState<CollectionState | null>(null);
  const [feedback, setFeedback] = useState('Collect the letters in order!');
  const [showBanner, setShowBanner] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationPhrase, setCelebrationPhrase] = useState('');

  const [containerBounds, setContainerBounds] = useState<Bounds | null>(null);
  const [fieldBounds, setFieldBounds] = useState<Bounds | null>(null);
  // The steered snake head's current position (container-relative, matching `tile.position`'s
  // coordinate space) once at least one letter has been collected; null beforehand, when the head
  // doesn't exist yet and the first letter's tile still sits at its own scattered field position.
  const [headPosition, setHeadPosition] = useState<Point | null>(null);

  // Epic 20's running score — additive/subtractive, per-word-attempt "feel" score. Entirely
  // separate from session-store.ts's monotonic score and progress-store.ts's mastery data (see
  // bee-line.ts's applyScore doc comment and architecture 26.6's two hard boundaries).
  const [scoreState, setScoreState] = useState<BeeLineScoreState>({ running: 0 });
  const [scorePopup, setScorePopup] = useState<{ key: number; delta: number } | null>(null);
  // The id of the tile that most recently produced a wrong-order mistake, so its wrapper can show
  // the wobble + warm-orange outline flash; cleared after MISTAKE_OUTLINE_HOLD_MS.
  const [mistakeTileId, setMistakeTileId] = useState<string | null>(null);
  // Non-null only during a wrong-letter scatter burst — see ScatterSnapshot's doc comment above.
  const [scatterSnapshot, setScatterSnapshot] = useState<ScatterSnapshot | null>(null);
  // Non-null only during an impossible-tier timeout's firework burst — same ScatterSnapshot shape,
  // captured from the trail right before the timeout restart resets collectionState.
  const [fireworkSnapshot, setFireworkSnapshot] = useState<ScatterSnapshot | null>(null);
  // Seconds-remaining readout for the fuse's optional small secondary numeral (UX Step 17: the fuse
  // itself is the primary read). null whenever modeConfig.timer is undefined (every tier but
  // impossible) or no timed attempt is currently running.
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const bannerScale = useRef(new Animated.Value(0.6)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(0.5)).current;
  const confettiProgress = useRef(new Animated.Value(0)).current;
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<View | null>(null);
  const fieldRef = useRef<View | null>(null);
  const resolvingRef = useRef(false);
  // -1 -> 0 -> 1 oscillation driving the mis-tapped tile's rotate wobble.
  const wobbleAnim = useRef(new Animated.Value(0)).current;
  // 0 -> 1, driving the floating "-N" popup's rise-and-fade.
  const scorePopupAnim = useRef(new Animated.Value(0)).current;
  // -1 -> 0 -> 1 oscillation driving the startled bee's headshake during a wrong-letter scatter.
  const beeShakeAnim = useRef(new Animated.Value(0)).current;
  // 0 -> 1 over SCATTER_BURST_DURATION_MS, driving the "sproing/poof" burst on `scatterSnapshot`.
  const scatterAnim = useRef(new Animated.Value(0)).current;
  const mistakeTileTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scorePopupKeyRef = useRef(0);
  // 1 -> 0 over the current attempt's computed time budget — the fuse/sparkler burn-down
  // (UX Step 17's primary, non-numeral read). Only ever animated when modeConfig.timer is defined.
  const fuseAnim = useRef(new Animated.Value(1)).current;
  // 0 -> 1 over FIREWORK_BURST_DURATION_MS, driving the timeout firework's upward particle burst
  // and the fading trail/head tiles underneath it.
  const fireworkAnim = useRef(new Animated.Value(0)).current;
  // Fires handleTimeout at the end of the current timed attempt's budget; cleared on word success,
  // a fresh attempt starting, or unmount, so a stale timeout can never fire after the word is done.
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ticks secondsRemaining down once a second for the fuse's optional secondary numeral.
  const secondsTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // The head's recorded path history (container-relative points, oldest first, current head
  // position last) — kept in a ref so it can grow every drag frame without forcing a re-render on
  // its own; `headPosition` is the reactive trigger that actually schedules the re-render that
  // reads it. Reset whenever a new word starts or the chain breaks.
  const headPathRef = useRef<Point[]>([]);
  // Mirrors `collectionState.collected` as a Set, updated synchronously inside `attemptPickup` —
  // needed because proximity-based pickup checks happen continuously during a drag (multiple times
  // per React commit), and reading `collectionState` itself would risk re-processing the same tile
  // more than once before its collection is reflected in a re-render.
  const collectedIdsRef = useRef<Set<string>>(new Set());

  const { profile } = useProfileStore();
  const selectedList = useWordListStore((state) => state.getSelectedList());
  const words = useMemo(() => selectedList?.words ?? [], [selectedList]);
  const gameMode = useGameModeStore((state) => state.mode);
  // crazy/impossible share hard's input/trail shape (BEE_LINE_MODE_CONFIG) and now also carry real
  // decoyLetterCount/randomizePositionsPerAttempt values (Epic 21) — this screen needs no
  // tier-specific branching beyond reading modeConfig, since every behavioral difference already
  // flows from the config object itself.
  const modeConfig = BEE_LINE_MODE_CONFIG[gameMode];
  const bannerDurationMs = GAME_MODE_CONFIG[gameMode].bannerDurationMs;
  const startSession = useProgressStore((state) => state.startSession);
  const recordWordCompleted = useProgressStore((state) => state.recordWordCompleted);

  // Bee Line keeps its villain pick in local component state rather than reusing session-store.ts's
  // villainId/pickSessionVillain/lastVillainId (PlayScreen/HPF's home for those fields) — this
  // screen has never imported session-store.ts, and every prior Bee Line epic keeps this game's own
  // state (running score, collection state, etc.) local rather than coupling to HPF's session store,
  // even where the underlying primitive (`pickNextVillain`, a pure function) is shared. Picked once
  // per mount via a lazy initializer, mirroring PlayScreen's "once per mount" pickSessionVillain
  // call — just without the cross-game "don't repeat the other game's last villain" memory that
  // reusing the shared store's `lastVillainId` would introduce; this game has no prior pick of its
  // own to exclude, so `lastVillainId` is always null here.
  const [villainId] = useState<string | null>(() =>
    pickNextVillain(getEligibleVillains(VILLAIN_POOL_CONFIG, gameMode), null),
  );
  // Bee Line's own capability-light tier -> capabilities map (architecture 26.8) — deliberately
  // never lists 'StealResource', so a present villain here can never imply steal machinery. A
  // villain only renders/reacts once this tier grants at least one capability (Interfering at
  // `crazy`, Relentless at `impossible`) — Passive/Taunting's "villain absent" is simply that empty
  // array, not a separate `gameMode === 'crazy' || gameMode === 'impossible'` check, matching this
  // screen's existing no-tier-string-branching convention.
  const villainTier = getVillainBehaviorTier(gameMode);
  const villainCapabilities = getBeeLineVillainCapabilities(villainTier);
  const villainPresent = villainId != null && villainCapabilities.length > 0;

  const mamaBear = useCharacterAnimationState();
  const villain = useCharacterAnimationState();

  const revealWord = (word: string) => {
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
    }

    setShowBanner(true);
    bannerOpacity.setValue(0);
    bannerScale.setValue(0.6);
    Animated.parallel([
      Animated.spring(bannerScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(bannerOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    speechService.speakWord(word);

    bannerTimeoutRef.current = setTimeout(() => {
      Animated.timing(bannerOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setShowBanner(false);
      });
    }, bannerDurationMs);
  };

  const handleMegaphonePress = () => {
    if (currentWord) {
      speechService.speakWord(currentWord);
    }
  };

  /** Floats a "-N" (or, in principle, "+N") near the score readout and fades it out — UX Step 18's
   *  small floating delta, anchored to the score display per this epic's task list. */
  const triggerScorePopup = (delta: number) => {
    scorePopupKeyRef.current += 1;
    setScorePopup({ key: scorePopupKeyRef.current, delta });
    scorePopupAnim.setValue(0);
    Animated.timing(scorePopupAnim, {
      toValue: 1,
      duration: SCORE_POPUP_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setScorePopup(null);
    });
  };

  /** A quick tile wobble (UX Step 18's wrong-order treatment) — the mis-tapped tile rocks side to
   *  side and shows a warm-orange outline flash for MISTAKE_OUTLINE_HOLD_MS, then settles back to
   *  normal. The tile itself never moves position (it "bounces back to its field position,
   *  uncollected" simply by staying exactly where it already was — keep-chain never removed it). */
  const triggerTileWobble = (tileId: string) => {
    if (mistakeTileTimeoutRef.current) {
      clearTimeout(mistakeTileTimeoutRef.current);
    }
    setMistakeTileId(tileId);
    wobbleAnim.setValue(0);
    Animated.sequence([
      Animated.timing(wobbleAnim, { toValue: 1, duration: WOBBLE_DURATION_MS * 0.25, useNativeDriver: true }),
      Animated.timing(wobbleAnim, { toValue: -1, duration: WOBBLE_DURATION_MS * 0.5, useNativeDriver: true }),
      Animated.timing(wobbleAnim, { toValue: 0, duration: WOBBLE_DURATION_MS * 0.25, useNativeDriver: true }),
    ]).start();
    mistakeTileTimeoutRef.current = setTimeout(() => setMistakeTileId(null), MISTAKE_OUTLINE_HOLD_MS);
  };

  /** A startled headshake (never a sad/scolding animation, per this epic's explicit instruction) —
   *  the bee rocks side to side once during a wrong-letter scatter burst. */
  const triggerBeeHeadshake = () => {
    beeShakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(beeShakeAnim, { toValue: 1, duration: BEE_HEADSHAKE_DURATION_MS * 0.25, useNativeDriver: true }),
      Animated.timing(beeShakeAnim, { toValue: -1, duration: BEE_HEADSHAKE_DURATION_MS * 0.5, useNativeDriver: true }),
      Animated.timing(beeShakeAnim, { toValue: 0, duration: BEE_HEADSHAKE_DURATION_MS * 0.25, useNativeDriver: true }),
    ]).start();
  };

  /** Drives the "sproing/poof" burst (scale-and-spin-away, fading out) on `scatterSnapshot` over
   *  SCATTER_BURST_DURATION_MS, timed to finish exactly as the rebuilt field lands. */
  const triggerScatterBurst = () => {
    scatterAnim.setValue(0);
    Animated.timing(scatterAnim, {
      toValue: 1,
      duration: SCATTER_BURST_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  /** Drives the impossible-tier timeout's firework burst on `fireworkSnapshot` over
   *  FIREWORK_BURST_DURATION_MS — deliberately a distinct animation from `triggerScatterBurst`
   *  (no per-tile outward fling/rotate), since the roadmap calls for this to read as a bigger,
   *  visually different beat: a single upward "whoosh" of gold/hot-pink particles, not a scatter. */
  const triggerFireworkBurst = () => {
    fireworkAnim.setValue(0);
    Animated.timing(fireworkAnim, {
      toValue: 1,
      duration: FIREWORK_BURST_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  /** Clears whatever's driving the current impossible-tier timed attempt — the pending timeout, the
   *  seconds-remaining tick, and the fuse animation — without touching the music loop (callers stop
   *  that explicitly at the two documented moments: a timeout firing, and word success). Safe to
   *  call at any tier; it's simply a no-op past the first two `if`s when nothing is running. */
  const clearImpossibleTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (secondsTickRef.current) {
      clearInterval(secondsTickRef.current);
      secondsTickRef.current = null;
    }
    fuseAnim.stopAnimation();
  };

  /**
   * (Re)starts the impossible-tier timer/fuse/music for a fresh attempt at `word` — the single
   * "start of a timed attempt" moment shared by all three triggers a fresh impossible attempt can
   * begin from: a brand-new word, a decoy-mistake retry, and a timeout retry (mirroring how
   * `buildBeeLineField` already has two call sites sharing one function — this is a third call site
   * for a second per-attempt concern). No-ops (after clearing any stale timer) at every tier below
   * impossible, since `modeConfig.timer`/`modeConfig.music` are undefined there — this is the single
   * gate that keeps the whole timer/fuse/music feature from leaking below impossible, per UX Step
   * 17's explicit instruction.
   */
  const startTimedAttempt = (word: string) => {
    clearImpossibleTimer();

    if (!modeConfig.timer) {
      setSecondsRemaining(null);
      return;
    }

    const budgetMs = computeTimeBudgetMs(word.length, modeConfig.timer);
    setSecondsRemaining(Math.ceil(budgetMs / 1000));
    fuseAnim.setValue(1);
    Animated.timing(fuseAnim, {
      toValue: 0,
      duration: budgetMs,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();

    secondsTickRef.current = setInterval(() => {
      setSecondsRemaining((current) => (current !== null && current > 0 ? current - 1 : current));
    }, 1000);

    timeoutRef.current = setTimeout(() => {
      handleTimeout(word);
    }, budgetMs);

    if (modeConfig.music) {
      // rampMs is overridden here with this attempt's actual budget — modeConfig.music.rampMs
      // itself is only a required-by-type placeholder (see BEE_LINE_MODE_CONFIG's comment) so the
      // acceleration always peaks exactly at THIS word's real deadline, regardless of word length.
      gameMusicService.playLoop({ ...modeConfig.music, rampMs: budgetMs });
    }
  };

  /**
   * Fires when an impossible-tier attempt's timer expires before the word is finished. Reuses the
   * exact ScatterSnapshot capture-before-reset technique the wrong-letter mistake path already
   * uses (see that comment in `attemptPickup`), but stages a bigger, visually distinct firework
   * burst instead of the "sproing/poof" scatter, per the roadmap's explicit "deliberately visually
   * distinct... so a child can tell success from timeout within a second." After the burst holds,
   * the word restarts from scratch (a full `createCollectionState`, not the partial
   * `acknowledgeChainBreak` a chain-break retry uses) and a fresh timed attempt begins.
   */
  const handleTimeout = (word: string) => {
    if (resolvingRef.current || !collectionState || collectionState.status !== 'in-progress') {
      return;
    }

    resolvingRef.current = true;
    clearImpossibleTimer();
    gameMusicService.stop();

    const preTimeoutTrailLetters = word.slice(1, collectionState.nextExpectedIndex);
    const preTimeoutHeadPosition = headPosition ?? field?.tiles.find((t) => t.orderIndex === 0)?.position ?? null;
    if (preTimeoutHeadPosition) {
      setFireworkSnapshot({
        headPosition: preTimeoutHeadPosition,
        headLetter: word[0] ?? '',
        trailPositions: resolveTrailSegmentPositions(headPathRef.current, preTimeoutTrailLetters.length, TRAIL_SEGMENT_SPACING_PX),
        trailLetters: preTimeoutTrailLetters,
      });
    }

    triggerFireworkBurst();
    soundEffectsService.playCue('bee-line-timeout');
    setFeedback("Time's up! Let's try that word again.");

    // An optional gleeful, harmless laugh at the explosion (architecture 26.8) — fired as its own
    // independent pose change in the villain's stable row position, with no positional link or
    // shared animation timeline with the firework particles above, so it never reads as though the
    // villain caused the explosion. Reuses the same 'Challenging' heckle state (option (a): the
    // roadmap doesn't ask for a distinct state for the laugh specifically).
    if (villainPresent) {
      villain.trigger('Challenging');
    }

    setTimeout(() => {
      // impossible always randomizes positions per attempt (Epic 21) — a timeout retry is a fresh
      // attempt, so it rebuilds the field exactly like the chainBroke branch's impossible-only
      // rebuild does, just unconditionally here since this path is impossible-only by construction
      // (modeConfig.timer is only ever defined at impossible).
      const nextField = buildBeeLineField(word, modeConfig.decoyLetterCount, fieldBounds!);
      setField(nextField);
      setCollectionState(createCollectionState(word));
      collectedIdsRef.current = new Set();
      headPathRef.current = [];
      setHeadPosition(null);
      setFireworkSnapshot(null);
      resolvingRef.current = false;
      // Same "here's the word again, try again" cue the chain-break retry already uses — replaying
      // it here keeps the two retry paths consistent rather than inventing a second confirmation UI.
      revealWord(word);
      startTimedAttempt(word);
    }, TIMEOUT_HOLD_MS);
  };

  const triggerCelebration = () => {
    setCelebrating(true);
    // Mama Bear celebrates for exactly as long as the confetti overlay runs (mirroring HPF's own
    // triggerCelebration pairing) so her reaction and the overlay resolve together rather than one
    // outlasting the other. The villain — only when this tier actually stages one — goes
    // 'Defeated' alongside her, the same "child wins, villain looks deflated" beat HPF already uses.
    mamaBear.trigger('Celebrating', CELEBRATION_TOTAL_MS);
    if (villainPresent) {
      villain.trigger('Defeated', CELEBRATION_TOTAL_MS);
    }
    celebrationOpacity.setValue(0);
    celebrationScale.setValue(0.5);
    confettiProgress.setValue(0);
    setCelebrationPhrase(speechService.speakPraise());

    Animated.parallel([
      Animated.timing(confettiProgress, {
        toValue: 1,
        duration: CELEBRATION_BURST_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(celebrationScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(celebrationOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      Animated.timing(celebrationOpacity, {
        toValue: 0,
        duration: CELEBRATION_FADE_MS,
        useNativeDriver: true,
      }).start(() => {
        setCelebrating(false);
      });
    }, CELEBRATION_BURST_MS + CELEBRATION_HOLD_MS);
  };

  const handleWordComplete = (word: string) => {
    resolvingRef.current = true;
    // A completed word must never let a stale impossible-tier timeout fire afterward — cancel the
    // fuse/timer and the music loop the instant success lands, win or not.
    clearImpossibleTimer();
    gameMusicService.stop();
    setFeedback('Perfect! The whole word is collected.');
    recordWordCompleted(word);
    triggerCelebration();
    setTimeout(() => {
      setCurrentWord(getNextWord(words, word));
      resolvingRef.current = false;
    }, NEXT_WORD_DELAY_MS);
  };

  /** Shared by `easy`'s tap handler, `hard`+'s initial-touch pickup, and `hard`+'s continuous
   *  head-proximity pickup — the only thing that differs between all three is how a tile's pickup
   *  attempt is triggered, not what happens once one is. Returns the classification result so
   *  drag callers can synchronously decide whether a head was just born (see
   *  `handleHeadPanStart`), rather than waiting for the next render to observe `collectionState`. */
  const attemptPickup = (tile: ScatteredLetter) => {
    if (resolvingRef.current || !collectionState || collectionState.status !== 'in-progress') {
      return null;
    }

    const result = resolvePickup(collectionState, tile, DEFAULT_BEE_LINE_TUNING);
    setCollectionState(result.next);

    const nextScoreState = applyScore(scoreState, result.outcome, DEFAULT_BEE_LINE_SCORE_TUNING);
    setScoreState(nextScoreState);

    if (result.outcome === 'correct') {
      collectedIdsRef.current.add(tile.id);
      setFeedback('Nice! Right letter.');
      if (result.next.status === 'complete') {
        handleWordComplete(result.next.word);
      }
      return result;
    }

    setFeedback(result.outcome === 'wrong-order' ? "Not the next letter yet — try again!" : "That's not it — try again!");
    triggerScorePopup(nextScoreState.running - scoreState.running);

    // Both mistake branches below (wrong-order, wrong-letter) route through here, so the villain's
    // heckle is wired once, at this shared chokepoint, rather than duplicated per-outcome — mirroring
    // HPF's own rejectPot precedent. Deliberately the plain 'Challenging' heckle only: no
    // 'BeingNaughty' steal-telegraph, no larder-directed lunge — this villain never has a wind-up to
    // pay off.
    if (villainPresent) {
      villain.trigger('Challenging');
    }

    if (result.outcome === 'wrong-order') {
      // 'keep-chain' (this tier's default) leaves the trail fully intact — the mis-tapped tile just
      // bounces back to its field position, uncollected. Only the wobble/flash/sound treatment fires.
      triggerTileWobble(tile.id);
      soundEffectsService.playCue('bee-line-wrong-order');
      // A warm, non-scolding reaction to this gentler slip only (not wrong-letter, which already
      // gets the bigger headshake/scatter treatment above — layering Mama Bear on top of that wasn't
      // asked for). Roadmap/architecture claim she "already" reacts this way to an HPF miss — she
      // doesn't (rejectPot never calls mamaBear.trigger; see this epic's roadmap addendum). 'Talking'
      // is HPF's own warm, low-stakes cheer (its per-correct-letter reaction), reused here as the new
      // "warm, non-scolding" reaction this epic actually asks for — reads warmer than 'Poked's
      // playful bump.
      mamaBear.trigger('Talking');
    }

    if (result.outcome === 'wrong-letter' && currentWord) {
      // Snapshot the in-progress trail's current positions/letters before collectionState's reset
      // (already applied above via setCollectionState) is reflected in the next render, so the
      // scatter overlay below has something real to burst apart instead of the chain having already
      // visually vanished (Epic 19.5's flagged "trail vanishes instantly" gap).
      const preBreakTrailLetters = currentWord.slice(1, collectionState.nextExpectedIndex);
      const preBreakHeadPosition = headPosition ?? field?.tiles.find((t) => t.orderIndex === 0)?.position ?? null;
      if (preBreakHeadPosition) {
        setScatterSnapshot({
          headPosition: preBreakHeadPosition,
          headLetter: currentWord[0] ?? '',
          trailPositions: resolveTrailSegmentPositions(headPathRef.current, preBreakTrailLetters.length, TRAIL_SEGMENT_SPACING_PX),
          trailLetters: preBreakTrailLetters,
        });
      }
      triggerBeeHeadshake();
      triggerScatterBurst();
      soundEffectsService.playCue('bee-line-wrong-letter');
    }

    if (result.chainBroke && field) {
      // The whole trail scatters back onto the field (UX Step 18). Whether the tiles land at NEW
      // positions or the SAME ones depends on the tier (architecture 26.4's "position randomization
      // is just *when* you call the builder"): only `impossible` re-randomizes per attempt — every
      // other tier's retry must reuse the same field, so a fresh `buildBeeLineField` call there
      // would silently reshuffle a layout the child was trying to memorize. A tile's on-field
      // position and its "collected" status are already tracked separately (`collectionState`), so
      // when positions don't change, resetting collection state via `acknowledgeChainBreak` against
      // the unchanged `field` is sufficient to make every tile reappear at its original spot.
      resolvingRef.current = true;
      const nextField = modeConfig.randomizePositionsPerAttempt
        ? buildBeeLineField(field.word, modeConfig.decoyLetterCount, fieldBounds!)
        : field;
      setTimeout(() => {
        setField(nextField);
        setCollectionState((state) => (state ? acknowledgeChainBreak(state) : state));
        collectedIdsRef.current = new Set();
        headPathRef.current = [];
        setHeadPosition(null);
        setScatterSnapshot(null);
        resolvingRef.current = false;
        // The target word re-displays so the child can immediately restart it — no separate
        // confirmation tap, the same auto-dismissing banner used for a fresh word.
        revealWord(nextField.word);
        // A decoy-mistake retry is a fresh attempt at impossible too — re-arm the fuse/timer/music
        // for it. No-op at every other tier (modeConfig.timer is undefined there).
        startTimedAttempt(nextField.word);
      }, CHAIN_BREAK_HOLD_MS);
    }

    return result;
  };

  const handleTilePress = (tile: ScatteredLetter) => {
    if (modeConfig.input !== 'tap') {
      return;
    }
    attemptPickup(tile);
  };

  /** Continuous proximity check driving `hard`+'s pickup (roadmap Epic 19 revision: the child
   *  steers the head over a tile rather than dragging each tile to a fixed target). Checks every
   *  still-uncollected tile — not just the next expected one — so a steered head that grazes an
   *  out-of-order or decoy tile along the way still triggers the existing mistake classification,
   *  exactly as it would for any other pickup trigger (`wrong-letter` is now reachable at
   *  crazy/impossible since Epic 21 gave those tiers real decoyLetterCount values). */
  const checkHeadProximityPickup = (point: Point) => {
    if (!field) {
      return;
    }

    for (const tile of field.tiles) {
      if (collectedIdsRef.current.has(tile.id)) {
        continue;
      }
      const distance = Math.hypot(point.x - tile.position.x, point.y - tile.position.y);
      if (distance <= HEAD_PICKUP_RADIUS_PX) {
        attemptPickup(tile);
        return;
      }
    }
  };

  /** Fires on touch-start for any still-draggable `hard`+ tile: every not-yet-collected
   *  'correct'-kind tile before the first pickup (decoys are never draggable — dragging one makes
   *  no narrative sense once it's just a passive obstacle), and the head's own persistent element
   *  afterward (a lift-and-regrab resuming control). Before the first pickup, touching the tile
   *  immediately resolves it via `attemptPickup` — the correct-next tile becomes the head on the
   *  spot; any other correct-kind tile immediately registers as the existing wrong-order mistake,
   *  per this epic's chosen resolution of the "which tiles are grabbable at the start" open
   *  question (see the roadmap Epic 19 revision note for the full reasoning). */
  const handleHeadPanStart = (tile: ScatteredLetter, absoluteX: number, absoluteY: number) => {
    if (resolvingRef.current) {
      return;
    }

    if (collectedIdsRef.current.size > 0) {
      // Resuming control of an already-collected head after a lift-and-regrab — the recorded path
      // and trail stay exactly where they were; onUpdate just keeps extending them from here.
      return;
    }

    const result = attemptPickup(tile);
    if (!result || result.outcome !== 'correct') {
      return;
    }

    const point = toContainerRelative({ x: absoluteX, y: absoluteY }, containerBounds);
    headPathRef.current = [point];
    setHeadPosition(point);
  };

  /** Fires on every drag frame once a head exists (a no-op beforehand, for a mistaken touch that
   *  never became a head). Extends the recorded path, moves the head, and checks for a proximity
   *  pickup — this is what makes pickup continuous during the drag rather than a discrete
   *  drop-target check. */
  const handleHeadPanUpdate = (absoluteX: number, absoluteY: number) => {
    if (resolvingRef.current || collectedIdsRef.current.size === 0) {
      return;
    }

    const point = toContainerRelative({ x: absoluteX, y: absoluteY }, containerBounds);
    headPathRef.current = appendTrailPathPoint(headPathRef.current, point, {
      minSpacingPx: TRAIL_PATH_MIN_POINT_SPACING_PX,
      maxLength: TRAIL_PATH_MAX_POINTS,
    });
    setHeadPosition(point);
    checkHeadProximityPickup(point);
  };

  useEffect(() => {
    startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current);
      }
      if (mistakeTileTimeoutRef.current) {
        clearTimeout(mistakeTileTimeoutRef.current);
      }
      clearImpossibleTimer();
      speechService.stop();
      soundEffectsService.stopAll();
      gameMusicService.stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (words.length === 0) {
      return;
    }
    setCurrentWord((current) => current ?? words[0]);
  }, [words]);

  useEffect(() => {
    if (!currentWord) {
      return;
    }
    setCollectionState(createCollectionState(currentWord));
    setFeedback('Collect the letters in order!');
    // A new word means no head yet — clear the previous word's steered-head state so it doesn't
    // linger into the next round.
    collectedIdsRef.current = new Set();
    headPathRef.current = [];
    setHeadPosition(null);
    // The running score is a per-word-attempt "feel" value (architecture 26.6) — a fresh word
    // starts back at zero, along with any mistake-feedback still mid-animation from the last one.
    setScoreState({ running: 0 });
    setScorePopup(null);
    setMistakeTileId(null);
    setScatterSnapshot(null);
    setFireworkSnapshot(null);
    revealWord(currentWord);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWord]);

  useEffect(() => {
    if (!currentWord || !fieldBounds) {
      return;
    }
    setField(buildBeeLineField(currentWord, modeConfig.decoyLetterCount, fieldBounds));
    // Builds the field for a word's FIRST attempt (or once fieldBounds first becomes available) —
    // every tier reuses this same call, satisfying "once per word" at easy/hard/crazy outright.
    // impossible's "once per ATTEMPT" requirement (architecture 26.4) is satisfied by a second call
    // site: attemptPickup's chainBroke handler rebuilds the field for every retry after this one,
    // gated on modeConfig.randomizePositionsPerAttempt — one buildBeeLineField code path, just
    // called from two places depending on whether it's attempt 1 or a retry.
    // A brand-new word is also the first of the three "start a fresh timed attempt" moments (Epic
    // 23) — no-ops below impossible since modeConfig.timer is undefined there.
    startTimedAttempt(currentWord);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWord, fieldBounds]);

  const measureField = () => {
    if (!containerBounds) {
      return;
    }
    fieldRef.current?.measureInWindow((x, y, width, height) => {
      setFieldBounds({ x: x - containerBounds.x, y: y - containerBounds.y, width, height });
    });
  };

  useEffect(() => {
    measureField();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerBounds]);

  const handleGoHome = () => {
    router.replace('/home');
  };

  const handleExitApp = () => {
    if (typeof window !== 'undefined' && window.location) {
      window.location.href = 'about:blank';
      return;
    }
    router.replace('/home');
  };

  const remainingTiles = field && collectionState
    ? field.tiles.filter((tile) => !collectionState.collected.includes(tile.id))
    : [];
  const collectedPrefix = currentWord && collectionState ? currentWord.slice(0, collectionState.nextExpectedIndex) : '';

  // hard+'s Snake rework: the tile for the word's first letter (orderIndex 0) is always rendered
  // as the dedicated head element — at its own scattered position before any pickup, at
  // `headPosition` afterward — never as part of the plain scattered list below, so the same
  // View/GestureDetector persists across that transition instead of unmounting mid-gesture.
  const headFieldTile = field ? field.tiles.find((tile) => tile.orderIndex === 0) ?? null : null;
  const dragRemainingTiles = headFieldTile
    ? remainingTiles.filter((tile) => tile.id !== headFieldTile.id)
    : remainingTiles;
  const trailLetters = collectedPrefix.slice(1);
  const trailPositions = resolveTrailSegmentPositions(headPathRef.current, trailLetters.length, TRAIL_SEGMENT_SPACING_PX);
  const headRenderPosition: Point | null = headPosition ?? headFieldTile?.position ?? null;
  const headLeft = headRenderPosition ? headRenderPosition.x - (fieldBounds?.x ?? 0) - TILE_SIZE / 2 : 0;
  const headTop = headRenderPosition ? headRenderPosition.y - (fieldBounds?.y ?? 0) - TILE_SIZE / 2 : 0;
  const headPan = headFieldTile
    ? Gesture.Pan()
        .runOnJS(true)
        .onStart((event) => handleHeadPanStart(headFieldTile, event.absoluteX, event.absoluteY))
        .onUpdate((event) => handleHeadPanUpdate(event.absoluteX, event.absoluteY))
    : null;

  // Wrong-order's tile wobble: a rotate oscillation applied only to the mis-tapped tile's wrapper.
  const wobbleRotate = wobbleAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-9deg', '0deg', '9deg'] });
  const mistakeTileStyle = (tileId: string) =>
    tileId === mistakeTileId ? [styles.mistakeOutline, { transform: [{ rotate: wobbleRotate }] }] : null;

  // Wrong-letter's "sproing/poof" scatter burst: shared scale/rotate/fade applied to every element
  // of `scatterSnapshot`'s overlay.
  const scatterOpacity = scatterAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });
  const scatterScale = scatterAnim.interpolate({ inputRange: [0, 0.35, 1], outputRange: [1, 1.2, 0.2] });
  const scatterRotate = scatterAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '150deg'] });
  const beeHeadshakeRotate = beeShakeAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-22deg', '0deg', '22deg'] });

  // The fuse/sparkler burn-down (UX Step 17): the filled bar's left edge stays fixed while its
  // right edge shrinks toward it as fuseAnim runs 1 -> 0, via a scaleX + compensating translateX
  // (rather than animating `width` every frame) so the burn-down stays on the native driver.
  const fuseScaleX = fuseAnim;
  const fuseTranslateX = fuseAnim.interpolate({ inputRange: [0, 1], outputRange: [-FUSE_BAR_WIDTH_PX / 2, 0] });
  // The lit spark rides the tip of the shrinking fill, from the far end down to the fixed origin.
  const fuseSparkTranslateX = fuseAnim.interpolate({ inputRange: [0, 1], outputRange: [0, FUSE_BAR_WIDTH_PX] });

  // The timeout firework burst: the trail/head tiles caught mid-attempt simply fade+shrink in
  // place (no fling/rotate — that treatment is reserved for the wrong-letter scatter above, so the
  // two consequences read as visually distinct), while FIREWORK_PARTICLES do the actual "upward
  // whoosh" via their own per-particle translateX/translateY below.
  const fireworkTileOpacity = fireworkAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, 1, 0] });
  const fireworkTileScale = fireworkAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] });
  const fireworkParticleOpacity = fireworkAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1, 0] });
  const fireworkParticleScale = fireworkAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.3, 1.3, 0.7] });

  return (
    <View
      ref={containerRef}
      style={styles.container}
      onLayout={() => {
        containerRef.current?.measureInWindow((x, y, width, height) => {
          setContainerBounds({ x, y, width, height });
        });
      }}
    >
      <Pressable testID="back-button" style={styles.backButton} onPress={handleGoHome}>
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Bee Line</Text>
      <Text style={styles.greeting}>
        {profile ? `Hi ${profile.name}! Follow the bee and collect the letters.` : 'Follow the bee and collect the letters.'}
      </Text>
      {selectedList ? <Text style={styles.listName}>List: {selectedList.name}</Text> : null}
      <Text style={styles.modeLine}>Mode: {GAME_MODE_CONFIG[gameMode].label}</Text>

      {words.length > 0 ? (
        <View style={styles.characterRow}>
          <Character characterId="mama-bear" size="medium" animationState={mamaBear.animationState} />
          {villainPresent && villainId ? (
            <Character characterId={villainId} size="small" animationState={villain.animationState} />
          ) : null}
        </View>
      ) : null}

      {words.length === 0 ? (
        <View style={styles.emptyListCard}>
          <Text style={styles.emptyListText}>This list doesn't have any words yet.</Text>
          <Pressable style={styles.secondaryButton} onPress={() => router.replace('/lists')}>
            <Text style={styles.secondaryButtonText}>Add words or pick another list</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.targetCard}>
            <Text style={styles.targetLabel}>Listen and collect it!</Text>
            <Pressable testID="megaphone-button" onPress={handleMegaphonePress}>
              <Text style={styles.targetPrompt}>🎯 🐝</Text>
            </Pressable>
          </View>

          <View style={styles.scoreRow}>
            <Text testID="bee-line-score" style={styles.scoreText}>Score: {scoreState.running}</Text>
            {scorePopup ? (
              <Animated.Text
                key={scorePopup.key}
                testID="bee-line-score-popup"
                style={[
                  styles.scorePopup,
                  {
                    opacity: scorePopupAnim.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 1, 1, 0] }),
                    transform: [
                      { translateY: scorePopupAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }) },
                    ],
                  },
                ]}
              >
                {scorePopup.delta > 0 ? `+${scorePopup.delta}` : `${scorePopup.delta}`}
              </Animated.Text>
            ) : null}
          </View>

          <View style={styles.wordSoFarRow}>
            {collectedPrefix.split('').map((letter, index) => (
              <React.Fragment key={`${letter}-${index}`}>
                {index > 0 ? <Text style={styles.wordSoFarConnector}>{modeConfig.showTowedTrail ? '' : '·'}</Text> : null}
                <View style={styles.wordSoFarTile}>
                  <Text style={styles.wordSoFarTileText}>{letter.toUpperCase()}</Text>
                </View>
              </React.Fragment>
            ))}
            {currentWord && collectedPrefix.length < currentWord.length ? (
              <View style={styles.wordSoFarSlot}>
                <Text style={styles.wordSoFarSlotText}>?</Text>
              </View>
            ) : null}
          </View>

          <View ref={fieldRef} style={styles.field} onLayout={measureField}>
            {modeConfig.input === 'tap'
              ? remainingTiles.map((tile) => {
                  const left = tile.position.x - (fieldBounds?.x ?? 0) - TILE_SIZE / 2;
                  const top = tile.position.y - (fieldBounds?.y ?? 0) - TILE_SIZE / 2;

                  return (
                    <Pressable
                      key={tile.id}
                      testID={`bee-line-tile-${tile.id}`}
                      style={[styles.tileWrapper, { left, top }]}
                      onPress={() => handleTilePress(tile)}
                    >
                      <Animated.View style={mistakeTileStyle(tile.id)}>
                        <HexTile letter={tile.letter} size={TILE_SIZE} />
                      </Animated.View>
                    </Pressable>
                  );
                })
              : (
                <>
                  {/* Not-yet-collected tiles other than the head. Draggable ('correct'-kind only —
                      dragging a decoy makes no narrative sense) before the first pickup; once a
                      head exists, every one of these is a passive, collision-only obstacle the
                      head can pick up or mistake-trigger on contact. */}
                  {dragRemainingTiles.map((tile) => {
                    const left = tile.position.x - (fieldBounds?.x ?? 0) - TILE_SIZE / 2;
                    const top = tile.position.y - (fieldBounds?.y ?? 0) - TILE_SIZE / 2;
                    const isDraggable = collectionState?.collected.length === 0 && tile.kind === 'correct';

                    if (!isDraggable) {
                      return (
                        <View key={tile.id} testID={`bee-line-tile-${tile.id}`} style={[styles.tileWrapper, { left, top }]}>
                          <Animated.View style={mistakeTileStyle(tile.id)}>
                            <HexTile letter={tile.letter} size={TILE_SIZE} />
                          </Animated.View>
                        </View>
                      );
                    }

                    const pan = Gesture.Pan()
                      .runOnJS(true)
                      .onStart((event) => handleHeadPanStart(tile, event.absoluteX, event.absoluteY))
                      .onUpdate((event) => handleHeadPanUpdate(event.absoluteX, event.absoluteY));

                    return (
                      <GestureDetector key={tile.id} gesture={pan}>
                        <View testID={`bee-line-tile-${tile.id}`} style={[styles.tileWrapper, { left, top }]}>
                          <Animated.View style={mistakeTileStyle(tile.id)}>
                            <HexTile letter={tile.letter} size={TILE_SIZE} />
                          </Animated.View>
                        </View>
                      </GestureDetector>
                    );
                  })}

                  {/* Trailing body segments — one per letter collected after the first — placed
                      along the head's recorded path, farthest-from-head first so nearer segments
                      stack visually on top where positions overlap. */}
                  {trailPositions.map((position, index) => {
                    const left = position.x - (fieldBounds?.x ?? 0) - TILE_SIZE / 2;
                    const top = position.y - (fieldBounds?.y ?? 0) - TILE_SIZE / 2;

                    return (
                      <View
                        key={`bee-line-trail-${index}`}
                        pointerEvents="none"
                        style={[styles.tileWrapper, { left, top, zIndex: 5 + (trailPositions.length - index) }]}
                      >
                        <HexTile letter={trailLetters[index]} size={TILE_SIZE} backgroundColor={theme.colors.gold} />
                      </View>
                    );
                  })}

                  {/* The head: the first letter's tile, doubling as the drag handle for the whole
                      chain. Always the same element (never unmounted across the "just a scattered
                      tile" -> "steering the snake" transition), so an in-flight touch survives it.
                      Hidden during a wrong-letter scatter burst or a timeout firework burst — their
                      respective overlays below take over showing (and animating away) the head for
                      that window instead, so nothing visually doubles up. */}
                  {headFieldTile && headPan && !scatterSnapshot && !fireworkSnapshot ? (
                    <GestureDetector gesture={headPan}>
                      <View
                        testID="bee-line-head"
                        style={[styles.tileWrapper, styles.headWrapper, { left: headLeft, top: headTop }]}
                      >
                        <Text style={styles.beeRider} pointerEvents="none">🐝</Text>
                        <HexTile letter={headFieldTile.letter} size={TILE_SIZE} />
                      </View>
                    </GestureDetector>
                  ) : null}

                  {/* Impossible-tier fuse/sparkler burn-down (UX Step 17) — the PRIMARY read for
                      the time budget, front-of-trail at the steered head's position. Only rendered
                      when modeConfig.timer is defined (impossible only) and no burst is in
                      progress; the small numeral beside it is a deliberately secondary readout, not
                      the dominant element. */}
                  {modeConfig.timer && headRenderPosition && !scatterSnapshot && !fireworkSnapshot ? (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.fuseWrapper,
                        {
                          left: headRenderPosition.x - (fieldBounds?.x ?? 0) - FUSE_BAR_WIDTH_PX / 2,
                          top: headRenderPosition.y - (fieldBounds?.y ?? 0) - TILE_SIZE / 2 - 34,
                        },
                      ]}
                    >
                      <View testID="bee-line-fuse-track" style={styles.fuseTrack}>
                        <Animated.View
                          style={[
                            styles.fuseFill,
                            { transform: [{ translateX: fuseTranslateX }, { scaleX: fuseScaleX }] },
                          ]}
                        />
                        <Animated.Text
                          style={[styles.fuseSpark, { transform: [{ translateX: fuseSparkTranslateX }] }]}
                        >
                          ✨
                        </Animated.Text>
                      </View>
                      {secondsRemaining !== null ? (
                        <Text testID="bee-line-fuse-seconds" style={styles.fuseSecondsText}>
                          {secondsRemaining}s
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  {/* Wrong-letter's "sproing/poof" scatter burst (UX Step 18): the trail's pre-break
                      snapshot tumbles apart and fades while the startled bee shakes its head, filling
                      the CHAIN_BREAK_HOLD_MS window during which collectionState has already reset
                      but the field hasn't rebuilt yet — replacing the "trail vanishes instantly"
                      gap Epic 19.5 flagged and deferred to this epic. */}
                  {scatterSnapshot ? (
                    <View pointerEvents="none">
                      {scatterSnapshot.trailPositions.map((position, index) => {
                        const trailLeft = position.x - (fieldBounds?.x ?? 0) - TILE_SIZE / 2;
                        const trailTop = position.y - (fieldBounds?.y ?? 0) - TILE_SIZE / 2;
                        const flingSign = index % 2 === 0 ? 1 : -1;

                        return (
                          <Animated.View
                            key={`scatter-trail-${index}`}
                            style={[
                              styles.tileWrapper,
                              {
                                left: trailLeft,
                                top: trailTop,
                                zIndex: 5 + (scatterSnapshot.trailPositions.length - index),
                                opacity: scatterOpacity,
                                transform: [
                                  { scale: scatterScale },
                                  { rotate: scatterRotate },
                                  {
                                    translateX: scatterAnim.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [0, flingSign * (20 + index * 6)],
                                    }),
                                  },
                                  {
                                    translateY: scatterAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 24 + index * 8] }),
                                  },
                                ],
                              },
                            ]}
                          >
                            <HexTile letter={scatterSnapshot.trailLetters[index]} size={TILE_SIZE} backgroundColor={theme.colors.gold} />
                          </Animated.View>
                        );
                      })}

                      <Animated.View
                        style={[
                          styles.tileWrapper,
                          styles.headWrapper,
                          {
                            left: scatterSnapshot.headPosition.x - (fieldBounds?.x ?? 0) - TILE_SIZE / 2,
                            top: scatterSnapshot.headPosition.y - (fieldBounds?.y ?? 0) - TILE_SIZE / 2,
                            opacity: scatterOpacity,
                            transform: [{ scale: scatterScale }, { rotate: scatterRotate }],
                          },
                        ]}
                      >
                        <Animated.Text style={[styles.beeRider, { transform: [{ rotate: beeHeadshakeRotate }] }]}>
                          🐝
                        </Animated.Text>
                        <HexTile letter={scatterSnapshot.headLetter} size={TILE_SIZE} />
                      </Animated.View>
                    </View>
                  ) : null}

                  {/* Impossible-tier timeout's firework burst (UX Step 17/18) — deliberately
                      distinct from both the wrong-letter scatter above (no fling/rotate) and the
                      win-celebration confetti (a single upward whoosh from the fuse's origin point,
                      not a shower falling from above), so a child can tell success from timeout
                      within a second. The trail/head caught mid-attempt just fade+shrink in place;
                      FIREWORK_PARTICLES carry the actual "explosion" read. */}
                  {fireworkSnapshot ? (
                    <View pointerEvents="none">
                      {fireworkSnapshot.trailPositions.map((position, index) => {
                        const trailLeft = position.x - (fieldBounds?.x ?? 0) - TILE_SIZE / 2;
                        const trailTop = position.y - (fieldBounds?.y ?? 0) - TILE_SIZE / 2;

                        return (
                          <Animated.View
                            key={`firework-trail-${index}`}
                            style={[
                              styles.tileWrapper,
                              {
                                left: trailLeft,
                                top: trailTop,
                                zIndex: 5 + (fireworkSnapshot.trailPositions.length - index),
                                opacity: fireworkTileOpacity,
                                transform: [{ scale: fireworkTileScale }],
                              },
                            ]}
                          >
                            <HexTile letter={fireworkSnapshot.trailLetters[index]} size={TILE_SIZE} backgroundColor={theme.colors.gold} />
                          </Animated.View>
                        );
                      })}

                      <Animated.View
                        style={[
                          styles.tileWrapper,
                          styles.headWrapper,
                          {
                            left: fireworkSnapshot.headPosition.x - (fieldBounds?.x ?? 0) - TILE_SIZE / 2,
                            top: fireworkSnapshot.headPosition.y - (fieldBounds?.y ?? 0) - TILE_SIZE / 2,
                            opacity: fireworkTileOpacity,
                            transform: [{ scale: fireworkTileScale }],
                          },
                        ]}
                      >
                        <Text style={styles.beeRider}>🐝</Text>
                        <HexTile letter={fireworkSnapshot.headLetter} size={TILE_SIZE} />
                      </Animated.View>

                      {/* The particle burst itself — a fan of gold/hot-pink dots launched upward
                          from the fuse's origin (the pre-timeout head position) and fading out. */}
                      <View
                        style={{
                          position: 'absolute',
                          left: fireworkSnapshot.headPosition.x - (fieldBounds?.x ?? 0),
                          top: fireworkSnapshot.headPosition.y - (fieldBounds?.y ?? 0),
                        }}
                      >
                        {FIREWORK_PARTICLES.map((particle, index) => (
                          <Animated.View
                            key={`firework-particle-${index}`}
                            style={[
                              styles.fireworkParticle,
                              {
                                backgroundColor: particle.color,
                                opacity: fireworkParticleOpacity,
                                transform: [
                                  { translateX: fireworkAnim.interpolate({ inputRange: [0, 1], outputRange: [0, particle.dx] }) },
                                  { translateY: fireworkAnim.interpolate({ inputRange: [0, 1], outputRange: [0, particle.dy] }) },
                                  { scale: fireworkParticleScale },
                                ],
                              },
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                  ) : null}
                </>
              )}
          </View>

          <Text
            testID="bee-line-feedback"
            style={[
              styles.feedback,
              feedback.includes('Not the') || feedback.includes("That's not")
                ? styles.feedbackError
                : styles.feedbackSuccess,
            ]}
          >
            {feedback}
          </Text>
        </>
      )}

      {celebrating ? (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          <Confetti progress={confettiProgress} />
          <Animated.View
            testID="celebration-card"
            style={[
              styles.celebrationCard,
              { opacity: celebrationOpacity, transform: [{ scale: celebrationScale }] },
            ]}
          >
            <Text style={styles.celebrationTitle}>🎉 PERFECT! 🎉</Text>
            <Text style={styles.celebrationPhrase}>{celebrationPhrase}</Text>
          </Animated.View>
        </View>
      ) : null}

      {showBanner && currentWord ? (
        <View style={styles.bannerOverlay} pointerEvents="auto">
          <Animated.View
            style={[styles.bannerCard, { opacity: bannerOpacity, transform: [{ scale: bannerScale }] }]}
          >
            <Text style={styles.bannerFlourish}>🎉 ✨ 🐝 ✨ 🎉</Text>
            <Text testID="target-word" style={styles.bannerWord}>{currentWord.toUpperCase()}</Text>
            <Text style={styles.bannerSubtext}>Listen closely and remember it!</Text>
          </Animated.View>
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <Pressable style={styles.secondaryButton} onPress={() => router.replace('/lists')}>
          <Text style={styles.secondaryButtonText}>📚 Word Lists</Text>
        </Pressable>
        <Pressable style={styles.exitButton} onPress={handleExitApp}>
          <Text style={styles.exitButtonText}>Exit</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
  },
  greeting: {
    marginTop: theme.spacing.sm,
    color: theme.colors.muted,
    textAlign: 'center',
  },
  listName: {
    marginTop: 2,
    color: theme.colors.muted,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 13,
  },
  modeLine: {
    marginTop: 2,
    color: theme.colors.muted,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 13,
  },
  characterRow: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: theme.spacing.lg,
  },
  emptyListCard: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#111111',
    gap: theme.spacing.sm,
  },
  emptyListText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  targetCard: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#111111',
    minHeight: 96,
    justifyContent: 'center',
  },
  targetLabel: {
    fontSize: 13,
    color: theme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  targetPrompt: {
    marginTop: theme.spacing.xs,
    fontSize: 32,
  },
  scoreRow: {
    marginTop: theme.spacing.sm,
    alignSelf: 'center',
    position: 'relative',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
  },
  scorePopup: {
    position: 'absolute',
    top: -6,
    right: -34,
    fontSize: 18,
    fontWeight: '900',
    // Warm-orange, matching the wobble/flash treatment below — dips are always this color
    // regardless of which mistake caused them, so the child reads "score went down" at a glance.
    color: '#FF8C00',
  },
  mistakeOutline: {
    borderWidth: 3,
    borderColor: '#FF8C00',
    borderRadius: TILE_SIZE / 2,
  },
  wordSoFarRow: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
  },
  wordSoFarConnector: {
    fontSize: 18,
    color: theme.colors.muted,
    marginHorizontal: 2,
  },
  wordSoFarTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
    borderWidth: 3,
    borderColor: '#111111',
  },
  wordSoFarTileText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.surface,
  },
  wordSoFarSlot: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.xs,
    borderWidth: 3,
    borderColor: '#D4A41C',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  wordSoFarSlotText: {
    fontSize: 16,
    color: theme.colors.muted,
  },
  field: {
    marginTop: theme.spacing.sm,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 340,
    aspectRatio: 1,
    borderRadius: 24,
    backgroundColor: '#F5D998',
    borderWidth: 4,
    borderColor: '#111111',
    overflow: 'hidden',
  },
  tileWrapper: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  headWrapper: {
    alignItems: 'center',
    // Always drawn above every trailing segment and passive tile it might overlap.
    zIndex: 20,
  },
  beeRider: {
    position: 'absolute',
    top: -18,
    fontSize: 22,
  },
  // Impossible-tier fuse/sparkler (Epic 23, UX Step 17) — front-of-trail, above the steered head.
  fuseWrapper: {
    position: 'absolute',
    width: FUSE_BAR_WIDTH_PX,
    alignItems: 'center',
    zIndex: 21,
  },
  fuseTrack: {
    width: FUSE_BAR_WIDTH_PX,
    height: FUSE_BAR_HEIGHT_PX,
    borderRadius: FUSE_BAR_HEIGHT_PX / 2,
    backgroundColor: 'rgba(17,17,17,0.35)',
    borderWidth: 2,
    borderColor: '#111111',
    overflow: 'visible',
    justifyContent: 'center',
  },
  fuseFill: {
    width: FUSE_BAR_WIDTH_PX,
    height: FUSE_BAR_HEIGHT_PX - 4,
    borderRadius: (FUSE_BAR_HEIGHT_PX - 4) / 2,
    marginHorizontal: 2,
    // Warm-to-hot gradient isn't available via a flat RN style, so a single bright, fire-like
    // orange stands in for the "burning" fill — reads clearly against the fuse track's dark base.
    backgroundColor: '#FF8C00',
  },
  fuseSpark: {
    position: 'absolute',
    fontSize: 14,
    left: -7,
  },
  // Deliberately small/secondary (UX Step 17: the fuse is the PRIMARY read, this numeral is not).
  fuseSecondsText: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text,
  },
  // The timeout firework's particles — small bright dots, not letter tiles, so the burst reads as
  // its own distinct "explosion" element layered over the fading trail/head beneath it.
  fireworkParticle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#111111',
  },
  feedback: {
    marginTop: theme.spacing.lg,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
  },
  feedbackSuccess: {
    color: theme.colors.accent,
  },
  feedbackError: {
    color: theme.colors.primary,
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17,17,17,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  celebrationCard: {
    backgroundColor: theme.colors.accent,
    borderRadius: 28,
    borderWidth: 6,
    borderColor: '#111111',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    maxWidth: '85%',
    shadowColor: '#111111',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  celebrationTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: theme.colors.surface,
    textAlign: 'center',
    letterSpacing: 1,
  },
  celebrationPhrase: {
    marginTop: theme.spacing.sm,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.surface,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: theme.spacing.lg,
    left: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 3,
    borderColor: '#111111',
    zIndex: 10,
  },
  backButtonText: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17,17,17,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  bannerCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 28,
    borderWidth: 6,
    borderColor: '#111111',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    maxWidth: '85%',
    shadowColor: '#111111',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  bannerFlourish: {
    fontSize: 20,
    marginBottom: theme.spacing.sm,
  },
  bannerWord: {
    fontSize: 48,
    fontWeight: '900',
    color: theme.colors.surface,
    textAlign: 'center',
    letterSpacing: 2,
  },
  bannerSubtext: {
    marginTop: theme.spacing.md,
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.surface,
    textAlign: 'center',
  },
  actionsRow: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  secondaryButton: {
    alignSelf: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 999,
    backgroundColor: '#E4D4FF',
    borderWidth: 3,
    borderColor: '#111111',
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  exitButton: {
    alignSelf: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 999,
    backgroundColor: theme.colors.accent,
    borderWidth: 3,
    borderColor: '#111111',
  },
  exitButtonText: {
    color: theme.colors.surface,
    fontWeight: '700',
  },
});
