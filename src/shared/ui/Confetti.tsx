import React, { useMemo } from 'react';
import { Animated, StyleSheet } from 'react-native';

export type ConfettiPiece = {
  emoji: string;
  dx: number;
  dy: number;
};

const DEFAULT_EMOJIS = ['🎉', '✨', '⭐', '🍯', '🎊', '💖', '🌟', '🎈'];

/** Arranges emoji pieces evenly around a circle, at slightly varying distances, for a burst effect. */
export function buildConfettiPieces(emojis: string[] = DEFAULT_EMOJIS): ConfettiPiece[] {
  return emojis.map((emoji, index) => {
    const angle = (index / emojis.length) * Math.PI * 2;
    const distance = 90 + (index % 3) * 18;
    return {
      emoji,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
    };
  });
}

type ConfettiProps = {
  /** An Animated.Value driven from 0 (at rest, centered) to 1 (fully burst outward and faded). */
  progress: Animated.Value;
  pieces?: ConfettiPiece[];
};

/** A reusable emoji confetti burst, centered on its parent. Drive it by animating `progress` from 0 to 1. */
export function Confetti({ progress, pieces }: ConfettiProps) {
  const resolvedPieces = useMemo(() => pieces ?? buildConfettiPieces(), [pieces]);

  return (
    <Animated.View style={styles.field} pointerEvents="none">
      {resolvedPieces.map((piece, index) => (
        <Animated.Text
          key={`${piece.emoji}-${index}`}
          style={[
            styles.piece,
            {
              opacity: progress.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, piece.dx] }) },
                { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, piece.dy] }) },
                { scale: progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.3, 1.2, 0.9] }) },
              ],
            },
          ]}
        >
          {piece.emoji}
        </Animated.Text>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  field: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  piece: {
    position: 'absolute',
    fontSize: 30,
  },
});
