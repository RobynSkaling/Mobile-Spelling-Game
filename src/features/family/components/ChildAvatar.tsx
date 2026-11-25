import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { theme } from '@/shared/lib/theme';

/** The avatar choices for a child profile, carried over from the old single-profile screen so
 *  migrated profiles keep the same picture and colour. */
export const AVATARS = [
  { emoji: '🐧', color: '#8E44AD' },
  { emoji: '🐺', color: '#E74C3C' },
  { emoji: '🦊', color: '#3498DB' },
  { emoji: '🐸', color: '#F39C12' },
  { emoji: '🦄', color: '#FF69B4' },
  { emoji: '🦚', color: '#F1C40F' },
];

function colorFor(emoji: string): string {
  return AVATARS.find((option) => option.emoji === emoji)?.color ?? theme.colors.secondary;
}

type ChildAvatarProps = {
  emoji: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/** A child's round avatar badge, in the same thick-black-border style as the character badges. */
export function ChildAvatar({ emoji, size = 60, style }: ChildAvatarProps) {
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colorFor(emoji), borderWidth: size >= 48 ? 4 : 3 },
        style,
      ]}
    >
      <Text style={{ fontSize: size * 0.48 }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#111111',
  },
});
