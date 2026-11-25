import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { theme } from '@/shared/lib/theme';
import { AdultChallenge, getGateDestination, hasParentPin, makeAdultChallenge } from '@/stores/family-logic';
import { useFamilyStore } from '@/stores/family-store';
import { FamilyScreenFrame } from '../components/FamilyScreenFrame';
import { PinPad } from '../components/PinPad';

type Mode = 'enter' | 'create' | 'confirm' | 'challenge';

/**
 * The parent gate (Epic 30). Every parent-only area routes through here: enter the PIN to continue
 * to `next`. A family migrated from the old single profile has no PIN yet, so the gate asks the
 * parent to create one first. "Forgot PIN?" lets an adult reset it by answering a multi-step sum —
 * a speed bump for children, not a security boundary (product-accepted). No child data is touched.
 */
export function ParentGateScreen() {
  const params = useLocalSearchParams<{ next?: string }>();
  const next = getGateDestination(params.next);
  const parent = useFamilyStore((state) => state.parent);
  const unlockParentArea = useFamilyStore((state) => state.unlockParentArea);
  const setParentPin = useFamilyStore((state) => state.setParentPin);

  const [mode, setMode] = useState<Mode>(hasParentPin(parent) ? 'enter' : 'create');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<AdultChallenge>(() => makeAdultChallenge());
  const [answer, setAnswer] = useState('');

  const proceed = () => router.replace(next);

  const startReset = () => {
    setChallenge(makeAdultChallenge());
    setAnswer('');
    setError(null);
    setMode('challenge');
  };

  return (
    <FamilyScreenFrame onBack={() => router.replace('/home')}>
      <View style={styles.card}>
        {mode === 'enter' ? (
          <>
            <PinPad
              testID="gate-enter-pin"
              title="Grown-ups only"
              subtitle="Enter the parent PIN to continue."
              error={error}
              onComplete={(pin) => {
                if (unlockParentArea(pin)) {
                  proceed();
                } else {
                  setError("That's not the right PIN. Try again.");
                }
              }}
            />
            <Pressable accessibilityRole="button" testID="forgot-pin" onPress={startReset} style={styles.linkButton}>
              <Text style={styles.linkText}>Forgot PIN?</Text>
            </Pressable>
          </>
        ) : mode === 'create' || mode === 'confirm' ? (
          <PinPad
            key={mode}
            testID={mode === 'create' ? 'gate-create-pin' : 'gate-confirm-pin'}
            title={mode === 'create' ? 'Create a new parent PIN' : 'Enter the new PIN again'}
            subtitle={
              mode === 'create'
                ? hasParentPin(parent)
                  ? '4 numbers only you know.'
                  : 'Set a 4-number PIN to keep the grown-up area safe from little fingers.'
                : 'Just to make sure.'
            }
            error={error}
            onComplete={(pin) => {
              if (mode === 'create') {
                setFirstPin(pin);
                setError(null);
                setMode('confirm');
                return;
              }
              if (pin !== firstPin) {
                setError("Those PINs didn't match. Let's try again.");
                setMode('create');
                return;
              }
              setParentPin(pin);
              proceed();
            }}
          />
        ) : (
          <View style={styles.challenge}>
            <Text style={styles.title}>Reset the parent PIN</Text>
            <Text style={styles.subtitle}>To show you're a grown-up, what is:</Text>
            <Text testID="adult-challenge-question" style={styles.question}>
              {challenge.question} = ?
            </Text>
            <TextInput
              testID="adult-challenge-answer"
              value={answer}
              onChangeText={(text) => {
                setAnswer(text.replace(/[^0-9]/g, ''));
                setError(null);
              }}
              keyboardType="number-pad"
              placeholder="Answer"
              style={styles.input}
              maxLength={4}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.buttonRow}>
              <Pressable
                accessibilityRole="button"
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setError(null);
                  setMode('enter');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable
                testID="adult-challenge-submit"
                accessibilityRole="button"
                style={[styles.button, styles.submitButton]}
                onPress={() => {
                  if (Number(answer) === challenge.answer) {
                    setError(null);
                    setMode('create');
                  } else {
                    setError("That's not quite right. Here's a new one.");
                    setChallenge(makeAdultChallenge());
                    setAnswer('');
                  }
                }}
              >
                <Text style={[styles.buttonText, styles.submitText]}>Check</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </FamilyScreenFrame>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#111111',
    backgroundColor: theme.colors.surface,
  },
  linkButton: {
    minHeight: 44,
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  linkText: {
    fontWeight: '700',
    color: theme.colors.muted,
    textDecorationLine: 'underline',
  },
  challenge: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.muted,
    textAlign: 'center',
  },
  question: {
    marginTop: theme.spacing.md,
    fontSize: 28,
    fontWeight: '900',
    color: theme.colors.text,
  },
  // Fixed width: on web a text input otherwise takes the browser's default width and overflows
  // the card at 320pt.
  input: {
    marginTop: theme.spacing.md,
    width: 160,
    minHeight: 52,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    borderWidth: 3,
    borderColor: '#111111',
    borderRadius: 16,
    color: theme.colors.text,
  },
  error: {
    marginTop: theme.spacing.sm,
    fontWeight: '700',
    color: theme.colors.muted,
    textAlign: 'center',
  },
  buttonRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  button: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#111111',
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
  },
  submitButton: {
    backgroundColor: theme.colors.success,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
  },
  submitText: {
    color: theme.colors.surface,
  },
});
