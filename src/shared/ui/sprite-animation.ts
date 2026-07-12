/**
 * Pure sprite-sheet frame math — no react-native or reanimated imports, so it's safe to import
 * and unit test in plain Node, the same way character-roster.ts stays platform-agnostic on
 * purpose. `useSpriteAnimation.ts` is the reanimated-dependent layer that calls these.
 */

/**
 * Given how many frames' worth of time have elapsed (a continuous value, e.g. driven by a
 * Reanimated timing animation ramping from 0 to `frameCount`), returns which discrete frame
 * should currently be showing. A looping animation wraps back to frame 0; a one-shot animation
 * holds on the last frame once it's played through.
 */
export function resolveSpriteFrameIndex(framesElapsed: number, frameCount: number, loop: boolean): number {
  if (frameCount <= 0 || framesElapsed < 0) {
    return 0;
  }

  const rawFrame = Math.floor(framesElapsed);

  if (loop) {
    return rawFrame % frameCount;
  }

  return Math.min(rawFrame, frameCount - 1);
}

/**
 * Horizontal pixel offset of a given frame within a single-row sprite sheet strip (see the
 * layout convention documented on `SpriteSheetAnimation` in character-animations.ts).
 */
export function resolveSpriteFrameOffsetX(frameIndex: number, frameWidth: number): number {
  return Math.max(0, frameIndex) * frameWidth;
}

/** Total playback duration of one full pass through the animation, in milliseconds. */
export function resolveSpriteAnimationDurationMs(frameCount: number, fps: number): number {
  if (frameCount <= 0 || fps <= 0) {
    return 0;
  }
  return (frameCount / fps) * 1000;
}
