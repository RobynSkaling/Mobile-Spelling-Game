export type CharacterRole = 'hero' | 'villain';

// A character's in-universe scale, independent of however big any one screen chooses to render
// them. Used as the Character component's default size preset unless a call site overrides it.
export type CharacterRelativeSize = 'small' | 'medium' | 'large';

// Kept in sync with the folders under src/assets/artwork/characters/ — see the README there
// for the file naming convention (<slug>-<variant>.png).
export type CharacterImageVariant = 'idle' | 'happy' | 'icon' | 'defeated';

// Kept in sync with the folders under src/assets/audio/characters/ — see the README there
// for the file naming convention (<slug>-<variant>.mp3).
export type CharacterAudioVariant = 'greeting' | 'praise' | 'taunt' | 'defeated';

// Which sprite-sheet animation is currently playing for a character, set by gameplay/UI code in
// response to events (see architecture doc Section 25.5) rather than a specific animation file
// being referenced directly. 'Defeated', 'BeingNaughty', and 'Challenging' are villain-only, same
// split as CharacterImageVariant's 'defeated'.
export type CharacterAnimationState =
  | 'Idle'
  | 'Talking'
  | 'Poked'
  | 'Celebrating'
  | 'Defeated'
  | 'BeingNaughty'
  | 'Challenging';

export type CharacterDefinition = {
  /** Matches the asset folder slug under src/assets/artwork/characters/<id>/ and src/assets/audio/characters/<id>/. */
  id: string;
  name: string;
  role: CharacterRole;
  tagline: string;
  /** In-universe scale — see CharacterRelativeSize. */
  relativeSize: CharacterRelativeSize;
  /** A palette color (from the app's Retro Arcade theme) associated with this character — used
   *  for badge backgrounds, name-tag tinting, etc. */
  accentColor: string;
  /** Single-glyph fallback shown wherever no artwork has been registered for a variant yet. */
  emoji: string;
  /** Which image variants this character is expected to have. Villains add 'defeated'. */
  variants: CharacterImageVariant[];
  /** Which pre-recorded voice line variants this character is expected to have. */
  audioVariants: CharacterAudioVariant[];
  /** Which sprite-sheet animation states this character is expected to have. Villains add
   *  'Defeated', 'BeingNaughty', and 'Challenging'. */
  animationStates: CharacterAnimationState[];
};

const BASE_VARIANTS: CharacterImageVariant[] = ['idle', 'happy', 'icon'];
const VILLAIN_VARIANTS: CharacterImageVariant[] = [...BASE_VARIANTS, 'defeated'];

const HERO_AUDIO_VARIANTS: CharacterAudioVariant[] = ['greeting', 'praise'];
const VILLAIN_AUDIO_VARIANTS: CharacterAudioVariant[] = ['taunt', 'defeated'];

const BASE_ANIMATION_STATES: CharacterAnimationState[] = ['Idle', 'Talking', 'Poked', 'Celebrating'];
const VILLAIN_ANIMATION_STATES: CharacterAnimationState[] = [
  ...BASE_ANIMATION_STATES,
  'Defeated',
  'BeingNaughty',
  'Challenging',
];

export const CHARACTER_ROSTER: CharacterDefinition[] = [
  {
    id: 'mama-bear',
    name: 'Mama Bear',
    role: 'hero',
    tagline: 'Warm, protective guardian of the honey and the game\'s host.',
    relativeSize: 'large',
    accentColor: '#FFD700', // gold — honey/reward association
    emoji: '🐻',
    variants: BASE_VARIANTS,
    audioVariants: HERO_AUDIO_VARIANTS,
    animationStates: BASE_ANIMATION_STATES,
  },
  {
    id: 'professor-owl',
    name: 'Professor Owl',
    role: 'hero',
    tagline: 'Wise, slightly theatrical helper who shares hints along the way.',
    relativeSize: 'medium',
    accentColor: '#8A2BE2', // blue violet — cool, wise tone
    emoji: '🦉',
    variants: BASE_VARIANTS,
    audioVariants: HERO_AUDIO_VARIANTS,
    animationStates: BASE_ANIMATION_STATES,
  },
  {
    id: 'silly-goose',
    name: 'Silly Goose',
    role: 'villain',
    tagline: 'Loud, dramatic troublemaker — gets carried off by the Bee Police when defeated.',
    relativeSize: 'medium',
    accentColor: '#FF1493', // hot pink — loud and dramatic
    emoji: '🪿',
    variants: VILLAIN_VARIANTS,
    audioVariants: VILLAIN_AUDIO_VARIANTS,
    animationStates: VILLAIN_ANIMATION_STATES,
  },
  {
    id: 'cheeky-monkey',
    name: 'Cheeky Monkey',
    role: 'villain',
    tagline: 'Rude, cheeky troublemaker — slides away on a banana peel when defeated.',
    relativeSize: 'small',
    accentColor: '#FF6347', // tomato — mischief/watch-out tone
    emoji: '🐒',
    variants: VILLAIN_VARIANTS,
    audioVariants: VILLAIN_AUDIO_VARIANTS,
    animationStates: VILLAIN_ANIMATION_STATES,
  },
];

export function getCharacterById(id: string): CharacterDefinition | undefined {
  return CHARACTER_ROSTER.find((character) => character.id === id);
}

export function getCharactersByRole(role: CharacterRole): CharacterDefinition[] {
  return CHARACTER_ROSTER.filter((character) => character.role === role);
}

// Image, audio, and animation lookups live in their own sibling modules (character-images.ts,
// character-audio.ts, character-animations.ts) rather than here, since they need react-native's
// ImageSourcePropType and will eventually hold real require() calls — this file stays a plain,
// platform-agnostic data module that's safe to import (and unit test) anywhere.
