import { useEffect } from 'react';
import { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SpriteSheetAnimation } from '@/data/characters/character-animations';
import { resolveSpriteAnimationDurationMs, resolveSpriteFrameIndex, resolveSpriteFrameOffsetX } from './sprite-animation';

/**
 * Drives sprite-sheet frame playback on the UI thread. Ramps a shared value linearly from 0 to
 * `frameCount` over one full pass of the animation, then reads the floored value each frame to
 * resolve the current frame and its horizontal crop offset — a standard Reanimated technique for
 * turning a continuous timing animation into discrete steps.
 *
 * Returns an animated style (a `translateX`) meant for the sprite-sheet `Animated.Image`, sized
 * to `frameWidth * frameCount` and clipped by a fixed-size parent `overflow: 'hidden'` view.
 */
export function useSpriteAnimation(animation: SpriteSheetAnimation | null) {
  const progress = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(progress);

    if (!animation) {
      progress.value = 0;
      return;
    }

    const durationMs = resolveSpriteAnimationDurationMs(animation.frameCount, animation.fps);
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(animation.frameCount, { duration: durationMs, easing: Easing.linear }),
      animation.loop ? -1 : 1,
      false,
    );

    return () => cancelAnimation(progress);
  }, [animation, progress]);

  return useAnimatedStyle(() => {
    if (!animation) {
      return {};
    }

    const frameIndex = resolveSpriteFrameIndex(progress.value, animation.frameCount, animation.loop);
    const offsetX = resolveSpriteFrameOffsetX(frameIndex, animation.frameWidth);

    return {
      transform: [{ translateX: -offsetX }],
    };
  }, [animation]);
}
