import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/shared/lib/theme';
import { ALBUM_BUTTON_LABEL, getAlbumAccessibilityLabel, getAlbumStreakLabel } from '../logic/streak-display';
import { useStreakStatus } from '../hooks/useStreakStatus';

type StickerAlbumButtonProps = {
  onPress: () => void;
};

/**
 * Home's named "Sticker Album" button (Epic 27, replacing Epic 26's corner streak badge). It sits
 * beside Final Test under Play, so it is a secondary action — the streak is a small chip on the
 * icon line, never a second focal point.
 *
 * Grace day (UX Step 22): swaps to a calm "resting bee + zzz" on the `rest` tone — never hidden,
 * never `primary` Tomato (reserved for wrong/miss), never a red-dot/alert look.
 */
export function StickerAlbumButton({ onPress }: StickerAlbumButtonProps) {
  const { status, current, isHydrated } = useStreakStatus();

  // Before hydration the store holds its empty default, which reads as a "new" player; the button
  // is always present, so it just shows no streak for that instant rather than flashing one.
  const effectiveStatus = isHydrated ? status : 'new';
  const streakLabel = getAlbumStreakLabel(effectiveStatus, current);
  const resting = effectiveStatus === 'resting';

  return (
    <Pressable
      testID="sticker-album-button"
      accessibilityRole="button"
      accessibilityLabel={getAlbumAccessibilityLabel(effectiveStatus, current)}
      onPress={onPress}
      style={({ pressed }) => [styles.button, resting && styles.buttonResting, pressed && styles.pressed]}
    >
      <View style={styles.iconRow}>
        <Text style={styles.emoji}>📒</Text>
        {streakLabel ? (
          <View testID="sticker-album-streak" style={styles.streak}>
            <View>
              <Text style={[styles.bee, resting && styles.beeResting]}>🐝</Text>
              {resting ? (
                <Text testID="sticker-album-zzz" style={styles.zzz}>
                  zzz
                </Text>
              ) : null}
            </View>
            <Text style={styles.streakText}>{streakLabel}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.label}>{ALBUM_BUTTON_LABEL}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#111111',
    backgroundColor: theme.colors.accent,
  },
  buttonResting: {
    backgroundColor: theme.colors.rest,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  // Fixed height keeps the button the same size whether or not a streak chip is showing, so the
  // row doesn't jump when the streak hydrates.
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 28,
  },
  emoji: {
    fontSize: 22,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  bee: {
    fontSize: 14,
  },
  // A sleepy, slightly tilted bee — "napping," not "broken."
  beeResting: {
    transform: [{ rotate: '-20deg' }],
  },
  zzz: {
    position: 'absolute',
    top: -8,
    right: -10,
    fontSize: 10,
    fontWeight: '800',
    fontStyle: 'italic',
    color: theme.colors.muted,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.text,
  },
  label: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
  },
});
