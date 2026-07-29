import { createAudioPlayer } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import type { AcceleratingMusicCue } from '@/features/play/logic/bee-line';
import { resolvePlaybackRateAtElapsedMs } from './playback-rate-ramp';

// Audio requires (like image requires) resolve to a Metro asset module id — a number at runtime.
type MusicTrackMap = Partial<Record<string, number>>;

/**
 * Maps each `AcceleratingMusicCue.trackId` to its `require()`d asset. Same static-require
 * constraint, and same "fill in by hand as clips land" approach, as `character-audio.ts`/
 * `sound-effects-service.ts`'s `SOUND_EFFECTS`. Inlined here rather than split into a sibling
 * lookup file (the way `character-audio.ts` is split out from `character-audio-service.ts`)
 * because this is a flat trackId -> asset map with no per-character grouping to justify a second
 * file — the same shape and reasoning `sound-effects-service.ts`'s inline `SOUND_EFFECTS` already
 * uses in this codebase. Empty today — no music tracks have been delivered yet (Epic 23 is the
 * first consumer). `playLoop()` no-ops (silently, returns `false`) until a real track is dropped
 * in and registered here — no other code needs to change when that happens.
 *
 *   'impossible-chase': require('../../../../assets/audio/music/impossible-chase.mp3'),
 */
const MUSIC_TRACKS: MusicTrackMap = {};

/**
 * How often the rate ramp is re-evaluated and pushed to the player. Background music doesn't need
 * per-frame precision the way a visual animation does — a coarse 100ms tick is inaudible as a
 * "step" in playback rate, so a plain `setInterval` is enough; no Reanimated/requestAnimationFrame
 * driver is warranted for this.
 */
const RATE_TICK_INTERVAL_MS = 100;

class GameMusicService {
  private player: AudioPlayer | null = null;
  private rampTimer: ReturnType<typeof setInterval> | null = null;
  private loopStartedAt = 0;

  /**
   * Starts (or replaces) the single looping background-music track, ramping its playback rate
   * from `cue.startRate` to `cue.endRate` over `cue.rampMs` (see `resolvePlaybackRateAtElapsedMs`
   * in `playback-rate-ramp.ts` for the ramp math). Only one loop ever plays at a time — unlike
   * `characterAudioService`/`soundEffectsService`'s deliberate one-player-per-call SFX design
   * (multiple voice lines or cues can legitimately overlap), this is background music, so a new
   * call always stops whatever loop is already playing first.
   *
   * Returns whether `cue.trackId` is registered in `MUSIC_TRACKS` — silently no-ops (and returns
   * `false`) when it isn't, which is the expected, normal state for every track today (see
   * `MUSIC_TRACKS` above). Never throws, matching the fail-silent discipline every other audio
   * service in this codebase already follows.
   */
  playLoop(cue: AcceleratingMusicCue): boolean {
    const source = MUSIC_TRACKS[cue.trackId];
    if (source == null) {
      return false;
    }

    this.stop();

    try {
      const player = createAudioPlayer(source);
      player.loop = true;
      this.player = player;
      this.loopStartedAt = Date.now();
      player.play();

      this.rampTimer = setInterval(() => {
        const elapsedMs = Date.now() - this.loopStartedAt;
        try {
          player.setPlaybackRate(resolvePlaybackRateAtElapsedMs(cue, elapsedMs));
        } catch {
          // Rate changes aren't guaranteed to work in every environment; the loop just keeps
          // playing at whatever rate it last had rather than crashing gameplay.
        }
      }, RATE_TICK_INTERVAL_MS);
    } catch {
      // Playback isn't guaranteed to work in every environment. The track simply won't be heard —
      // this must never throw into gameplay code, matching every other audio service here.
      this.player = null;
    }

    return true;
  }

  /** Stops and releases the current loop, if any, and clears its rate-ramp timer. */
  stop(): void {
    if (this.rampTimer != null) {
      clearInterval(this.rampTimer);
      this.rampTimer = null;
    }

    if (this.player != null) {
      const player = this.player;
      this.player = null;
      try {
        player.pause();
        player.remove();
      } catch {
        // Already released, or the platform doesn't support explicit release — nothing to clean up.
      }
    }
  }

  /**
   * Stops the current loop, if any. Exposed as a separate name from `stop()` purely for call-site
   * consistency with `characterAudioService.stopAll()`/`soundEffectsService.stopAll()` — a
   * screen's unmount effect calls all three services' cleanup methods side by side (e.g.
   * `BeeLineScreen.tsx`'s existing `characterAudioService.stopAll()` / `speechService.stop()`
   * pair), and a future epic wiring this service in will want the same shape to reach for. This
   * service only ever has one active loop to stop, so `stopAll()` is just an alias for `stop()`
   * rather than distinct logic — kept as two names rather than collapsed to one for that call-site
   * consistency, not because they behave differently.
   */
  stopAll(): void {
    this.stop();
  }
}

// A single shared instance, matching characterAudioService/soundEffectsService/speechService —
// only one background loop should ever exist at once, so its state belongs in one shared place.
export const gameMusicService = new GameMusicService();
