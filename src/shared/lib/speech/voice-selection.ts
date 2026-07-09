export type VoiceCandidate = {
  identifier: string;
  name: string;
  quality: string;
  language: string;
};

// Locales checked in order of preference when quality is tied — these are the ones every
// platform's TTS engine supports well, so they're the safest bet for a clear, natural voice.
const PREFERRED_LOCALES = ['en-us', 'en-gb', 'en-au', 'en-nz', 'en-ie', 'en-za'];

function qualityScore(voice: VoiceCandidate): number {
  const quality = (voice.quality ?? '').toLowerCase();
  if (quality.includes('enhanced') || quality.includes('premium') || quality.includes('neural')) {
    return 2;
  }
  return 1;
}

function localeScore(voice: VoiceCandidate): number {
  const language = (voice.language ?? '').toLowerCase();
  const index = PREFERRED_LOCALES.indexOf(language);
  return index === -1 ? 0 : PREFERRED_LOCALES.length - index;
}

/**
 * Picks the best-sounding English voice from everything the device reports. "Best" means:
 * an enhanced/premium/neural voice over a default one, then a well-supported locale
 * (en-US/en-GB/...) over a less common one. Returns null if no English voice is available at all,
 * in which case the caller should fall back to the platform's own default voice.
 */
export function pickBestEnglishVoice(voices: VoiceCandidate[]): VoiceCandidate | null {
  const englishVoices = voices.filter((voice) => (voice.language ?? '').toLowerCase().startsWith('en'));

  if (englishVoices.length === 0) {
    return null;
  }

  const sorted = [...englishVoices].sort((a, b) => {
    const qualityDiff = qualityScore(b) - qualityScore(a);
    if (qualityDiff !== 0) {
      return qualityDiff;
    }
    return localeScore(b) - localeScore(a);
  });

  return sorted[0];
}
