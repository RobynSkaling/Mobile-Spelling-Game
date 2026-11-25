import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '@/shared/lib/theme';
import { BIRTH_YEAR_RANGE, ChildInput } from '@/stores/family-logic';
import { AVATARS, ChildAvatar } from './ChildAvatar';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DEFAULT_AGE = 6;

type ChildFormProps = {
  initial?: Partial<ChildInput>;
  submitLabel: string;
  /** Returns an error message to show, or null on success. */
  onSubmit: (input: ChildInput) => string | null;
  onCancel?: () => void;
};

/** Name, avatar, birth month and birth year for a child (Epic 30). Only month + year are asked for —
 *  enough to work out age without holding a full date of birth (roadmap Section 13, decision 4). */
export function ChildForm({ initial, submitLabel, onSubmit, onCancel }: ChildFormProps) {
  const currentYear = new Date().getFullYear();
  const [name, setName] = useState(initial?.name ?? '');
  const [avatar, setAvatar] = useState(initial?.avatar ?? AVATARS[0].emoji);
  const [birthMonth, setBirthMonth] = useState<number | null>(initial?.birthMonth ?? null);
  const [birthYear, setBirthYear] = useState(initial?.birthYear ?? currentYear - DEFAULT_AGE);
  const [error, setError] = useState<string | null>(null);

  const minYear = currentYear - BIRTH_YEAR_RANGE.maxAge;
  const maxYear = currentYear - BIRTH_YEAR_RANGE.minAge;

  const handleSubmit = () => {
    if (birthMonth === null) {
      setError('Please choose a birth month.');
      return;
    }
    setError(onSubmit({ name, avatar, birthMonth, birthYear }));
  };

  return (
    <View style={styles.form}>
      <Text style={styles.label}>Name</Text>
      <TextInput
        testID="child-name-input"
        value={name}
        onChangeText={(text) => {
          setName(text);
          setError(null);
        }}
        placeholder="Child's name"
        style={styles.input}
        autoCapitalize="words"
        maxLength={24}
      />

      <Text style={styles.label}>Avatar</Text>
      <View style={styles.wrapRow}>
        {AVATARS.map((option) => {
          const selected = option.emoji === avatar;
          return (
            <Pressable
              key={option.emoji}
              accessibilityRole="button"
              accessibilityLabel={`Avatar ${option.emoji}${selected ? ', selected' : ''}`}
              onPress={() => setAvatar(option.emoji)}
              style={[styles.avatarOption, selected && styles.avatarOptionSelected]}
            >
              <ChildAvatar emoji={option.emoji} size={48} />
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Birth month</Text>
      <View style={styles.wrapRow}>
        {MONTHS.map((month, index) => {
          const value = index + 1;
          const selected = value === birthMonth;
          return (
            <Pressable
              key={month}
              testID={`birth-month-${value}`}
              accessibilityRole="button"
              accessibilityLabel={`${month}${selected ? ', selected' : ''}`}
              onPress={() => {
                setBirthMonth(value);
                setError(null);
              }}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{month}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Birth year</Text>
      <View style={styles.yearRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Earlier year"
          disabled={birthYear <= minYear}
          onPress={() => setBirthYear((year) => Math.max(minYear, year - 1))}
          style={[styles.stepButton, birthYear <= minYear && styles.disabled]}
        >
          <Text style={styles.stepText}>−</Text>
        </Pressable>
        <Text testID="birth-year-value" style={styles.yearText}>
          {birthYear}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Later year"
          disabled={birthYear >= maxYear}
          onPress={() => setBirthYear((year) => Math.min(maxYear, year + 1))}
          style={[styles.stepButton, birthYear >= maxYear && styles.disabled]}
        >
          <Text style={styles.stepText}>+</Text>
        </Pressable>
      </View>

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <View style={styles.buttonRow}>
        {onCancel ? (
          <Pressable accessibilityRole="button" onPress={onCancel} style={[styles.button, styles.cancelButton]}>
            <Text style={styles.buttonText}>Cancel</Text>
          </Pressable>
        ) : null}
        <Pressable
          testID="child-form-submit"
          accessibilityRole="button"
          onPress={handleSubmit}
          style={[styles.button, styles.submitButton]}
        >
          <Text style={[styles.buttonText, styles.submitText]}>{submitLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    alignSelf: 'stretch',
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  input: {
    minHeight: 48,
    backgroundColor: theme.colors.surface,
    borderWidth: 3,
    borderColor: '#111111',
    borderRadius: 16,
    paddingHorizontal: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  avatarOption: {
    padding: 2,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  // Gold ring, so the choice shows on both the white setup card and the blue background.
  avatarOptionSelected: {
    borderColor: theme.colors.gold,
  },
  chip: {
    minWidth: 56,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#111111',
    backgroundColor: theme.colors.surface,
  },
  chipSelected: {
    backgroundColor: theme.colors.secondary,
  },
  chipText: {
    fontWeight: '800',
    color: theme.colors.text,
  },
  chipTextSelected: {
    color: theme.colors.surface,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  stepButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#111111',
    backgroundColor: theme.colors.surface,
  },
  stepText: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.text,
  },
  yearText: {
    minWidth: 64,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.text,
  },
  disabled: {
    opacity: 0.4,
  },
  error: {
    marginTop: theme.spacing.sm,
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.muted,
  },
  buttonRow: {
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
