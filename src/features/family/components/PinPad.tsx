import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/shared/lib/theme';
import { PIN_LENGTH } from '@/stores/family-logic';

type PinPadProps = {
  title: string;
  subtitle?: string;
  /** Shown under the dots, e.g. "That PIN didn't match". */
  error?: string | null;
  /** Called once all digits are entered; the pad then clears itself for the next attempt. */
  onComplete: (pin: string) => void;
  testID?: string;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

/** An on-screen number pad for the parent PIN. Built from buttons rather than a text field so it
 *  works the same on phone, tablet, and web, with no keyboard popping up over the screen. */
export function PinPad({ title, subtitle, error, onComplete, testID }: PinPadProps) {
  const [digits, setDigits] = useState('');

  const press = (key: string) => {
    if (key === '⌫') {
      setDigits((current) => current.slice(0, -1));
      return;
    }
    const next = digits + key;
    if (next.length === PIN_LENGTH) {
      setDigits('');
      onComplete(next);
    } else {
      setDigits(next);
    }
  };

  return (
    <View testID={testID} style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.dots} accessibilityLabel={`${digits.length} of ${PIN_LENGTH} digits entered`}>
        {Array.from({ length: PIN_LENGTH }, (_, index) => (
          <View key={index} style={[styles.dot, index < digits.length && styles.dotFilled]} />
        ))}
      </View>
      <Text style={styles.error} accessibilityLiveRegion="polite">
        {error ?? ' '}
      </Text>

      <View style={styles.keys}>
        {KEYS.map((key, index) =>
          key === '' ? (
            <View key={`blank-${index}`} style={styles.keySpacer} />
          ) : (
            <Pressable
              key={key}
              testID={`pin-key-${key === '⌫' ? 'delete' : key}`}
              accessibilityRole="button"
              accessibilityLabel={key === '⌫' ? 'Delete' : key}
              onPress={() => press(key)}
              style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
            >
              <Text style={styles.keyText}>{key}</Text>
            </Pressable>
          ),
        )}
      </View>
    </View>
  );
}

const KEY_SIZE = 64;

const styles = StyleSheet.create({
  container: {
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
    maxWidth: 300,
  },
  dots: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: '#111111',
    backgroundColor: theme.colors.surface,
  },
  dotFilled: {
    backgroundColor: '#111111',
  },
  error: {
    marginTop: theme.spacing.xs,
    minHeight: 20,
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.muted,
    textAlign: 'center',
  },
  keys: {
    marginTop: theme.spacing.xs,
    width: KEY_SIZE * 3 + theme.spacing.sm * 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  key: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: KEY_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#111111',
    backgroundColor: theme.colors.surface,
  },
  keyPressed: {
    backgroundColor: theme.colors.gold,
  },
  keySpacer: {
    width: KEY_SIZE,
    height: KEY_SIZE,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
  },
});
