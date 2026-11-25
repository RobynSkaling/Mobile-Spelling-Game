import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { theme } from '@/shared/lib/theme';
import { Character } from '@/shared/ui/Character';
import { hasParentPin } from '@/stores/family-logic';
import { useFamilyStore } from '@/stores/family-store';
import { ChildForm } from '../components/ChildForm';
import { FamilyScreenFrame } from '../components/FamilyScreenFrame';
import { PinPad } from '../components/PinPad';

type Step = 'create-pin' | 'confirm-pin' | 'add-child';

/**
 * First launch (Epic 30): the parent sets a 4-digit PIN (entered twice), then adds the first child.
 * If the app was closed after the PIN step, setup resumes at "add child" rather than asking for a
 * new PIN.
 */
export function ParentSetupScreen() {
  const parent = useFamilyStore((state) => state.parent);
  const childCount = useFamilyStore((state) => state.children.length);
  const setParentPin = useFamilyStore((state) => state.setParentPin);
  const addChild = useFamilyStore((state) => state.addChild);

  const [step, setStep] = useState<Step>(hasParentPin(parent) ? 'add-child' : 'create-pin');
  const [firstPin, setFirstPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Setup is only for a family with no children yet; anyone else lands here by mistake.
  if (childCount > 0) {
    return <Redirect href="/home" />;
  }

  return (
    <FamilyScreenFrame>
      <Character characterId="mama-bear" size="medium" style={styles.character} />
      <Text style={styles.heading}>Welcome to Mama Bear's Spelling Bee!</Text>
      <Text style={styles.stepLabel}>{step === 'add-child' ? 'Step 2 of 2 · Add your child' : 'Step 1 of 2 · Grown-up PIN'}</Text>

      <View style={styles.card}>
        {step === 'create-pin' ? (
          <PinPad
            testID="setup-create-pin"
            title="Create a parent PIN"
            subtitle="4 numbers only you know. It keeps the grown-up area and purchases safe from little fingers."
            error={pinError}
            onComplete={(pin) => {
              setFirstPin(pin);
              setPinError(null);
              setStep('confirm-pin');
            }}
          />
        ) : step === 'confirm-pin' ? (
          <PinPad
            testID="setup-confirm-pin"
            title="Enter the PIN again"
            subtitle="Just to make sure."
            onComplete={(pin) => {
              if (pin !== firstPin) {
                setPinError("Those PINs didn't match. Let's try again.");
                setStep('create-pin');
                return;
              }
              setParentPin(pin);
              setStep('add-child');
            }}
          />
        ) : (
          <>
            <Text style={styles.cardTitle}>Who's going to play?</Text>
            <ChildForm
              submitLabel="Let's play!"
              onSubmit={(input) => {
                const { error } = addChild(input);
                if (!error) {
                  router.replace('/home');
                }
                return error;
              }}
            />
          </>
        )}
      </View>
    </FamilyScreenFrame>
  );
}

const styles = StyleSheet.create({
  character: {
    marginBottom: theme.spacing.sm,
  },
  heading: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.text,
    textAlign: 'center',
  },
  stepLabel: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    alignSelf: 'stretch',
    padding: theme.spacing.md,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#111111',
    backgroundColor: theme.colors.surface,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.text,
    textAlign: 'center',
  },
});
