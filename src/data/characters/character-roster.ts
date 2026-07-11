export type CharacterRole = 'hero' | 'villain';

// Kept in sync with the folders under src/assets/artwork/characters/ — see the README there
// for the file naming convention (<slug>-<variant>.png).
export type CharacterImageVariant = 'idle' | 'happy' | 'icon' | 'defeated';

// Kept in sync with the folders under src/assets/audio/characters/ — see the README there
// for the file naming convention (<slug>-<variant>.mp3).
export type CharacterAudioVariant = 'greeting' | 'praise' | 'taunt' | 'defeated';

export type CharacterDefinition = {
  /** Matches the asset folder slug under src/assets/artwork/characters/<id>/ and src/assets/audio/characters/<id>/. */
  id: string;
  name: string;
  role: CharacterRole;
  tagline: string;
  /** Which image variants this character is expected to have. Villains add 'defeated'. */
  variants: CharacterImageVariant[];
  /** Which pre-recorded voice line variants this character is expected to have. */
  audioVariants: CharacterAudioVariant[];
};

const BASE_VARIANTS: CharacterImageVariant[] = ['idle', 'happy', 'icon'];
const VILLAIN_VARIANTS: CharacterImageVariant[] = [...BASE_VARIANTS, 'defeated'];

const HERO_AUDIO_VARIANTS: CharacterAudioVariant[] = ['greeting', 'praise'];
const VILLAIN_AUDIO_VARIANTS: CharacterAudioVariant[] = ['taunt', 'defeated'];

export const CHARACTER_ROSTER: CharacterDefinition[] = [
  {
    id: 'mama-bear',
    name: 'Mama Bear',
    role: 'hero',
    tagline: 'Warm, protective guardian of the honey and the game\'s host.',
    variants: BASE_VARIANTS,
    audioVariants: HERO_AUDIO_VARIANTS,
  },
  {
    id: 'professor-owl',
    name: 'Professor Owl',
    role: 'hero',
    tagline: 'Wise, slightly theatrical helper who shares hints along the way.',
    variants: BASE_VARIANTS,
    audioVariants: HERO_AUDIO_VARIANTS,
  },
  {
    id: 'silly-goose',
    name: 'Silly Goose',
    role: 'villain',
    tagline: 'Loud, dramatic troublemaker — gets carried off by the Bee Police when defeated.',
    variants: VILLAIN_VARIANTS,
    audioVariants: VILLAIN_AUDIO_VARIANTS,
  },
  {
    id: 'cheeky-monkey',
    name: 'Cheeky Monkey',
    role: 'villain',
    tagline: 'Rude, cheeky troublemaker — slides away on a banana peel when defeated.',
    variants: VILLAIN_VARIANTS,
    audioVariants: VILLAIN_AUDIO_VARIANTS,
  },
];

export function getCharacterById(id: string): CharacterDefinition | undefined {
  return CHARACTER_ROSTER.find((character) => character.id === id);
}

export function getCharactersByRole(role: CharacterRole): CharacterDefinition[] {
  return CHARACTER_ROSTER.filter((character) => character.role === role);
}

// TODO(assets): once PNGs land in src/assets/artwork/characters/<id>/, add a
// `CHARACTER_IMAGES: Record<string, Partial<Record<CharacterImageVariant, ImageSourcePropType>>>`
// map here built from `require()` calls, and a `getCharacterImage(id, variant)` helper.
//
// TODO(assets): once voice clips land in src/assets/audio/characters/<id>/, add a similar
// `CHARACTER_AUDIO: Record<string, Partial<Record<CharacterAudioVariant, number>>>` map (audio
// requires resolve to a numeric module id, same as images) and a `getCharacterAudio(id, variant)`
// helper.
//
// Nothing requires actual asset files yet — this module is safe to import today with no artwork
// or audio present.
