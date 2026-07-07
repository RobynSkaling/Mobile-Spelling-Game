import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { theme } from '@/shared/lib/theme';
import { useSessionStore } from '@/stores/session-store';
import { useProfileStore } from '@/stores/profile-store';
import { useWordListStore } from '@/stores/word-list-store';
import {
  Bounds,
  Point,
  POT_SIZE,
  buildLetterBundle,
  computeThrow,
  getNextWord,
  isFlickOnTarget,
  randomPotPosition,
  toContainerRelative,
} from '@/features/play/logic/honey-pot-flick';

const GHOST_HALF = 28;
const THROW_DURATION_MS = 260;
const BLINK_INTERVAL_MS = 110;
const BLINK_COUNT = 6;

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

  const rewardScale = useRef(new Animated.Value(0.8)).current;
  const ghostAnim = useRef(new Animated.ValueXY()).current;
  const containerRef = useRef<View | null>(null);
  const fieldRef = useRef<View | null>(null);
  const resolvingRef = useRef(false);

  const { currentWord, setCurrentWord, incrementScore, resetScore, score } = useSessionStore();
  const { profile } = useProfileStore();
  const selectedList = useWordListStore((state) => state.getSelectedList());
  const words = useMemo(() => selectedList?.words ?? [], [selectedList]);

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

    setAvailableLetters(buildLetterBundle(currentWord));
    setGuess('');
    setActiveLetter(null);
    setActiveIndex(null);
    setFeedback('Flick a letter at the honey pot!');

    if (fieldBounds) {
      setPotVisible(true);
      setPotBlink(false);
      setPotCenter(randomPotPosition(fieldBounds));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWord, setCurrentWord]);

  useEffect(() => {
    if (fieldBounds && !potCenter) {
      setPotCenter(randomPotPosition(fieldBounds));
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
      setPotCenter(randomPotPosition(fieldBounds));
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

    const hit = isFlickOnTarget(potCenter, releasePoint, throwEnd);
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
      <Text style={styles.score}>Score {score}</Text>

      {words.length === 0 ? (
        <View style={styles.emptyListCard}>
          <Text style={styles.emptyListText}>This list doesn't have any words yet.</Text>
          <Pressable style={styles.secondaryButton} onPress={() => router.push('/lists')}>
            <Text style={styles.secondaryButtonText}>Add words or pick another list</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.targetCard}>
            <Text style={styles.targetLabel}>Spell this word</Text>
            <Text testID="target-word" style={styles.word}>{currentWord?.toUpperCase() ?? ''}</Text>
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
              <View
                testID="honey-pot"
                style={[
                  styles.pot,
                  potBlink && styles.potBlinkOn,
                  {
                    left: potCenter.x - fieldBounds.x - POT_SIZE / 2,
                    top: potCenter.y - fieldBounds.y - POT_SIZE / 2,
                  },
                ]}
              >
                <Text style={styles.potEmoji}>🍯</Text>
              </View>
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
        </>
      )}

      <View style={styles.actionsRow}>
        <Pressable style={styles.secondaryButton} onPress={handleReset}>
          <Text style={styles.secondaryButtonText}>Reset game</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.push('/lists')}>
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
  word: {
    marginTop: theme.spacing.xs,
    fontSize: 38,
    fontWeight: '900',
    color: theme.colors.text,
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
