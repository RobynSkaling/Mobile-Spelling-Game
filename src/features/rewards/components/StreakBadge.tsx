import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { theme } from '@/shared/lib/theme';
import { getBadgeAccessibilityLabel, getBadgeLabel } from '../logic/streak-display';
import { useStreakStatus } from '../hooks/useStreakStatus';

type StreakBadgeProps = {
  onPress: () => void;
  /** Positioning only — the caller pins it into a corner (UX Step 20). */
  style?: StyleProp<ViewStyle>;
};

/**
 * Small, glanceable streak charm for the Home screen (UX Step 20). Deliberately small and
 * self-contained so it never becomes a second focal point next to Play.
 *
 * Grace day (UX Step 22): swaps to a calm "resting bee + zzz" on the `rest` tone — never hidden,
 * never `primary` Tomato (reserved for wrong/miss), never a red-dot/alert look.
 */
export function StreakBadge({ onPress, style }: StreakBadgeProps) {
  const { status, current, isHydrated } = useStreakStatus();

  // Before hydration the store still holds its empty default, which would flash "Start!" on a
  // returning player's first frame — render nothing for that instant instead.
  if (!isHydrated) {
    return null;
  }

  const resting = status === 'resting';

  return (
    <Pressable
      testID="streak-badge"
      accessibilityRole="button"
      accessibilityLabel={getBadgeAccessibilityLabel(status, current)}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.badge, resting && styles.badgeResting, pressed && styles.pressed, style]}
    >
      <View>
        <Text style={[styles.bee, resting && styles.beeResting]}>🐝</Text>
        {resting ? (
          <Text testID="streak-badge-zzz" style={styles.zzz}>
            zzz
          </Text>
        ) : null}
      </View>
      <Text style={styles.label}>{getBadgeLabel(status, current)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#111111',
    backgroundColor: theme.colors.gold,
  },
  badgeResting: {
    backgroundColor: theme.colors.rest,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  bee: {
    fontSize: 22,
  },
  // A sleepy, slightly tilted bee — "napping," not "broken."
  beeResting: {
    transform: [{ rotate: '-20deg' }],
  },
  zzz: {
    position: 'absolute',
    top: -10,
    right: -12,
    fontSize: 11,
    fontWeight: '800',
    fontStyle: 'italic',
    color: theme.colors.muted,
  },
  label: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.text,
  },
});
