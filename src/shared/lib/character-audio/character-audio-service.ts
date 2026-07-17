import { createAudioPlayer } from 'expo-audio';
import type { AudioPlayer, AudioStatus } from 'expo-audio';
import { getCharacterAudio } from '@/data/characters/character-audio';
import { CharacterAudioVariant } from '@/data/characters/character-roster';

class CharacterAudioService {
  // Pre-recorded voice lines are one-shot sound effects belonging to different characters, not a
  // single narrator queue the way speechService's TTS is — Mama Bear's praise line and a villain's
  // defeated line can legitimately overlap (both fire off the same word-complete event), so every
  // call gets its own player rather than sharing one slot. This set exists purely so stopAll() can
  // clean everything up together (e.g. on screen unmount).
  private activePlayers = new Set<AudioPlayer>();

  /**
   * Plays `characterId`'s pre-recorded voice line for `variant`, if one has been registered in
   * character-audio.ts. Returns whether a clip is registered for this character/variant — call
   * sites that have a TTS fallback for the same moment (e.g. praise) use this to decide whether to
   * skip the TTS phrase rather than layering both voices at once.
   *
   * Silently no-ops (and returns `false`) when no clip is registered, which is the expected, normal
   * state for every character today — see character-audio.ts. Never throws, even if expo-audio's
   * native module misbehaves or isn't available on the current platform (notably headless/sandboxed
   * web), matching the fallback discipline used everywhere else in the character system and
   * speech-service.ts's own `speak()`.
   */
  playCharacterLine(characterId: string, variant: CharacterAudioVariant): boolean {
    const source = getCharacterAudio(characterId, variant);
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
      // Playback isn't guaranteed to work in every environment. The clip simply won't be heard —
      // this must never throw into gameplay code, the same discipline speech-service.ts uses.
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

  /** Stops and releases every currently-playing voice line. Call on unmount, mirroring
   *  speechService.stop(). */
  stopAll(): void {
    for (const player of this.activePlayers) {
      this.releasePlayer(player);
    }
  }
}

// A single shared instance, matching speechService — the active-players bookkeeping only makes
// sense kept against one shared registry of "what's currently playing".
export const characterAudioService = new CharacterAudioService();
