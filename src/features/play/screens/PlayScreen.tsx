import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import { theme } from '@/shared/lib/theme';
import { useSessionStore } from '@/stores/session-store';
import { useProfileStore } from '@/stores/profile-store';
import { useWordListStore } from '@/stores/word-list-store';
import { useGameModeStore } from '@/stores/game-mode-store';
import { GAME_MODE_CONFIG } from '@/features/play/logic/game-modes';
import {
  Bounds,
  Point,
  POT_SIZE,
  buildLetterBundle,
  computeThrow,
  getNextWord,
  isFlickOnTarget,
  randomDriftOffset,
  randomPotPosition,
  toContainerRelative,
} from '@/features/play/logic/honey-pot-flick';

const GHOST_HALF = 28;
const THROW_DURATION_MS = 260;
const BLINK_INTERVAL_MS = 110;
const BLINK_COUNT = 6;

function speakWord(word: string) {
  try {
    Speech.stop();
    Speech.speak(word, { rate: 0.85, pitch: 1.1 });
  } catch {
    // Speech synthesis isn't available on every platform/environment.
    // The visual banner still communicates the word, so this fails silently.
  }
}

export function PlayScreen() {
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState('Flick a letter at the honey pot!');
  const [celebrating, setCelebrating] = useState(false);

  const [containerBounds, setContainerBounds] = useState<Bounds | null>(null);
  const [fieldBounds, setFieldBounds] = useState<Bounds | null>(null);
  const [potCenter, setPotCenter] = useState<Point | null>(null);
  const [potVisible, setPotVisible] = useState(true);
  const [potBlink, setPotBlink] = useState(false);

  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  const rewardScale = useRef(new Animated.Value(0.8)).current;
  const ghostAnim = useRef(new Animated.ValueXY()).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const bannerScale = useRef(new Animated.Value(0.6)).current;
  const potDriftAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<View | null>(null);
  const fieldRef = useRef<View | null>(null);
  const resolvingRef = useRef(false);
  const fieldBoundsRef = useRef<Bounds | null>(null);
  const potCenterRef = useRef<Point | null>(null);
  const potDriftOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const driftActiveRef = useRef(false);

  const { currentWord, setCurrentWord, incrementScore, resetScore, score } = useSessionStore();
  const { profile } = useProfileStore();
  const selectedList = useWordListStore((state) => state.getSelectedList());
  const words = useMemo(() => selectedList?.words ?? [], [selectedList]);
  const gameMode = useGameModeStore((state) => state.mode);
  const modeConfig = GAME_MODE_CONFIG[gameMode];

  useEffect(() => {
    fieldBoundsRef.current = fieldBounds;
  }, [fieldBounds]);

  useEffect(() => {
    potCenterRef.current = potCenter;
  }, [potCenter]);

  useEffect(() => {
    const id = potDriftAnim.addListener((value) => {
      potDriftOffsetRef.current = value;
    });
    return () => potDriftAnim.removeListener(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const target = randomDriftOffset(center, field, modeConfig.potDriftRangePx);

    Animated.timing(potDriftAnim, {
      toValue: target,
      duration: modeConfig.potDriftLegMs,
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
  // Any in-progress wander offset is zeroed instantly so it doesn't stack on top of the fresh spot.
  const placePotAt = (center: Point) => {
    potDriftAnim.setValue({ x: 0, y: 0 });
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

    speakWord(word);

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
      Speech.stop();
    };
  }, []);

  const handleMegaphonePress = () => {
    if (currentWord) {
      speakWord(currentWord);
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

    setAvailableLetters(buildLetterBundle(currentWord, modeConfig.decoyLetterCount));
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
    Animated.sequence([
      Animated.timing(rewardScale, { toValue: 1.25, duration: 180, useNativeDriver: true }),
      Animated.timing(rewardScale, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setCelebrating(false);
      rewardScale.setValue(0.8);
    });
  };

  const relocatePot = () => {
    if (fieldBounds) {
      placePotAt(randomPotPosition(fieldBounds));
    }
  };

  const rejectPot = () => {
    resolvingRef.current = true;
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
      rejectPot();
      return;
    }

    const nextGuess = guess + letter;
    setGuess(nextGuess);
    setAvailableLetters((letters) => letters.filter((_, letterIndex) => letterIndex !== index));
    setFeedback('Nice throw! The honey pot caught the letter.');
    incrementScore();

    if (nextGuess.length === currentWord.length) {
      triggerCelebration();
      setFeedback('Perfect! The whole word is spelled.');
      setTimeout(() => {
        setCurrentWord(getNextWord(words, currentWord));
      }, 900);
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
      <Text style={styles.title}>Honey Pot Flick</Text>
      <Text style={styles.greeting}>
        {profile ? `Hi ${profile.name}! Mama Bear is cheering for you.` : 'Mama Bear is cheering for you.'}
      </Text>
      {selectedList ? <Text style={styles.listName}>List: {selectedList.name}</Text> : null}
      <Text style={styles.modeLine}>Mode: {modeConfig.label}</Text>
      <Text style={styles.score}>Score {score}</Text>

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
            <Text style={styles.targetLabel}>Listen and spell it!</Text>
            <Text style={styles.targetPrompt}>🎯 🍯 🐝</Text>
          </View>

          <View style={styles.answerRow}>
            {guess.split('').map((letter, index) => (
              <View key={`${letter}-${index}`} style={styles.answerTile}>
                <Text style={styles.answerTileText}>{letter.toUpperCase()}</Text>
              </View>
            ))}
            {guess.length < (currentWord?.length ?? 0) && (
              <View style={styles.answerSlot}>
                <Text style={styles.answerSlotText}>?</Text>
              </View>
            )}
          </View>

          <Text style={styles.fieldLabel}>Flick a letter into the honey pot</Text>
          <View ref={fieldRef} style={styles.field} onLayout={measureField}>
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

          <View style={styles.tileGrid}>
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
                  <View style={[styles.tileButton, activeIndex === index && styles.tileButtonHidden]}>
                    <Text style={styles.tileButtonText}>{letter.toUpperCase()}</Text>
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

          <Text
            testID="flick-feedback"
            style={[
              styles.feedback,
              feedback.includes('Oops') || feedback.includes('Off target') || feedback.includes('harder')
                ? styles.feedbackError
                : styles.feedbackSuccess,
            ]}
          >
            {feedback}
          </Text>

          {celebrating ? (
            <Animated.View style={[styles.rewardBadge, { transform: [{ scale: rewardScale }] }]}>
              <Text style={styles.rewardText}>🍯</Text>
            </Animated.View>
          ) : null}

          {!showBanner ? (
            <View style={styles.cornerButtons}>
              {modeConfig.hintAllowed ? (
                <Pressable testID="hint-button" style={styles.cornerButton} onPress={handleHintPress}>
                  <Text style={styles.cornerButtonEmoji}>💡</Text>
                </Pressable>
              ) : null}
              <Pressable testID="megaphone-button" style={styles.cornerButton} onPress={handleMegaphonePress}>
                <Text style={styles.cornerButtonEmoji}>📣</Text>
              </Pressable>
            </View>
          ) : null}
        </>
      )}

      {showBanner && currentWord ? (
        <View style={styles.bannerOverlay} pointerEvents="auto">
          <Animated.View
            style={[
              styles.bannerCard,
              { opacity: bannerOpacity, transform: [{ scale: bannerScale }] },
            ]}
          >
            <Text style={styles.bannerFlourish}>🎉 ✨ 🍯 ✨ 🎉</Text>
            <Text testID="target-word" style={styles.bannerWord}>{currentWord.toUpperCase()}</Text>
            <Text style={styles.bannerSubtext}>Listen closely and remember it!</Text>
          </Animated.View>
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <Pressable style={styles.secondaryButton} onPress={handleReset}>
          <Text style={styles.secondaryButtonText}>Reset game</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.replace('/lists')}>
          <Text style={styles.secondaryButtonText}>📚 Word Lists</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={handleGoHome}>
          <Text style={styles.secondaryButtonText}>Back home</Text>
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
    marginTop: theme.spacing.sm,
    fontSize: 32,
    fontWeight: '900',
    color: theme.colors.text,
    textAlign: 'center',
    textShadowColor: '#111111',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
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
  answerRow: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    minHeight: 48,
    alignItems: 'center',
  },
  answerTile: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    borderWidth: 3,
    borderColor: '#111111',
  },
  answerTileText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.surface,
  },
  answerSlot: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.xs,
    borderWidth: 3,
    borderColor: '#D4A41C',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  answerSlotText: {
    fontSize: 18,
    color: theme.colors.muted,
  },
  fieldLabel: {
    marginTop: theme.spacing.lg,
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  field: {
    marginTop: theme.spacing.sm,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 320,
    aspectRatio: 1,
    borderRadius: 24,
    backgroundColor: '#FFE082',
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
    backgroundColor: '#FFD43B',
    borderWidth: 4,
    borderColor: '#111111',
  },
  potBlinkOn: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FF8C42',
  },
  potEmoji: {
    fontSize: 34,
  },
  tileGrid: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tileButton: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 6,
    backgroundColor: theme.colors.secondary,
    borderWidth: 4,
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
    fontSize: 22,
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
  feedback: {
    marginTop: theme.spacing.lg,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
  },
  feedbackSuccess: {
    color: theme.colors.secondary,
  },
  feedbackError: {
    color: theme.colors.accent,
  },
  rewardBadge: {
    position: 'absolute',
    bottom: 92,
    right: 24,
  },
  rewardText: {
    fontSize: 40,
  },
  cornerButtons: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.lg,
    gap: theme.spacing.xs,
    zIndex: 10,
  },
  cornerButton: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 3,
    borderColor: '#111111',
    shadowColor: '#111111',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
  },
  cornerButtonEmoji: {
    fontSize: 24,
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
    backgroundColor: '#FFE38A',
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
