import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { theme } from '@/shared/lib/theme';
import { useSessionStore } from '@/stores/session-store';

const WORDS = ['apple', 'sun', 'tree', 'happy'];

export function PlayScreen() {
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState('Type the spelling.');
  const { currentWord, setCurrentWord, incrementScore, resetScore, score } = useSessionStore();

  useMemo(() => {
    if (!currentWord) {
      setCurrentWord(WORDS[0]);
    }
  }, [currentWord, setCurrentWord]);

  const handleSubmit = () => {
    if (!currentWord) {
      return;
    }

    if (guess.trim().toLowerCase() === currentWord) {
      setFeedback('You got it!');
      incrementScore();
      const nextIndex = (WORDS.indexOf(currentWord) + 1) % WORDS.length;
      setCurrentWord(WORDS[nextIndex]);
      setGuess('');
    } else {
      setFeedback('Try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spelling Time</Text>
      <Text style={styles.score}>Score: {score}</Text>
      <Text style={styles.prompt}>Spell this word:</Text>
      <Text style={styles.word}>{currentWord ?? '...'}</Text>

      <TextInput
        value={guess}
        onChangeText={setGuess}
        style={styles.input}
        placeholder="Type the word"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Pressable style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Check</Text>
      </Pressable>

      <Text style={styles.feedback}>{feedback}</Text>

      <Pressable style={styles.secondaryButton} onPress={() => resetScore()}>
        <Text style={styles.secondaryButtonText}>Reset score</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
  },
  score: {
    marginTop: theme.spacing.sm,
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  prompt: {
    marginTop: theme.spacing.lg,
    color: theme.colors.muted,
  },
  word: {
    fontSize: 36,
    fontWeight: '700',
    marginVertical: theme.spacing.md,
    color: theme.colors.text,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    borderRadius: 12,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  button: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 999,
  },
  buttonText: {
    color: theme.colors.surface,
    fontWeight: '600',
  },
  feedback: {
    marginTop: theme.spacing.md,
    color: theme.colors.accent,
  },
  secondaryButton: {
    marginTop: theme.spacing.sm,
  },
  secondaryButtonText: {
    color: theme.colors.muted,
  },
});
