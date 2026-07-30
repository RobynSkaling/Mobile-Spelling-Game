import { createAudioPlayer } from 'expo-audio';
import type { AudioPlayer, AudioStatus } from 'expo-audio';

/**
 * One-shot game sound-effect cues — distinct from `characterAudioService`'s per-character voice
 * lines (`CharacterAudioVariant`) and from `speechService`'s TTS. Bee Line's two mistake-feedback
 * cues (Epic 20, roadmap Epic 15/UX Step 18) live here, alongside the `impossible`-tier timeout
 * "pop-pop-fizzz" cue (Epic 23, roadmap Epic 16/UX Step 17); add further cue ids as other epics
 * need generic (non-character) SFX rather than growing `CharacterAudioVariant` to cover them.
 */
export type SoundEffectCue = 'bee-line-wrong-order' | 'bee-line-wrong-letter' | 'bee-line-timeout';

// Audio requires (like image requires) resolve to a Metro asset module id — a number at runtime.
type SoundEffectMap = Partial<Record<SoundEffectCue, number>>;

/**
 * Maps each cue id to its `require()`d asset. Same static-require constraint, and same "fill in by
 * hand as clips land" approach, as `character-audio.ts`. Empty today — no SFX assets have been
 * delivered yet, mirroring the exact gap Epic 7/9/11 shipped for character voice lines rather than
 * blocking this epic's wiring on asset delivery. `playCue()` no-ops (silently, returns `false`)
 * until a real `.mp3` is dropped in and registered here — no other code needs to change when that
 * happens.
 *
 *   'bee-line-wrong-order': require('../../../../assets/audio/sfx/bee-line-wrong-order.mp3'),
 *   'bee-line-timeout': require('../../../../assets/audio/sfx/bee-line-timeout.mp3'),
 */
const SOUND_EFFECTS: SoundEffectMap = {};

class SoundEffectsService {
  // Mirrors characterAudioService.activePlayers — a single shared bookkeeping set so stopAll() can
  // clean up every in-flight cue together (e.g. on screen unmount), even though each play() call
  // gets its own player (two cues can legitimately overlap).
  private activePlayers = new Set<AudioPlayer>();

  /**
   * Plays `cue`'s registered sound effect, if one exists in `SOUND_EFFECTS`. Returns whether a clip
   * is registered — silently no-ops (and returns `false`) when nothing is registered, which is the
   * expected, normal state for every cue today (see `SOUND_EFFECTS` above). Never throws, matching
   * the fallback discipline `characterAudioService.playCharacterLine`/`speechService.speak` already
   * use, so a missing or misbehaving audio asset can never interrupt gameplay.
   */
  playCue(cue: SoundEffectCue): boolean {
    const source = SOUND_EFFECTS[cue];
    if (source == null) {
      return false;
    }

    try {
      const player = createAudioPlayer(source);
      this.activePlayers.add(player);

      const subscription = player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
        if (status.didJustFinish) {
          subscription.remove();
          this.releasePlayer(player);
        }
      });

      player.play();
    } catch {
      // Playback isn't guaranteed to work in every environment. The cue simply won't be heard —
      // this must never throw into gameplay code.
    }

    return true;
  }

  private releasePlayer(player: AudioPlayer): void {
    this.activePlayers.delete(player);
    try {
      player.pause();
      player.remove();
    } catch {
      // Already released, or the platform doesn't support explicit release — nothing to clean up.
    }
  }

  /** Stops and releases every currently-playing cue. Call on unmount, mirroring
   *  characterAudioService.stopAll()/speechService.stop(). */
  stopAll(): void {
    for (const player of this.activePlayers) {
      this.releasePlayer(player);
    }
  }
}

// A single shared instance, matching characterAudioService/speechService.
export const soundEffectsService = new SoundEffectsService();
