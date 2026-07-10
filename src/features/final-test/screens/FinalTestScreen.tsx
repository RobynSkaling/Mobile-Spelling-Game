import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { theme } from '@/shared/lib/theme';
import { useProfileStore } from '@/stores/profile-store';
import { useWordListStore } from '@/stores/word-list-store';
import { useProgressStore } from '@/stores/progress-store';
import { speechService } from '@/shared/lib/speech';
import { Confetti } from '@/shared/ui/Confetti';
import { buildLetterBundle } from '@/features/play/logic/honey-pot-flick';
import { FINAL_TEST_MIN_WORDS, hasPassed, pickTestWords } from '@/features/final-test/logic/final-test';

type Phase = 'intro' | 'testing' | 'results';
type WordResult = { word: string; correct: boolean };

const WORD_FEEDBACK_HOLD_MS = 1800;
const CONFETTI_BURST_MS = 900;
const CONFETTI_VISIBLE_MS = 1800;

function formatToday(): string {
  return new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function FinalTestScreen() {
  const profile = useProfileStore((state) => state.profile);
  const selectedList = useWordListStore((state) => state.getSelectedList());
  const startSession = useProgressStore((state) => state.startSession);
  const recordWordCompleted = useProgressStore((state) => state.recordWordCompleted);
  const recordMissedFlick = useProgressStore((state) => state.recordMissedFlick);

  const [phase, setPhase] = useState<Phase>('intro');
  const [testWords, setTestWords] = useState<string[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [answer, setAnswer] = useState<string[]>([]);
  const [wordFeedback, setWordFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [results, setResults] = useState<WordResult[]>([]);
  const [celebrating, setCelebrating] = useState(false);

  const resultsScale = useRef(new Animated.Value(0.8)).current;
  const confettiProgress = useRef(new Animated.Value(0)).current;

  const currentTestWord = testWords[wordIndex] ?? null;
  const canStart = !!selectedList && selectedList.words.length >= FINAL_TEST_MIN_WORDS;

  const correctCount = useMemo(() => results.filter((result) => result.correct).length, [results]);
  const passed = useMemo(() => hasPassed(correctCount, results.length), [correctCount, results.length]);
  const missedWords = useMemo(() => results.filter((result) => !result.correct).map((result) => result.word), [results]);

  useEffect(() => {
    if (phase !== 'testing' || !currentTestWord) {
      return;
    }

    setAvailableLetters(buildLetterBundle(currentTestWord, 0));
    setAnswer([]);
    setWordFeedback(null);
    speechService.speakWord(currentTestWord);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, wordIndex]);

  useEffect(() => {
    if (phase !== 'results') {
      return;
    }

    resultsScale.setValue(0.8);
    Animated.spring(resultsScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();

    if (!passed) {
      // Guard against a stale `true` left over from a previous pass whose auto-hide timer
      // hadn't fired yet when the child hit "Try Again" (e.g. retried within ~2s of passing).
      setCelebrating(false);
      return;
    }

    setCelebrating(true);
    confettiProgress.setValue(0);
    speechService.speakPraise();
    Animated.timing(confettiProgress, {
      toValue: 1,
      duration: CONFETTI_BURST_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(() => setCelebrating(false), CONFETTI_VISIBLE_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, passed]);

  useEffect(() => {
    return () => speechService.stop();
  }, []);

  const startTest = () => {
    if (!selectedList || !canStart) {
      return;
    }

    setTestWords(pickTestWords(selectedList.words));
    setWordIndex(0);
    setResults([]);
    setPhase('testing');
    startSession();
  };

  const handleTapLetter = (letter: string, index: number) => {
    if (wordFeedback !== null) {
      return;
    }
    setAnswer((prev) => [...prev, letter]);
    setAvailableLetters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveLastLetter = () => {
    if (wordFeedback !== null || answer.length === 0) {
      return;
    }
    const last = answer[answer.length - 1];
    setAnswer((prev) => prev.slice(0, -1));
    setAvailableLetters((prev) => [...prev, last]);
  };

  const handleHearAgain = () => {
    if (currentTestWord) {
      speechService.speakWord(currentTestWord);
    }
  };

  const handleSubmit = () => {
    if (!currentTestWord || answer.length !== currentTestWord.length || wordFeedback !== null) {
      return;
    }

    const submitted = answer.join('').toLowerCase();
    const correct = submitted === currentTestWord.toLowerCase();
    setWordFeedback(correct ? 'correct' : 'incorrect');
    setResults((prev) => [...prev, { word: currentTestWord, correct }]);

    if (correct) {
      recordWordCompleted(currentTestWord);
    } else {
      recordMissedFlick(currentTestWord);
    }

    const isLastWord = wordIndex + 1 >= testWords.length;
    setTimeout(() => {
      if (isLastWord) {
        setPhase('results');
      } else {
        setWordIndex(wordIndex + 1);
      }
    }, WORD_FEEDBACK_HOLD_MS);
  };

  const handleTryAgain = () => {
    if (!selectedList) {
      return;
    }
    setTestWords(pickTestWords(selectedList.words));
    setWordIndex(0);
    setResults([]);
    setPhase('testing');
    startSession();
  };

  const handleGoHome = () => router.replace('/home');

  return (
    <View style={styles.container}>
      <Pressable testID="back-button" style={styles.backButton} onPress={handleGoHome}>
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>🎓 Final Spelling Test</Text>

        {phase === 'intro' ? (
          <View style={styles.introCard}>
            <Text style={styles.mamaBearLine}>
              Mama Bear says: "It's time to show what you know. Take a breath — you've got this."
            </Text>
            {selectedList ? <Text style={styles.introList}>List: {selectedList.name}</Text> : null}

            {canStart ? (
              <>
                <Text style={styles.introDetail}>
                  You'll hear {Math.min(selectedList!.words.length, 5)} words, one at a time. Listen carefully, then
                  spell each one. Get all but one right to pass.
                </Text>
                <Pressable testID="start-test-button" style={styles.primaryButton} onPress={startTest}>
                  <Text style={styles.primaryButtonText}>Start Test</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.introDetail}>
                  This list needs at least {FINAL_TEST_MIN_WORDS} words before you can take the test. Add more words
                  or pick a different list first.
                </Text>
                <Pressable style={styles.primaryButton} onPress={() => router.replace('/lists')}>
                  <Text style={styles.primaryButtonText}>📚 Word Lists</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : null}

        {phase === 'testing' && currentTestWord ? (
          <>
            <Text testID="test-progress" style={styles.progress}>
              Word {wordIndex + 1} of {testWords.length}
            </Text>

            <View style={styles.answerCard}>
              <Text style={styles.answerLabel}>Your spelling</Text>
              <View style={styles.answerRow}>
                {answer.length === 0 ? <Text style={styles.answerPlaceholder}>Tap letters below</Text> : null}
                {answer.map((letter, index) => (
                  <View key={`${letter}-${index}`} style={styles.answerTile}>
                    <Text style={styles.answerTileText}>{letter.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            </View>

            {wordFeedback ? (
              <View style={[styles.feedbackCard, wordFeedback === 'correct' ? styles.feedbackCorrect : styles.feedbackIncorrect]}>
                <Text testID="word-feedback" style={styles.feedbackText}>
                  {wordFeedback === 'correct' ? '✓ Correct!' : `✗ Not quite — it was "${currentTestWord}"`}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.tileGrid}>
                  {availableLetters.map((letter, index) => (
                    <Pressable
                      key={`${letter}-${index}`}
                      testID={`letter-tile-${letter}-${index}`}
                      style={styles.tileButton}
                      onPress={() => handleTapLetter(letter, index)}
                    >
                      <Text style={styles.tileButtonText}>{letter.toUpperCase()}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.testActionsRow}>
                  <Pressable
                    testID="remove-letter-button"
                    style={styles.secondaryButton}
                    onPress={handleRemoveLastLetter}
                    disabled={answer.length === 0}
                  >
                    <Text style={styles.secondaryButtonText}>⌫ Remove</Text>
                  </Pressable>
                  <Pressable testID="hear-again-button" style={styles.secondaryButton} onPress={handleHearAgain}>
                    <Text style={styles.secondaryButtonText}>🔊 Hear it again</Text>
                  </Pressable>
                </View>

                <Pressable
                  testID="submit-answer-button"
                  style={[styles.primaryButton, answer.length !== currentTestWord.length && styles.primaryButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={answer.length !== currentTestWord.length}
                >
                  <Text style={styles.primaryButtonText}>Submit</Text>
                </Pressable>
              </>
            )}
          </>
        ) : null}

        {phase === 'results' ? (
          <View>
            <Animated.View
              testID="results-card"
              style={[styles.resultsCard, passed ? styles.resultsCardPass : styles.resultsCardFail, { transform: [{ scale: resultsScale }] }]}
            >
              {passed ? (
                <>
                  <Text style={styles.resultsEmoji}>🏆</Text>
                  <Text testID="pass-fail-heading" style={styles.resultsHeading}>
                    Certificate of Spelling Achievement
                  </Text>
                  <Text style={styles.resultsName}>{profile ? profile.name : 'Great Speller'}</Text>
                  <Text style={styles.resultsSubtext}>passed the Final Spelling Test!</Text>
                  <Text style={styles.resultsScore}>
                    {correctCount} / {results.length} words correct
                  </Text>
                  <Text style={styles.resultsMeta}>
                    {selectedList?.name} · {formatToday()}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.resultsEmoji}>📖</Text>
                  <Text testID="pass-fail-heading" style={styles.resultsHeading}>
                    So Close!
                  </Text>
                  <Text style={styles.resultsScore}>
                    {correctCount} / {results.length} words correct
                  </Text>
                  <Text style={styles.resultsSubtext}>Let's practice these words and try again:</Text>
                  <View style={styles.missedWordsRow}>
                    {missedWords.map((word) => (
                      <View key={word} style={styles.missedWordChip}>
                        <Text style={styles.missedWordChipText}>{word}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </Animated.View>

            {celebrating ? <Confetti progress={confettiProgress} /> : null}

            <View style={styles.testActionsRow}>
              <Pressable style={styles.secondaryButton} onPress={handleTryAgain}>
                <Text style={styles.secondaryButtonText}>🔄 Try Again</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={handleGoHome}>
                <Text style={styles.secondaryButtonText}>🏠 Back Home</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl * 1.6,
    paddingBottom: theme.spacing.xl * 2,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  introCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#111111',
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  mamaBearLine: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: theme.spacing.md,
  },
  introList: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },
  introDetail: {
    fontSize: 14,
    color: theme.colors.muted,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  progress: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.muted,
    marginBottom: theme.spacing.md,
  },
  answerCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#111111',
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    minHeight: 96,
    justifyContent: 'center',
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  answerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  answerPlaceholder: {
    color: theme.colors.muted,
    fontSize: 14,
  },
  answerTile: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderWidth: 3,
    borderColor: '#111111',
  },
  answerTileText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.surface,
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    maxWidth: 360,
  },
  tileButton: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
    backgroundColor: theme.colors.secondary,
    borderWidth: 4,
    borderColor: '#111111',
  },
  tileButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.surface,
  },
  testActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  secondaryButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 999,
    backgroundColor: '#E4D4FF',
    borderWidth: 3,
    borderColor: '#111111',
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: '#111111',
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  feedbackCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#111111',
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  feedbackCorrect: {
    backgroundColor: '#FFD6EC',
  },
  feedbackIncorrect: {
    backgroundColor: '#FFD9CC',
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
  },
  resultsCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    borderWidth: 6,
    borderColor: '#111111',
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  resultsCardPass: {
    backgroundColor: theme.colors.gold,
  },
  resultsCardFail: {
    backgroundColor: theme.colors.surface,
  },
  resultsEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  resultsHeading: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  resultsName: {
    fontSize: 26,
    fontWeight: '900',
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  resultsSubtext: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  resultsScore: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  resultsMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.muted,
    marginTop: theme.spacing.sm,
  },
  missedWordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  missedWordChip: {
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 999,
    backgroundColor: '#FFD9CC',
    borderWidth: 2,
    borderColor: '#111111',
  },
  missedWordChipText: {
    fontWeight: '700',
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
});
