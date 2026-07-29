import type { AcceleratingMusicCue } from '@/features/play/logic/bee-line';

/**
 * Pure playback-rate ramp math for `game-music-service.ts` — no expo-audio or timer imports, so
 * it's safe to import and unit test in plain Node, the same way `sprite-animation.ts` keeps its
 * frame-index math independent of the Reanimated player it feeds. `game-music-service.ts` is the
 * expo-audio-dependent layer that calls this on a recurring timer to drive `player.setPlaybackRate`.
 */

/**
 * Linearly interpolates `cue`'s playback rate at `elapsedMs` since its loop started, clamped so
 * the ramp never overshoots or wraps: before the ramp starts the rate is pinned to `startRate`,
 * and once `elapsedMs` reaches (or passes) `rampMs` it's pinned to `endRate` and stays there.
 * `rampMs <= 0` is treated as an instant jump to `endRate` rather than dividing by zero.
 */
export function resolvePlaybackRateAtElapsedMs(cue: AcceleratingMusicCue, elapsedMs: number): number {
  if (cue.rampMs <= 0) {
    return cue.endRate;
  }

  if (elapsedMs <= 0) {
    return cue.startRate;
  }

  if (elapsedMs >= cue.rampMs) {
    return cue.endRate;
  }

  const progress = elapsedMs / cue.rampMs;
  return cue.startRate + (cue.endRate - cue.startRate) * progress;
}
