import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { theme } from '@/shared/lib/theme';

export type HexTileProps = {
  letter: string;
  /** Overall width/height (px) of the hex's bounding box. */
  size?: number;
  backgroundColor?: string;
  /** Fades the tile toward transparent — used for a tile mid-collect or a ghost preview. */
  dimmed?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

// Flat-left/right, pointy-top/bottom hexagon: a triangular cap above and below a rectangular body,
// stacked in normal flow. RN has no clip-path, so this reuses the same border-triangle technique
// HomeScreen's Play button already uses for its triangle silhouette, rather than pulling in an SVG
// dependency for one tile shape.
const CAP_HEIGHT_RATIO = 0.29;

/** A honeycomb-hex letter tile (Bee Line's shared tile art, UX Steps 14-16). Correct and decoy
 *  tiles are rendered identically by design — this component only ever looks at `letter`/`size`/
 *  `backgroundColor`, never a tile's `kind`, so a decoy can never accidentally read differently
 *  (architecture 26.4's "no color-tell" data-shape guarantee). */
export function HexTile({ letter, size = 64, backgroundColor = theme.colors.secondary, dimmed, style, testID }: HexTileProps) {
  const capHeight = Math.round(size * CAP_HEIGHT_RATIO);
  const bodyHeight = size - capHeight * 2;
  const half = size / 2;

  return (
    <View testID={testID} style={[styles.wrapper, { width: size, height: size, opacity: dimmed ? 0.45 : 1 }, style]}>
      <View style={styles.stack}>
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: half,
            borderRightWidth: half,
            borderBottomWidth: capHeight,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: backgroundColor,
          }}
        />
        <View
          style={{
            width: size,
            height: bodyHeight,
            backgroundColor,
            borderLeftWidth: 3,
            borderRightWidth: 3,
            borderColor: '#111111',
          }}
        />
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: half,
            borderRightWidth: half,
            borderTopWidth: capHeight,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: backgroundColor,
          }}
        />
      </View>
      <Text style={[styles.letter, { fontSize: size * 0.34 }]}>{letter.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  letter: {
    fontWeight: '900',
    color: theme.colors.surface,
    textShadowColor: '#111111',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
});
