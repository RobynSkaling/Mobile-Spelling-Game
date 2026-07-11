import { CharacterAudioVariant } from './character-roster';

// Audio requires (like image requires) resolve to a Metro asset module id — a number at runtime.
type CharacterAudioMap = Partial<Record<CharacterAudioVariant, number>>;

/**
 * One entry per character, mapping each available voice-line variant to its `require()`d asset.
 * Same static-require constraint and same "fill in by hand as clips land" approach as
 * character-images.ts — see that file for the full explanation.
 *
 *   'mama-bear': {
 *     greeting: require('../../assets/audio/characters/mama-bear/mama-bear-greeting.mp3'),
 *   },
 *
 * No entries exist yet because no voice lines have been recorded — `getCharacterAudio` returning
 * `null` is the expected, normal state today.
 */
const CHARACTER_AUDIO: Record<string, CharacterAudioMap> = {
  'mama-bear': {},
  'professor-owl': {},
  'silly-goose': {},
  'cheeky-monkey': {},
};

export function getCharacterAudio(characterId: string, variant: CharacterAudioVariant): number | null {
  return CHARACTER_AUDIO[characterId]?.[variant] ?? null;
}
