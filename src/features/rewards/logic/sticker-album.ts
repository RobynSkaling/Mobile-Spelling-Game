import { StickerDefinition } from '@/data/rewards/sticker-catalog';
import { EarnedSticker, StickerId } from '@/stores/daily-rewards-logic';

export type AlbumSlot = {
  sticker: StickerDefinition;
  /** Null for a not-yet-earned sticker — rendered as a gray silhouette in the same hex shape. */
  earned: EarnedSticker | null;
};

/**
 * One slot per catalog entry, in catalog order, so the whole collection's shape is visible from day
 * one (UX Step 21's silhouette pattern). Driven by the catalog, not by a fixed count — the album is
 * not designed around a final sticker number (architecture 27.10). An earned id that's no longer in
 * the catalog is skipped rather than rendered as a blank slot.
 */
export function buildAlbumSlots(
  catalog: StickerDefinition[],
  earned: Record<StickerId, EarnedSticker>,
): AlbumSlot[] {
  return catalog.map((sticker) => ({ sticker, earned: earned[sticker.id] ?? null }));
}

export function countCollected(slots: AlbumSlot[]): number {
  return slots.filter((slot) => slot.earned !== null).length;
}
