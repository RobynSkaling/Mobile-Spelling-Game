import { ImageSourcePropType } from 'react-native';
import { CharacterAnimationState } from './character-roster';

/**
 * Sprite sheet layout convention: a single horizontal strip, `frameCount` frames wide, each
 * exactly `frameWidth` x `frameHeight`. So the full sheet image is
 * `frameWidth * frameCount` px wide and `frameHeight` px tall. (Grid/multi-row sheets aren't
 * supported yet — revisit this if a delivered animation needs more frames than a single row
 * comfortably holds.)
 */
export type SpriteSheetAnimation = {
  sheet: ImageSourcePropType;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  /** Playback speed in frames per second. */
  fps: number;
  /** Whether the animation repeats indefinitely (e.g. Idle) or plays once and holds on the last
   *  frame (e.g. a one-shot Celebrating burst). */
  loop: boolean;
};

type CharacterAnimationMap = Partial<Record<CharacterAnimationState, SpriteSheetAnimation>>;

/**
 * One entry per character, mapping each available animation state to its sprite sheet metadata.
 * Same static-require constraint and "fill in by hand as sheets land" approach as
 * character-images.ts and character-audio.ts — see character-images.ts for the full explanation
 * of why these maps are hand-filled `require()` calls rather than built dynamically.
 *
 *   'mama-bear': {
 *     Celebrating: {
 *       sheet: require('../../assets/artwork/characters/mama-bear/sprites/mama-bear-celebrating-sheet.png'),
 *       frameCount: 6,
 *       frameWidth: 128,
 *       frameHeight: 128,
 *       fps: 12,
 *       loop: false,
 *     },
 *   },
 *
 * No entries exist yet because no sprite sheets have been delivered — `getCharacterAnimation`
 * returning `null` is the expected, normal state today. `<Character>` falls back to its static
 * pose image, and from there to its emoji glyph, whenever a state isn't registered here, so the
 * app stays fully functional in the meantime and nothing needs to change at call sites once
 * animated artwork does land.
 */
const CHARACTER_ANIMATIONS: Record<string, CharacterAnimationMap> = {
  'mama-bear': {},
  'professor-owl': {},
  'silly-goose': {},
  'cheeky-monkey': {},
};

export function getCharacterAnimation(
  characterId: string,
  state: CharacterAnimationState,
): SpriteSheetAnimation | null {
  return CHARACTER_ANIMATIONS[characterId]?.[state] ?? null;
}
