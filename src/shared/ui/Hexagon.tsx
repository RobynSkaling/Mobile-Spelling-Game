import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

export type HexagonProps = {
  /** Overall width/height (px) of the hex's bounding box. */
  size: number;
  backgroundColor: string;
  /** Centered over the hex — a letter (HexTile), a sticker glyph (the sticker album), etc. */
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

// Flat-left/right, pointy-top/bottom hexagon: a triangular cap above and below a rectangular body,
// stacked in normal flow. RN has no clip-path, so this reuses the same border-triangle technique
// HomeScreen's Play button already uses for its triangle silhouette, rather than pulling in an SVG
// dependency for one shape.
const CAP_HEIGHT_RATIO = 0.29;

/** The bare honeycomb hex shape shared by Bee Line's letter tiles (HexTile) and the sticker album's
 *  slots, so both read as the same honeycomb family without duplicating the border-triangle math. */
export function Hexagon({ size, backgroundColor, children, style, testID }: HexagonProps) {
  const capHeight = Math.round(size * CAP_HEIGHT_RATIO);
  const bodyHeight = size - capHeight * 2;
  const half = size / 2;

  return (
    <View testID={testID} style={[styles.wrapper, { width: size, height: size }, style]}>
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
      {children}
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
});
