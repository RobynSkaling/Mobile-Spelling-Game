import React from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import {
  CharacterAnimationState,
  CharacterImageVariant,
  CharacterRelativeSize,
  getCharacterById,
} from '@/data/characters/character-roster';
import { getCharacterImage } from '@/data/characters/character-images';
import { getCharacterAnimation, SpriteSheetAnimation } from '@/data/characters/character-animations';
import { useReduceMotion } from '@/shared/lib/accessibility';
import { useSpriteAnimation } from './useSpriteAnimation';

const SIZE_PRESETS: Record<CharacterRelativeSize, number> = {
  small: 56,
  medium: 96,
  large: 152,
};

export type CharacterSize = CharacterRelativeSize | number;

export type CharacterProps = {
  /** Which character to render — matches an id in CHARACTER_ROSTER. */
  characterId: string;
  /** Which pose/expression to show. Defaults to 'idle', or a pose matching `animationState` (e.g.
   *  'happy' for 'Celebrating') when that's passed without an explicit `variant`. Falls back to
   *  the emoji glyph if this variant hasn't been registered with real artwork yet. */
  variant?: CharacterImageVariant;
  /** Which sprite-sheet animation to play, if any. Takes priority over `variant` when a sprite
   *  sheet is registered for it; falls back through the static pose image to the emoji glyph
   *  otherwise, so passing this is always safe even before animated artwork exists. */
  animationState?: CharacterAnimationState;
  /** Pixel size, or a size preset. Defaults to the character's own relativeSize. */
  size?: CharacterSize;
  /** Layout-only style overrides (margin, alignment, etc.) applied to the outer badge. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

function resolvePixelSize(size: CharacterSize | undefined, relativeSize: CharacterRelativeSize): number {
  if (typeof size === 'number') {
    return size;
  }
  return SIZE_PRESETS[size ?? relativeSize];
}

/**
 * When `animationState` is passed without an explicit `variant`, the static-pose fallback should
 * still reflect what's happening rather than always showing the neutral 'idle' pose — e.g. a
 * villain reacting to 'Defeated' should fall back to its 'defeated' pose, not 'idle', if a sprite
 * sheet for that state isn't registered yet. States without a more specific static pose fall back
 * to 'idle'.
 */
function defaultVariantForAnimationState(animationState: CharacterAnimationState | undefined): CharacterImageVariant {
  switch (animationState) {
    case 'Celebrating':
      return 'happy';
    case 'Defeated':
      return 'defeated';
    default:
      return 'idle';
  }
}

type AnimatedSpriteProps = {
  characterId: string;
  animation: SpriteSheetAnimation;
  pixelSize: number;
};

/** Renders one frame of a sprite sheet at a time, scaled to fit the badge's square footprint. */
function AnimatedSprite({ characterId, animation, pixelSize }: AnimatedSpriteProps) {
  const animatedStyle = useSpriteAnimation(animation);
  const scale = pixelSize / Math.max(animation.frameWidth, animation.frameHeight);

  return (
    <View testID={`character-${characterId}-sprite`} style={{ width: pixelSize, height: pixelSize, overflow: 'hidden' }}>
      <View
        style={{
          width: animation.frameWidth,
          height: animation.frameHeight,
          overflow: 'hidden',
          transform: [{ scale }],
        }}
      >
        <Animated.Image
          source={animation.sheet}
          resizeMode="cover"
          style={[{ width: animation.frameWidth * animation.frameCount, height: animation.frameHeight }, animatedStyle]}
        />
      </View>
    </View>
  );
}

/**
 * Displays a character by id, looking up its data and artwork from the character registry
 * instead of the caller importing an image directly. Rendering falls back through three tiers —
 * an animated sprite sheet (if `animationState` is passed and registered), a static pose image,
 * and finally the character's emoji glyph on its accent-colored badge — so screens using this
 * component work today and pick up real art automatically as it's registered in
 * character-animations.ts / character-images.ts, with no call-site changes required.
 *
 * Architecture 25.8: when the OS-level reduce-motion setting is on, the animated-sprite tier is
 * skipped entirely — this always resolves to the static pose image (or the emoji glyph, if that
 * pose isn't registered either) even when a real sprite sheet exists for the requested state.
 * `resolvedVariant` still tracks `animationState` as normal, so the pose keeps switching on state
 * changes ("Celebrating" still shows the happy pose, "Defeated" still shows the defeated pose) —
 * only the frame-by-frame animation is suppressed, per 25.8's "still switching poses on state
 * changes" requirement.
 */
export function Character({ characterId, variant, animationState, size, style, testID }: CharacterProps) {
  const character = getCharacterById(characterId);
  const reduceMotionEnabled = useReduceMotion();

  if (!character) {
    return null;
  }

  const pixelSize = resolvePixelSize(size, character.relativeSize);
  const animation =
    animationState && !reduceMotionEnabled ? getCharacterAnimation(characterId, animationState) : null;
  const resolvedVariant = variant ?? defaultVariantForAnimationState(animationState);
  const imageSource = animation ? null : getCharacterImage(characterId, resolvedVariant);

  return (
    <View
      testID={testID ?? `character-${characterId}`}
      accessibilityLabel={character.name}
      style={[
        styles.badge,
        {
          width: pixelSize,
          height: pixelSize,
          borderRadius: pixelSize / 2,
          backgroundColor: character.accentColor,
        },
        style,
      ]}
    >
      {animation ? (
        <AnimatedSprite characterId={characterId} animation={animation} pixelSize={pixelSize} />
      ) : imageSource ? (
        <Image
          testID={`character-${characterId}-image`}
          source={imageSource}
          style={styles.image}
          resizeMode="contain"
        />
      ) : (
        <Text testID={`character-${characterId}-fallback`} style={{ fontSize: pixelSize * 0.55 }}>
          {character.emoji}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#111111',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
