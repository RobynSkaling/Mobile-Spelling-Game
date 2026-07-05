import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { theme } from '@/shared/lib/theme';
import { useSessionStore } from '@/stores/session-store';
import { useProfileStore } from '@/stores/profile-store';

const WORDS = ['apple', 'sun', 'tree', 'happy'];

function shuffleLetters(word: string) {
  const letters = word.split('');
  const copy = [...letters];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export function PlayScreen() {
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState('Tap the honey tiles to build the word.');
  const [celebrating, setCelebrating] = useState(false);
  const rewardScale = useRef(new Animated.Value(0.8)).current;

  const { currentWord, setCurrentWord, incrementScore, resetScore, score } = useSessionStore();
  const { profile } = useProfileStore();

  useEffect(() => {
    if (!currentWord) {
      setCurrentWord(WORDS[0]);
      return;
    }

    setAvailableLetters(shuffleLetters(currentWord));
    setGuess('');
    setFeedback('Tap the honey tiles to build the word.');
  }, [currentWord, setCurrentWord]);

  const triggerCelebration = () => {
    setCelebrating(true);
    Animated.sequence([
      Animated.timing(rewardScale, { toValue: 1.2, duration: 180, useNativeDriver: true }),
      Animated.timing(rewardScale, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setCelebrating(false);
      rewardScale.setValue(0.8);
    });
  };

  const handleLetterPress = (letter: string, index: number) => {
    if (!currentWord) {
      return;
    }

    if (guess.length >= currentWord.length) {
      return;
    }

    const nextGuess = guess + letter;

    if (!currentWord.startsWith(nextGuess)) {
      setFeedback('Oops! That letter does not fit. Try again.');
      setGuess('');
      setAvailableLetters(shuffleLetters(currentWord));
      return;
    }

    const nextAvailable = [...availableLetters];
    nextAvailable.splice(index, 1);
    setAvailableLetters(nextAvailable);
    setGuess(nextGuess);

    if (nextGuess.length === currentWord.length) {
      if (nextGuess === currentWord) {
        incrementScore();
        setFeedback('Perfect! You filled the honey pot.');
        triggerCelebration();

        setTimeout(() => {
          const nextIndex = (WORDS.indexOf(currentWord) + 1) % WORDS.length;
          setCurrentWord(WORDS[nextIndex]);
        }, 700);
      } else {
        setFeedback('Almost! The word needs one more check.');
        setTimeout(() => {
          setGuess('');
          setAvailableLetters(shuffleLetters(currentWord));
          setFeedback('Tap the honey tiles to build the word.');
        }, 700);
      }
      return;
    }

    setFeedback('Nice! Keep going.');
  };

  const handleReset = () => {
    resetScore();
    setCurrentWord(WORDS[0]);
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
    <View style={styles.container}>
      <Text style={styles.title}>Honey Pot Flick</Text>
      <Text style={styles.greeting}>
        {profile ? `Hi ${profile.name}! Mama Bear is cheering for you.` : 'Mama Bear is cheering for you.'}
      </Text>
      <Text style={styles.score}>Score: {score}</Text>

      <View style={styles.targetCard}>
        <Text style={styles.targetLabel}>Target word</Text>
        <Text style={styles.word}>{currentWord?.toUpperCase() ?? '...'}</Text>
      </View>

      <View style={styles.potArea}>
        <Text style={styles.potLabel}>Honey Pot</Text>
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
      </View>

      <View style={styles.tileGrid}>
        {availableLetters.map((letter, index) => (
          <Pressable key={`${letter}-${index}`} style={styles.tileButton} onPress={() => handleLetterPress(letter, index)}>
            <Text style={styles.tileButtonText}>{letter.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.feedback, feedback.includes('Oops') ? styles.feedbackError : styles.feedbackSuccess]}>
        {feedback}
      </Text>

      {celebrating ? (
        <Animated.View style={[styles.rewardBadge, { transform: [{ scale: rewardScale }] }]}>
          <Text style={styles.rewardText}>🍯</Text>
        </Animated.View>
      ) : null}

      <View style={styles.actionsRow}>
        <Pressable style={styles.secondaryButton} onPress={handleReset}>
          <Text style={styles.secondaryButtonText}>Reset game</Text>
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
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  greeting: {
    marginTop: theme.spacing.sm,
    color: theme.colors.muted,
    textAlign: 'center',
  },
  score: {
    marginTop: theme.spacing.sm,
    color: theme.colors.secondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  targetCard: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#111111',
  },
  targetLabel: {
    fontSize: 13,
    color: theme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  word: {
    marginTop: theme.spacing.xs,
    fontSize: 34,
    fontWeight: '700',
    color: theme.colors.text,
  },
  potArea: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: 20,
    backgroundColor: '#FFE082',
    borderWidth: 4,
    borderColor: '#111111',
  },
  potLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  answerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    borderWidth: 1,
    borderColor: '#D4A41C',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  answerSlotText: {
    fontSize: 18,
    color: theme.colors.muted,
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
  tileButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.surface,
  },
  feedback: {
    marginTop: theme.spacing.lg,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
  },
  feedbackSuccess: {
    color: theme.colors.secondary,
  },
  feedbackError: {
    color: theme.colors.accent,
  },
  rewardBadge: {
    position: 'absolute',
    bottom: 90,
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
    fontWeight: '600',
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
    fontWeight: '600',
  },
});
