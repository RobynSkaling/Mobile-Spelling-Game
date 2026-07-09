import * as Speech from 'expo-speech';
import { pickBestEnglishVoice } from './voice-selection';
import { pickNextPraiseIndex } from './praise-selector';
import { DEFAULT_VOICE_PACK_ID, getVoicePack, VoicePackId } from './voice-packs';

// Word pronunciation is slowed down further than praise — clarity matters most when the whole
// point is "listen carefully and spell this."
const WORD_RATE_FACTOR = 0.8;
const MIN_RATE = 0.5;

class SpeechService {
  private selectedVoiceId: string | null = null;
  private voiceDetectionPromise: Promise<void> | null = null;
  private activePackId: VoicePackId = DEFAULT_VOICE_PACK_ID;
  private lastPraiseIndex: number | null = null;

  /**
   * Scans the device's available TTS voices and remembers the best-sounding English one.
   * Call once on app startup. Safe to call again later — it only does the scan once and
   * every subsequent call reuses the same in-flight/completed promise.
   */
  init(): Promise<void> {
    if (!this.voiceDetectionPromise) {
      this.voiceDetectionPromise = this.detectBestVoice();
    }
    return this.voiceDetectionPromise;
  }

  private async detectBestVoice(): Promise<void> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      const best = pickBestEnglishVoice(voices);
      this.selectedVoiceId = best?.identifier ?? null;
    } catch {
      // getAvailableVoicesAsync isn't supported everywhere (some Android builds, some
      // sandboxed environments). Falling back to the platform's own default voice is fine.
      this.selectedVoiceId = null;
    }
  }

  /** Switches which personality (voice pack) future speech uses. Resets repeat-avoidance. */
  setVoicePack(id: VoicePackId): void {
    this.activePackId = id;
    this.lastPraiseIndex = null;
  }

  getVoicePackId(): VoicePackId {
    return this.activePackId;
  }

  private speak(text: string, options?: Partial<Speech.SpeechOptions>): void {
    const pack = getVoicePack(this.activePackId);

    try {
      Speech.stop();
      Speech.speak(text, {
        voice: this.selectedVoiceId ?? undefined,
        language: 'en-US',
        rate: pack.rate,
        pitch: pack.pitch,
        ...options,
      });
    } catch {
      // Speech synthesis isn't available on every platform/environment (notably headless or
      // sandboxed browsers). The game's visuals already communicate everything, so this is
      // safe to fail silently rather than interrupt play.
    }
  }

  /** Speaks a target/hint word slowly and clearly, for the reveal banner and the megaphone. */
  speakWord(word: string): void {
    const pack = getVoicePack(this.activePackId);
    this.speak(word, { rate: Math.max(MIN_RATE, pack.rate * WORD_RATE_FACTOR) });
  }

  /**
   * Speaks a random enthusiastic praise phrase from the active voice pack, never repeating the
   * immediately previous one twice in a row. Returns the phrase so the caller can also display it.
   */
  speakPraise(): string {
    const pack = getVoicePack(this.activePackId);
    const nextIndex = pickNextPraiseIndex(pack.praisePhrases.length, this.lastPraiseIndex);
    this.lastPraiseIndex = nextIndex;

    const phrase = pack.praisePhrases[nextIndex];
    this.speak(phrase);
    return phrase;
  }

  stop(): void {
    try {
      Speech.stop();
    } catch {
      // Nothing to clean up if the platform never started speaking in the first place.
    }
  }
}

// A single shared instance: voice detection only needs to run once per app launch, and
// "don't repeat the last praise phrase" only makes sense against one shared history.
export const speechService = new SpeechService();
