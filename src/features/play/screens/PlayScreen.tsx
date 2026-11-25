import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { theme } from '@/shared/lib/theme';
import { HONEY_LARDER_FLOOR, useSessionStore } from '@/stores/session-store';
import { useWordListStore } from '@/stores/word-list-store';
import { useGameModeStore } from '@/stores/game-mode-store';
import { useProgressStore } from '@/stores/progress-store';
import { useDailyRewardsStore } from '@/stores/daily-rewards-store';
import { speechService } from '@/shared/lib/speech';
import { characterAudioService } from '@/shared/lib/character-audio';
import { useReduceMotion } from '@/shared/lib/accessibility';
import { Confetti } from '@/shared/ui/Confetti';
import { Character } from '@/shared/ui/Character';
import { useCharacterAnimationState } from '@/shared/ui/useCharacterAnimationState';
import { checkAnimationBudget } from '@/shared/ui/animation-budget';
import { GAME_MODE_CONFIG } from '@/features/play/logic/game-modes';
import { CharacterRelativeSize, getCharacterById } from '@/data/characters/character-roster';
import { getVillainBehaviorTier } from '@/data/characters/villain-behavior';
import {
  defendStealAttempt,
  getStealTuning,
  resolveStealWindUp,
  SAFE_STEAL_ATTEMPT,
  StealAttempt,
  triggerStealAttempt,
} from '@/data/characters/steal-attempt';
import {
  Bounds,
  Point,
  POT_SIZE,
  buildLetterBundle,
  computeThrow,
  escalatedDriftLeg,
  getNextWord,
  isFlickOnTarget,
  randomDriftOffset,
  randomPotPosition,
  toContainerRelative,
} from '@/features/play/logic/honey-pot-flick';
import { FLICK_TILE_GAP, getBannerFontSize, getFlickLayout } from '@/features/play/logic/honey-pot-layout';

const GHOST_HALF = 28;
const THROW_DURATION_MS = 260;
const BLINK_INTERVAL_MS = 110;
const BLINK_COUNT = 6;
const CELEBRATION_BURST_MS = 800;
const CELEBRATION_HOLD_MS = 900;
const CELEBRATION_FADE_MS = 300;
const CELEBRATION_TOTAL_MS = CELEBRATION_BURST_MS + CELEBRATION_HOLD_MS + CELEBRATION_FADE_MS;
const NEXT_WORD_DELAY_MS = CELEBRATION_TOTAL_MS + 100;

// How many pots the honey-larder row draws before collapsing the rest into a "+N" — keeps the
// persistent row small and legible instead of growing unbounded over a long session.
const HONEY_LARDER_DISPLAY_CAP = 6;
// A steal-completed scamper is a brief comedic beat, not a full return-to-Idle hold.
const STEAL_SCAMPER_HOLD_MS = 700;
// How long the villain's reach/lunge toward the larder (and back) takes.
const STEAL_LUNGE_ANIM_MS = 260;

export function PlayScreen() {
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  // Tray sizing follows the round's full bundle, not what's left in it, so the field above the tray
  // doesn't resize every time a letter is caught.
  const [roundLetterCount, setRoundLetterCount] = useState(0);
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState('Flick a letter at the honey pot!');
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationPhrase, setCelebrationPhrase] = useState('');

  const [containerBounds, setContainerBounds] = useState<Bounds | null>(null);
  const [fieldBounds, setFieldBounds] = useState<Bounds | null>(null);
  const [potCenter, setPotCenter] = useState<Point | null>(null);
  const [potVisible, setPotVisible] = useState(true);
  const [potBlink, setPotBlink] = useState(false);

  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  const ghostAnim = useRef(new Animated.ValueXY()).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const bannerScale = useRef(new Animated.Value(0.6)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(0.5)).current;
  const confettiProgress = useRef(new Animated.Value(0)).current;
  const potDriftAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<View | null>(null);
  const fieldRef = useRef<View | null>(null);
  const resolvingRef = useRef(false);
  const fieldBoundsRef = useRef<Bounds | null>(null);
  const potCenterRef = useRef<Point | null>(null);
  const potDriftOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const driftActiveRef = useRef(false);
  const potPlacedAtRef = useRef<number>(Date.now());

  const [stealAttempt, setStealAttempt] = useState<StealAttempt>(SAFE_STEAL_ATTEMPT);
  // Epic 12: shared with Character.tsx's own sprite-playback gating rather than each wiring its
  // own AccessibilityInfo listener — see src/shared/lib/accessibility/useReduceMotion.ts.
  const reduceMotionEnabled = useReduceMotion();
  const stealAttemptRef = useRef<StealAttempt>(SAFE_STEAL_ATTEMPT);
  const stealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const villainLungeAnim = useRef(new Animated.Value(0)).current;
  // Mirrors honeyStash for the recursive drift loop below (wanderPotStep), which — like
  // fieldBoundsRef/potCenterRef — can keep recursing on a closure from an earlier render, so it
  // must read state through a ref rather than a destructured value to stay current.
  const honeyStashRef = useRef(0);

  const {
    currentWord,
    setCurrentWord,
    incrementScore,
    resetScore,
    score,
    honeyStash,
    villainId,
    pickSessionVillain,
    earnHoneyPot,
    stealHoneyPot,
    resetHoneyStash,
  } = useSessionStore();
  const selectedList = useWordListStore((state) => state.getSelectedList());
  const words = useMemo(() => selectedList?.words ?? [], [selectedList]);
  const gameMode = useGameModeStore((state) => state.mode);
  const modeConfig = GAME_MODE_CONFIG[gameMode];
  const startSession = useProgressStore((state) => state.startSession);
  const recordCorrectFlick = useProgressStore((state) => state.recordCorrectFlick);
  const recordMissedFlick = useProgressStore((state) => state.recordMissedFlick);
  const recordWordCompleted = useProgressStore((state) => state.recordWordCompleted);
  const recordCompletedPlay = useDailyRewardsStore((state) => state.recordCompletedPlay);

  // The villain-behavior tier (25.10.4) drives whether steal machinery exists at all — `null`
  // tuning at Passive means no steal state is ever instantiated, purely Epic 10's animation-only
  // taunt behavior.
  const villainTier = getVillainBehaviorTier(gameMode);
  const stealTuning = getStealTuning(villainTier);

  const mamaBear = useCharacterAnimationState();
  const villain = useCharacterAnimationState();

  // Transient reach/lunge toward the larder and back, from the villain's stable home position in
  // characterRow (25.10.5) — never a relocation onto the play field. Softened to a plain pose
  // swap under reduce-motion; the steal's state/consequence still applies either way (25.8).
  const runStealTravel = (towardLarder: boolean) => {
    if (reduceMotionEnabled) {
      return;
    }
    Animated.timing(villainLungeAnim, {
      toValue: towardLarder ? 1 : 0,
      duration: STEAL_LUNGE_ANIM_MS,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const clearStealTimeout = () => {
    if (stealTimeoutRef.current) {
      clearTimeout(stealTimeoutRef.current);
      stealTimeoutRef.current = null;
    }
  };

  /** Resolves an open attempt once its wind-up window elapses undefended (host-owned timing —
   *  the pure state machine in steal-attempt.ts has no timers of its own). */
  const resolveStealTimeout = () => {
    stealTimeoutRef.current = null;
    if (!stealTuning) {
      return;
    }

    const { next, outcome, resource } = resolveStealWindUp(stealAttemptRef.current, stealTuning);
    setStealAttempt(next);
    runStealTravel(false);

    if (outcome === 'Stolen' && resource != null) {
      const stole = stealHoneyPot();
      villain.trigger(stole ? 'BeingNaughty' : 'Idle', STEAL_SCAMPER_HOLD_MS);
    } else if (outcome === 'Retreated') {
      villain.trigger('Idle');
    }
  };

  /** Opens a steal attempt (Safe -> Telegraphing) if the tier has steal machinery, nothing is
   *  already open, and the larder has a pot above its floor to put at risk. */
  const openStealAttempt = () => {
    if (!stealTuning || stealAttemptRef.current.status === 'Telegraphing') {
      return;
    }

    // pickResourceInJeopardy(): the larder has no per-pot identity, just a count, so any pot above
    // the floor is "the" resource at risk — a null resource is exactly how the floor guard
    // (never steal the last pot) prevents an attempt from opening at all. stealHoneyPot() itself
    // re-checks the floor as the source of truth when the attempt actually resolves, so this is a
    // fast, optimistic pre-check to avoid telegraphing a steal that can never land.
    const resource = honeyStashRef.current > HONEY_LARDER_FLOOR ? 'larder-pot' : null;
    const next = triggerStealAttempt(stealAttemptRef.current, resource);
    if (next === stealAttemptRef.current) {
      return;
    }

    setStealAttempt(next);
    villain.trigger('BeingNaughty', stealTuning.windUpMs);
    runStealTravel(true);

    clearStealTimeout();
    stealTimeoutRef.current = setTimeout(resolveStealTimeout, stealTuning.windUpMs);
  };

  /** The primary defense (next correct flick) and secondary defense (shoo-tap) both call this. */
  const handleStealDefended = () => {
    if (stealAttemptRef.current.status !== 'Telegraphing') {
      return;
    }
    clearStealTimeout();
    setStealAttempt(defendStealAttempt(stealAttemptRef.current));
    runStealTravel(false);
    villain.trigger('Poked');
  };

  const mamaBearTap = Gesture.Tap().runOnJS(true).onEnd(() => mamaBear.trigger('Poked'));
  const villainTap = Gesture.Tap()
    .runOnJS(true)
    .onEnd(() => {
      // At any tier with steal machinery, a tap during the wind-up is a valid shoo-tap defense
      // (25.11.3's secondary defense) — otherwise the tap stays the purely cosmetic Poked reaction
      // Epic 10 shipped.
      if (stealTuning?.allowTapDefense && stealAttemptRef.current.status === 'Telegraphing') {
        handleStealDefended();
        return;
      }
      villain.trigger('Poked');
    });

  useEffect(() => {
    startSession('honey-pot-flick');
    pickSessionVillain(gameMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fieldBoundsRef.current = fieldBounds;
  }, [fieldBounds]);

  useEffect(() => {
    potCenterRef.current = potCenter;
  }, [potCenter]);

  useEffect(() => {
    stealAttemptRef.current = stealAttempt;
  }, [stealAttempt]);

  useEffect(() => {
    honeyStashRef.current = honeyStash;
  }, [honeyStash]);

  // Architecture 25.8's on-screen animation budget, checked (not just assumed) against the actual
  // characters this screen renders. `characterRow` below is mama-bear plus at most one villain —
  // there's no dynamic/unbounded character list on this screen — so this dev-only warning is a
  // cheap invariant check rather than a runtime gate; see the roadmap Epic 12 write-up for why a
  // heavier enforcement mechanism (e.g. a global animation-budget registry) wasn't built.
  useEffect(() => {
    if (!__DEV__) {
      return;
    }
    const mamaBearCharacter = getCharacterById('mama-bear');
    const villainCharacter = villainId ? getCharacterById(villainId) : undefined;
    const entries = [
      mamaBearCharacter
        ? { relativeSize: mamaBearCharacter.relativeSize, isAnimating: mamaBear.animationState !== 'Idle' }
        : null,
      villainCharacter
        ? { relativeSize: villainCharacter.relativeSize, isAnimating: villain.animationState !== 'Idle' }
        : null,
    ].filter((entry): entry is { relativeSize: CharacterRelativeSize; isAnimating: boolean } => entry != null);

    const budget = checkAnimationBudget(entries);
    if (!budget.withinBudget) {
      console.warn('[PlayScreen] on-screen animation budget exceeded (architecture 25.8):', budget);
    }
  }, [villainId, mamaBear.animationState, villain.animationState]);

  useEffect(() => {
    const id = potDriftAnim.addListener((value) => {
      potDriftOffsetRef.current = value;
    });
    return () => potDriftAnim.removeListener(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (stealTimeoutRef.current) {
        clearTimeout(stealTimeoutRef.current);
      }
    };
  }, []);

  const wanderPotStep = () => {
    if (!driftActiveRef.current) {
      return;
    }

    const field = fieldBoundsRef.current;
    const center = potCenterRef.current;

    if (!field || !center) {
      setTimeout(wanderPotStep, 200);
      return;
    }

    // The longer the pot has sat here without being hit (i.e. the longer the child takes to aim),
    // the faster and more erratic each wander leg becomes.
    const elapsed = Date.now() - potPlacedAtRef.current;

    // Relentless also opens a steal attempt on a stall, not just a miss — reusing this same
    // escalation clock, so dithering too long is treated the same as the drift speeding up.
    if (stealTuning?.triggerOnStall && elapsed >= modeConfig.potDriftEscalationMs) {
      openStealAttempt();
    }

    const { rangePx, legMs } = escalatedDriftLeg(elapsed, modeConfig);
    const target = randomDriftOffset(center, field, rangePx);

    Animated.timing(potDriftAnim, {
      toValue: target,
      duration: legMs,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        wanderPotStep();
      }
    });
  };

  const startPotDrift = () => {
    if (driftActiveRef.current) {
      return;
    }
    driftActiveRef.current = true;
    wanderPotStep();
  };

  const stopPotDrift = () => {
    driftActiveRef.current = false;
    potDriftAnim.stopAnimation();
    Animated.timing(potDriftAnim, { toValue: { x: 0, y: 0 }, duration: 220, useNativeDriver: true }).start();
  };

  useEffect(() => {
    if (modeConfig.potDriftEnabled && potVisible && words.length > 0) {
      startPotDrift();
    } else {
      stopPotDrift();
    }

    return () => stopPotDrift();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeConfig.potDriftEnabled, potVisible, words.length]);

  // Discrete "jump" to a new spot (new round, caught a letter, or reappearing after a reject).
  // Any in-progress wander offset is zeroed instantly so it doesn't stack on top of the fresh spot,
  // and the escalation clock restarts — a fresh pot starts at the mode's base drift speed again.
  const placePotAt = (center: Point) => {
    potDriftAnim.setValue({ x: 0, y: 0 });
    potPlacedAtRef.current = Date.now();
    setPotCenter(center);
  };

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
    }, modeConfig.bannerDurationMs);
  };

  useEffect(() => {
    return () => {
      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current);
      }
      speechService.stop();
      characterAudioService.stopAll();
    };
  }, []);

  const handleMegaphonePress = () => {
    if (currentWord) {
      speechService.speakWord(currentWord);
    }
  };

  const handleHintPress = () => {
    if (currentWord && modeConfig.hintAllowed) {
      revealWord(currentWord);
    }
  };

  useEffect(() => {
    if (words.length === 0) {
      return;
    }
    setCurrentWord(words[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedList?.id]);

  useEffect(() => {
    if (!currentWord || words.length === 0) {
      return;
    }

    const bundle = buildLetterBundle(currentWord, modeConfig.decoyLetterCount);
    setAvailableLetters(bundle);
    setRoundLetterCount(bundle.length);
    setGuess('');
    setActiveLetter(null);
    setActiveIndex(null);
    setFeedback('Flick a letter at the honey pot!');
    revealWord(currentWord);

    if (fieldBounds) {
      setPotVisible(true);
      setPotBlink(false);
      placePotAt(randomPotPosition(fieldBounds));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWord, setCurrentWord]);

  useEffect(() => {
    if (fieldBounds && !potCenter) {
      placePotAt(randomPotPosition(fieldBounds));
    }
  }, [fieldBounds, potCenter]);

  // The field's height depends on the round's tray, so a new word can resize it after the pot was
  // placed; re-place the pot whenever the field's size changes so it never sits outside it.
  const fieldSize = fieldBounds ? `${Math.round(fieldBounds.width)}x${Math.round(fieldBounds.height)}` : null;
  useEffect(() => {
    if (fieldBounds && potCenterRef.current) {
      placePotAt(randomPotPosition(fieldBounds));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldSize]);

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

  const triggerCelebration = () => {
    setCelebrating(true);
    // The full-screen confetti overlay below is the "big" reward moment — Mama Bear and the
    // villain hold their Celebrating/Defeated reaction in the persistent character row for the
    // same duration rather than joining the overlay itself, so the two don't compete for the
    // child's attention at once.
    mamaBear.trigger('Celebrating', CELEBRATION_TOTAL_MS);
    villain.trigger('Defeated', CELEBRATION_TOTAL_MS);

    celebrationOpacity.setValue(0);
    celebrationScale.setValue(0.5);
    confettiProgress.setValue(0);

    // Epic 11: a pre-recorded praise clip (Mama Bear's actual voice) takes priority over the
    // generic TTS phrase when one is registered, so the two don't talk over each other — the TTS
    // phrase (and its on-card caption) is the fallback for when no clip exists, which is every
    // character today, so this is currently always the TTS path below.
    const playedPraiseClip = characterAudioService.playCharacterLine('mama-bear', 'praise');
    setCelebrationPhrase(playedPraiseClip ? '' : speechService.speakPraise());
    if (villainId) {
      characterAudioService.playCharacterLine(villainId, 'defeated');
    }

    Animated.parallel([
      Animated.timing(confettiProgress, {
        toValue: 1,
        duration: CELEBRATION_BURST_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.spring(celebrationScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]),
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

  const relocatePot = () => {
    if (fieldBounds) {
      placePotAt(randomPotPosition(fieldBounds));
    }
  };

  const rejectPot = () => {
    resolvingRef.current = true;
    // Both miss branches in resolveFlick (off-target flick, wrong letter) route through here, so
    // the villain's taunt reaction is wired once, at the shared handler, rather than duplicated.
    villain.trigger('Challenging');
    // Epic 11: a low-risk extension beyond the roadmap task's two mandatory hookups (Celebrating ->
    // praise, Defeated -> defeated) — Challenging is the natural taunt moment, and no TTS is tied
    // to this event today, so there's no coexistence question here.
    if (villainId) {
      characterAudioService.playCharacterLine(villainId, 'taunt');
    }
    // A steal attempt only ever opens off a child mistake (25.11.3) — this is that hook. No-ops
    // below Taunting tier (openStealAttempt itself no-ops when stealTuning is null).
    openStealAttempt();
    let blinks = 0;
    const blinkTimer = setInterval(() => {
      setPotBlink((value) => !value);
      blinks += 1;

      if (blinks >= BLINK_COUNT) {
        clearInterval(blinkTimer);
        setPotVisible(false);
        setPotBlink(false);

        setTimeout(() => {
          relocatePot();
          setPotVisible(true);
          resolvingRef.current = false;
        }, 300);
      }
    }, BLINK_INTERVAL_MS);
  };

  const resolveFlick = (letter: string, index: number, hit: boolean) => {
    if (!currentWord) {
      return;
    }

    if (!hit) {
      setFeedback('Off target! The honey pot wobbles away...');
      rejectPot();
      return;
    }

    const expectedLetter = currentWord[guess.length]?.toLowerCase();

    if (letter.toLowerCase() !== expectedLetter) {
      setFeedback(`Oops! ${letter.toUpperCase()} is not the next letter.`);
      recordMissedFlick(currentWord);
      rejectPot();
      return;
    }

    const nextGuess = guess + letter;
    setGuess(nextGuess);
    setAvailableLetters((letters) => letters.filter((_, letterIndex) => letterIndex !== index));
    setFeedback('Nice throw! The honey pot caught the letter.');
    incrementScore();
    recordCorrectFlick();
    mamaBear.trigger('Talking');
    // The primary defense (25.11.3): landing the next correct flick shoos an open steal attempt,
    // regardless of whether this flick also completes the word.
    handleStealDefended();

    if (nextGuess.length === currentWord.length) {
      triggerCelebration();
      setFeedback('Perfect! The whole word is spelled.');
      recordWordCompleted(currentWord);
      earnHoneyPot();
      // Independent of the two calls above (progress mastery / session honeyStash) — architecture
      // 27.6/27.7's daily-streak-and-sticker signal, kept in its own store. Bee Line's own
      // word-completion handoff (a separate, not-yet-built epic) should add this identical call
      // once it exists, so both games feed the same signal with no per-game branching.
      recordCompletedPlay(Date.now());
      setTimeout(() => {
        setCurrentWord(getNextWord(words, currentWord));
      }, NEXT_WORD_DELAY_MS);
      return;
    }

    relocatePot();
  };

  const handleFlickBegin = (letter: string, index: number, absoluteX: number, absoluteY: number) => {
    if (resolvingRef.current) {
      return;
    }

    setActiveLetter(letter);
    setActiveIndex(index);
    ghostAnim.setValue(toContainerRelative({ x: absoluteX, y: absoluteY }, containerBounds));
  };

  const handleFlickUpdate = (absoluteX: number, absoluteY: number) => {
    if (resolvingRef.current) {
      return;
    }

    ghostAnim.setValue(toContainerRelative({ x: absoluteX, y: absoluteY }, containerBounds));
  };

  const handleFlickEnd = (
    letter: string,
    index: number,
    absoluteX: number,
    absoluteY: number,
    velocityX: number,
    velocityY: number,
  ) => {
    if (resolvingRef.current) {
      setActiveLetter(null);
      setActiveIndex(null);
      return;
    }

    const releasePoint = toContainerRelative({ x: absoluteX, y: absoluteY }, containerBounds);
    const throwEnd = computeThrow(releasePoint, { x: velocityX, y: velocityY });

    if (!throwEnd) {
      setFeedback('Flick harder to send the letter flying!');
      setActiveLetter(null);
      setActiveIndex(null);
      return;
    }

    if (!potCenter) {
      setActiveLetter(null);
      setActiveIndex(null);
      return;
    }

    // The pot may be slowly wandering (Crazy mode) — hit-test against where it actually is
    // right now, not its last discrete "jump" position, so aim stays fair and honest.
    const effectivePotCenter = {
      x: potCenter.x + potDriftOffsetRef.current.x,
      y: potCenter.y + potDriftOffsetRef.current.y,
    };
    const hit = isFlickOnTarget(effectivePotCenter, releasePoint, throwEnd);
    resolvingRef.current = true;

    Animated.timing(ghostAnim, {
      toValue: throwEnd,
      duration: THROW_DURATION_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      resolveFlick(letter, index, hit);
      setActiveLetter(null);
      setActiveIndex(null);
      resolvingRef.current = false;
    });
  };

  const handleReset = () => {
    resetScore();
    resetHoneyStash();
    if (words.length > 0) {
      setCurrentWord(words[0]);
    }
  };

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

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const currentWordLength = currentWord?.length ?? 0;
  const layout = getFlickLayout({
    screenWidth,
    screenHeight,
    horizontalPadding: theme.spacing.md,
    letterCount: roundLetterCount || currentWordLength,
    wordLength: currentWordLength,
  });
  const showControls = !showBanner && !celebrating;

  return (
    <View
      ref={containerRef}
      style={[
        styles.container,
        { paddingTop: insets.top + theme.spacing.xs, paddingBottom: insets.bottom + theme.spacing.xs },
      ]}
      onLayout={() => {
        containerRef.current?.measureInWindow((x, y, width, height) => {
          setContainerBounds({ x, y, width, height });
        });
      }}
    >
      <View style={styles.topBar}>
        <Pressable
          testID="back-button"
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.topBarButton}
          onPress={handleGoHome}
        >
          <Text style={styles.topBarButtonText}>← Back</Text>
        </Pressable>
        <Pressable
          testID="reset-button"
          accessibilityRole="button"
          accessibilityLabel="Reset game"
          style={styles.topBarButton}
          onPress={handleReset}
        >
          <Text style={styles.topBarButtonText}>↻ Reset</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Word Lists"
          style={styles.topBarButton}
          onPress={() => router.replace('/lists')}
        >
          <Text style={styles.topBarButtonText}>📚</Text>
        </Pressable>
        {!layout.compact ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Exit" style={styles.exitButton} onPress={handleExitApp}>
            <Text style={styles.exitButtonText}>Exit</Text>
          </Pressable>
        ) : null}
      </View>

      <Text testID="info-line" style={styles.infoLine} numberOfLines={1}>
        Honey Pot Flick · {modeConfig.label}
        {selectedList ? ` · ${selectedList.name}` : ''}
      </Text>

      {words.length > 0 ? (
        <View style={styles.headerRow}>
          <GestureDetector gesture={mamaBearTap}>
            <View>
              <Character characterId="mama-bear" size={layout.characterSize} animationState={mamaBear.animationState} />
            </View>
          </GestureDetector>

          <View style={styles.headerCenter}>
            <Text style={styles.score}>Score {score}</Text>
            <View testID="honey-larder" style={styles.honeyLarderRow}>
              <Text style={styles.honeyLarderLabel}>Honey saved</Text>
              <Animated.View
                style={[
                  styles.honeyLarderPots,
                  stealAttempt.status === 'Telegraphing' && styles.honeyLarderPotsInJeopardy,
                  {
                    transform: [
                      { scale: villainLungeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
                    ],
                  },
                ]}
              >
                {Array.from({ length: Math.min(honeyStash, HONEY_LARDER_DISPLAY_CAP) }).map((_, index) => (
                  <Text key={index} style={styles.honeyLarderPotEmoji}>
                    🍯
                  </Text>
                ))}
                {honeyStash > HONEY_LARDER_DISPLAY_CAP ? (
                  <Text style={styles.honeyLarderOverflow}>+{honeyStash - HONEY_LARDER_DISPLAY_CAP}</Text>
                ) : null}
              </Animated.View>
            </View>
          </View>

          {villainId ? (
            <GestureDetector gesture={villainTap}>
              <Animated.View
                style={{
                  transform: [
                    { translateY: villainLungeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 14] }) },
                    { scale: villainLungeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
                  ],
                }}
              >
                <Character characterId={villainId} size={layout.characterSize} animationState={villain.animationState} />
              </Animated.View>
            </GestureDetector>
          ) : (
            <View style={{ width: layout.characterSize }} />
          )}
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
          <View testID="prompt-card" style={styles.targetCard}>
            <View style={styles.targetHeader}>
              <Text style={styles.targetLabel}>Listen and spell it!</Text>
              <Text style={styles.targetPrompt}>🎯 🍯 🐝</Text>
            </View>

            <View style={styles.answerRow}>
              {guess.split('').map((letter, index) => (
                <View
                  key={`${letter}-${index}`}
                  style={[styles.answerTile, { width: layout.answerTileSize, height: layout.answerTileSize }]}
                >
                  <Text style={[styles.answerTileText, { fontSize: Math.round(layout.answerTileSize * 0.45) }]}>
                    {letter.toUpperCase()}
                  </Text>
                </View>
              ))}
              {guess.length < currentWordLength && (
                <View style={[styles.answerSlot, { width: layout.answerTileSize, height: layout.answerTileSize }]}>
                  <Text style={[styles.answerSlotText, { fontSize: Math.round(layout.answerTileSize * 0.45) }]}>?</Text>
                </View>
              )}
            </View>
          </View>

          <View ref={fieldRef} testID="flick-field" style={styles.field} onLayout={measureField}>
            {potVisible && potCenter && fieldBounds ? (
              <Animated.View
                testID="honey-pot"
                style={[
                  styles.pot,
                  potBlink && styles.potBlinkOn,
                  {
                    left: potCenter.x - fieldBounds.x - POT_SIZE / 2,
                    top: potCenter.y - fieldBounds.y - POT_SIZE / 2,
                    transform: potDriftAnim.getTranslateTransform(),
                  },
                ]}
              >
                <Text style={styles.potEmoji}>🍯</Text>
              </Animated.View>
            ) : null}
          </View>

          <View testID="letter-tray" style={styles.tileGrid}>
            {availableLetters.map((letter, index) => {
              const pan = Gesture.Pan()
                .runOnJS(true)
                .onStart((event) => handleFlickBegin(letter, index, event.absoluteX, event.absoluteY))
                .onUpdate((event) => handleFlickUpdate(event.absoluteX, event.absoluteY))
                .onFinalize((event) =>
                  handleFlickEnd(letter, index, event.absoluteX, event.absoluteY, event.velocityX, event.velocityY),
                );

              // The tile being flicked stays mounted (never swapped for a different element) so the
              // native gesture recognizer isn't torn down mid-gesture. It's just hidden visually.
              return (
                <GestureDetector key={`${letter}-${index}`} gesture={pan}>
                  <View
                    testID="letter-tile"
                    style={[
                      styles.tileButton,
                      {
                        width: layout.tray.tileSize,
                        height: layout.tray.tileSize,
                        borderRadius: Math.round(layout.tray.tileSize * 0.3),
                      },
                      activeIndex === index && styles.tileButtonHidden,
                    ]}
                  >
                    <Text style={[styles.tileButtonText, { fontSize: Math.round(layout.tray.tileSize * 0.4) }]}>
                      {letter.toUpperCase()}
                    </Text>
                  </View>
                </GestureDetector>
              );
            })}
          </View>

          {activeLetter ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.dragGhost,
                {
                  transform: [
                    { translateX: Animated.subtract(ghostAnim.x, GHOST_HALF) },
                    { translateY: Animated.subtract(ghostAnim.y, GHOST_HALF) },
                  ],
                },
              ]}
            >
              <Text style={styles.dragGhostText}>{activeLetter.toUpperCase()}</Text>
            </Animated.View>
          ) : null}

          <View style={styles.bottomBar}>
            <Text
              testID="flick-feedback"
              numberOfLines={2}
              style={[
                styles.feedback,
                feedback.includes('Oops') || feedback.includes('Off target') || feedback.includes('harder')
                  ? styles.feedbackError
                  : styles.feedbackSuccess,
              ]}
            >
              {feedback}
            </Text>

            {modeConfig.hintAllowed ? (
              <Pressable
                testID="hint-button"
                accessibilityRole="button"
                accessibilityLabel="Show the word again"
                disabled={!showControls}
                style={[styles.cornerButton, !showControls && styles.controlHidden]}
                onPress={handleHintPress}
              >
                <Text style={styles.cornerButtonEmoji}>💡</Text>
              </Pressable>
            ) : null}
            <Pressable
              testID="megaphone-button"
              accessibilityRole="button"
              accessibilityLabel="Say the word"
              disabled={!showControls}
              style={[styles.cornerButton, !showControls && styles.controlHidden]}
              onPress={handleMegaphonePress}
            >
              <Text style={styles.cornerButtonEmoji}>📣</Text>
            </Pressable>
          </View>
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
            style={[
              styles.bannerCard,
              { opacity: bannerOpacity, transform: [{ scale: bannerScale }] },
            ]}
          >
            <Text style={styles.bannerFlourish}>🎉 ✨ 🍯 ✨ 🎉</Text>
            <Text
              testID="target-word"
              style={[styles.bannerWord, { fontSize: getBannerFontSize(screenWidth, currentWordLength) }]}
            >{currentWord.toUpperCase()}</Text>
            <Text style={styles.bannerSubtext}>Listen closely and remember it!</Text>
          </Animated.View>
        </View>
      ) : null}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  topBarButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 3,
    borderColor: '#111111',
  },
  topBarButtonText: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  infoLine: {
    marginTop: 2,
    color: theme.colors.muted,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 12,
  },
  headerRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  honeyLarderRow: {
    alignItems: 'center',
  },
  honeyLarderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  honeyLarderPots: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 26,
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: 999,
  },
  honeyLarderPotsInJeopardy: {
    backgroundColor: 'rgba(255, 99, 71, 0.25)',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  honeyLarderPotEmoji: {
    fontSize: 16,
    marginHorizontal: 1,
  },
  honeyLarderOverflow: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.muted,
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
  score: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.text,
    textAlign: 'center',
    textShadowColor: '#111111',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  targetCard: {
    marginTop: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#111111',
  },
  targetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  targetLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  targetPrompt: {
    fontSize: 20,
  },
  answerRow: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  answerTile: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: '#111111',
  },
  answerTileText: {
    fontWeight: '700',
    color: theme.colors.surface,
  },
  answerSlot: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D4A41C',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  answerSlotText: {
    color: theme.colors.muted,
  },
  field: {
    flex: 1,
    minHeight: 110,
    marginTop: theme.spacing.xs,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 560,
    borderRadius: 24,
    backgroundColor: '#F5D998',
    borderWidth: 4,
    borderColor: '#111111',
    overflow: 'hidden',
  },
  pot: {
    position: 'absolute',
    width: POT_SIZE,
    height: POT_SIZE,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.gold,
    borderWidth: 4,
    borderColor: '#111111',
  },
  potBlinkOn: {
    borderColor: theme.colors.text,
    backgroundColor: theme.colors.primary,
  },
  potEmoji: {
    fontSize: 34,
  },
  tileGrid: {
    marginTop: theme.spacing.xs,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: FLICK_TILE_GAP,
  },
  tileButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
    borderWidth: 3,
    borderColor: '#111111',
    shadowColor: '#111111',
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 2,
  },
  tileButtonHidden: {
    opacity: 0,
  },
  tileButtonText: {
    fontWeight: '700',
    color: theme.colors.surface,
  },
  dragGhost: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
    borderWidth: 4,
    borderColor: '#111111',
  },
  dragGhostText: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.text,
  },
  bottomBar: {
    marginTop: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  feedback: {
    flex: 1,
    fontSize: 13,
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
  cornerButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 3,
    borderColor: '#111111',
    shadowColor: '#111111',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
  },
  cornerButtonEmoji: {
    fontSize: 20,
  },
  controlHidden: {
    opacity: 0,
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
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    maxWidth: '92%',
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
    minHeight: 44,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
    borderWidth: 3,
    borderColor: '#111111',
  },
  exitButtonText: {
    color: theme.colors.surface,
    fontWeight: '700',
  },
});
