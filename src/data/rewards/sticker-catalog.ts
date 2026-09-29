import { StickerId, StickerRarity } from '@/stores/daily-rewards-logic';

export type StickerDefinition = {
  id: StickerId;
  name: string;
  rarity: StickerRarity;
  caption: string;
};

/**
 * Content-as-data registry for the sticker album (architecture 27.3/27.9), mirroring
 * character-roster.ts's registry pattern. This is a PLACEHOLDER seed set only — names, rarities,
 * captions, count, and pacing are all open content/UX decisions (architecture 27.10), not a locked
 * final catalog. Epic 26's album screen renders whatever this list currently contains.
 */
export const STICKER_CATALOG: StickerDefinition[] = [
  {
    id: 'sir-buzzworth',
    name: 'Sir Buzzworth',
    rarity: 'common',
    caption: 'A dapper bee who insists on wearing a tiny top hat, even mid-flight.',
  },
  {
    id: 'duchess-honeydrop',
    name: 'Duchess Honeydrop',
    rarity: 'common',
    caption: "Never met a honey pot she didn't curtsy to first.",
  },
  {
    id: 'constable-stinger',
    name: 'Constable Stinger',
    rarity: 'common',
    caption: 'Patrols the hive on official Bee Police business (mostly napping).',
  },
  {
    id: 'professor-waggledance',
    name: 'Professor Waggledance',
    rarity: 'common',
    caption: 'Teaches the other bees the finer points of the waggle dance.',
  },
  {
    id: 'nectarine-the-bold',
    name: 'Nectarine the Bold',
    rarity: 'rare',
    caption: 'Flew all the way to the tallest sunflower and back before breakfast.',
  },
  {
    id: 'baron-von-beeswax',
    name: 'Baron von Beeswax',
    rarity: 'rare',
    caption: 'Claims his family invented the honeycomb. Nobody can prove otherwise.',
  },
  {
    id: 'the-golden-honey-pot',
    name: 'The Golden Honey Pot',
    rarity: 'milestone',
    caption: "A legendary pot said to hold a whole hive's worth of honey.",
  },
];

export function getStickerById(id: StickerId): StickerDefinition | undefined {
  return STICKER_CATALOG.find((sticker) => sticker.id === id);
}
