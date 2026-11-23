import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { STICKER_CATALOG, StickerDefinition } from '@/data/rewards/sticker-catalog';
import { buildAlbumSlots, countCollected } from './sticker-album';

const CATALOG: StickerDefinition[] = [
  { id: 'a', emoji: '🎩', name: 'A', rarity: 'common', caption: 'a' },
  { id: 'b', emoji: '👑', name: 'B', rarity: 'rare', caption: 'b' },
  { id: 'c', emoji: '🍯', name: 'C', rarity: 'milestone', caption: 'c' },
];

describe('buildAlbumSlots', () => {
  it('renders one slot per catalog entry, in catalog order, all silhouettes on day one', () => {
    const slots = buildAlbumSlots(CATALOG, {});
    assert.deepEqual(
      slots.map((slot) => slot.sticker.id),
      ['a', 'b', 'c'],
    );
    assert.ok(slots.every((slot) => slot.earned === null));
  });

  it('attaches the earned record (including duplicate count) to the matching slot', () => {
    const earned = { b: { id: 'b', firstEarnedOn: '2026-11-20', count: 2 } };
    const slots = buildAlbumSlots(CATALOG, earned);
    assert.equal(slots[0].earned, null);
    assert.deepEqual(slots[1].earned, earned.b);
  });

  it('skips earned ids that are no longer in the catalog rather than adding blank slots', () => {
    const slots = buildAlbumSlots(CATALOG, { retired: { id: 'retired', firstEarnedOn: '2026-11-20', count: 1 } });
    assert.equal(slots.length, CATALOG.length);
  });

  it('works against the real seeded catalog', () => {
    assert.equal(buildAlbumSlots(STICKER_CATALOG, {}).length, STICKER_CATALOG.length);
  });
});

describe('countCollected', () => {
  it('counts earned slots once each, regardless of duplicate count', () => {
    const slots = buildAlbumSlots(CATALOG, {
      a: { id: 'a', firstEarnedOn: '2026-11-20', count: 3 },
      c: { id: 'c', firstEarnedOn: '2026-11-21', count: 1 },
    });
    assert.equal(countCollected(slots), 2);
  });
});
