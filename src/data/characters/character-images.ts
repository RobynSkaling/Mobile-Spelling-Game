import { ImageSourcePropType } from 'react-native';
import { CharacterImageVariant } from './character-roster';

type CharacterImageMap = Partial<Record<CharacterImageVariant, ImageSourcePropType>>;

/**
 * One entry per character, mapping each available image variant to its `require()`d asset.
 *
 * React Native's bundler (Metro) needs every `require()` call to be a static, literal string —
 * it can't resolve a dynamically-built path like `require(`${id}-${variant}.png`)`. So this map
 * has to be filled in by hand as real artwork lands, one line per file, e.g.:
 *
 *   'mama-bear': {
 *     idle: require('../../assets/artwork/characters/mama-bear/mama-bear-idle.png'),
 *     happy: require('../../assets/artwork/characters/mama-bear/mama-bear-happy.png'),
 *   },
 *
 * No entries exist yet because no artwork has been delivered — `getCharacterImage` returning
 * `null` is the expected, normal state today. Consumers (the Character component) fall back to
 * the character's emoji glyph whenever a variant isn't registered, so the app stays fully
 * functional in the meantime and nothing needs to change at call sites once art does land.
 */
const CHARACTER_IMAGES: Record<string, CharacterImageMap> = {
  'mama-bear': {},
  'professor-owl': {},
  'silly-goose': {},
  'cheeky-monkey': {},
};

export function getCharacterImage(characterId: string, variant: CharacterImageVariant): ImageSourcePropType | null {
  return CHARACTER_IMAGES[characterId]?.[variant] ?? null;
}
