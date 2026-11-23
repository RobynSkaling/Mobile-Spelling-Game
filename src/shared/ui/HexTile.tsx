import React from 'react';
import { StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { theme } from '@/shared/lib/theme';
import { Hexagon } from './Hexagon';

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

/** A honeycomb-hex letter tile (Bee Line's shared tile art, UX Steps 14-16). Correct and decoy
 *  tiles are rendered identically by design — this component only ever looks at `letter`/`size`/
 *  `backgroundColor`, never a tile's `kind`, so a decoy can never accidentally read differently
 *  (architecture 26.4's "no color-tell" data-shape guarantee). */
export function HexTile({ letter, size = 64, backgroundColor = theme.colors.secondary, dimmed, style, testID }: HexTileProps) {
  return (
    <Hexagon
      testID={testID}
      size={size}
      backgroundColor={backgroundColor}
      style={[{ opacity: dimmed ? 0.45 : 1 }, style]}
    >
      <Text style={[styles.letter, { fontSize: size * 0.34 }]}>{letter.toUpperCase()}</Text>
    </Hexagon>
  );
}

const styles = StyleSheet.create({
  letter: {
    fontWeight: '900',
    color: theme.colors.surface,
    textShadowColor: '#111111',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
});
