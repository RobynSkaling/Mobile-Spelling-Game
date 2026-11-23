import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { StreakStatus } from '@/stores/daily-rewards-logic';
import {
  FIRST_STREAK_CAPTION,
  FRESH_START_CAPTION,
  getAlbumAccessibilityLabel,
  getAlbumStreakLabel,
  getStreakBanner,
  RESTING_CAPTION,
} from './streak-display';

const ALL_STATUSES: StreakStatus[] = ['new', 'active', 'resting', 'lapsed'];

describe('getAlbumStreakLabel', () => {
  it('shows the day count for a live streak, active or resting', () => {
    assert.equal(getAlbumStreakLabel('active', 5), 'x5');
    assert.equal(getAlbumStreakLabel('resting', 5), 'x5');
  });

  it('shows nothing, not the stale count, once a streak has lapsed', () => {
    assert.equal(getAlbumStreakLabel('lapsed', 12), null);
  });

  it('shows nothing for a brand-new player', () => {
    assert.equal(getAlbumStreakLabel('new', 0), null);
  });
});

describe('getStreakBanner', () => {
  it('celebrates the day count on an active streak', () => {
    assert.equal(getStreakBanner('active', 5).headline, '🔥 5-Day Streak!');
  });

  it('uses the resting-bee nap copy on a grace day and keeps the count', () => {
    const banner = getStreakBanner('resting', 5);
    assert.equal(banner.caption, RESTING_CAPTION);
    assert.match(banner.headline, /5-Day Streak/);
  });

  it('uses the soft fresh-start copy on a lapse, never mentioning the old count', () => {
    const banner = getStreakBanner('lapsed', 12);
    assert.equal(banner.caption, FRESH_START_CAPTION);
    assert.doesNotMatch(banner.headline, /12/);
  });

  it('invites a brand-new player to earn a first sticker', () => {
    assert.equal(getStreakBanner('new', 0).caption, FIRST_STREAK_CAPTION);
  });
});

describe('no punishing "0" anywhere (UX Step 22)', () => {
  it('never renders a zero count, whatever the stored current is', () => {
    for (const status of ALL_STATUSES) {
      // `new`/`lapsed` may carry a stored 0 or a stale number; neither may surface as "0".
      const current = status === 'new' || status === 'lapsed' ? 0 : 1;
      const banner = getStreakBanner(status, current);
      const texts = [getAlbumStreakLabel(status, current) ?? '', getAlbumAccessibilityLabel(status, current), banner.headline, banner.caption ?? ''];
      for (const text of texts) {
        assert.doesNotMatch(text, /\b0\b/, `${status}: "${text}"`);
      }
    }
  });
});

describe('getAlbumAccessibilityLabel', () => {
  it('always names the Sticker Album, never "Start!"', () => {
    for (const status of ALL_STATUSES) {
      const label = getAlbumAccessibilityLabel(status, 3);
      assert.match(label, /^Sticker Album\./);
      assert.doesNotMatch(label, /Start/);
    }
  });

  it('adds the streak on an active streak', () => {
    assert.equal(getAlbumAccessibilityLabel('active', 5), 'Sticker Album. 5-Day Streak.');
  });

  it('says the streak is resting on a grace day', () => {
    assert.equal(getAlbumAccessibilityLabel('resting', 5), 'Sticker Album. 5-Day Streak, resting today.');
  });

  it('is just the name for a new or lapsed streak', () => {
    assert.equal(getAlbumAccessibilityLabel('new', 0), 'Sticker Album.');
    assert.equal(getAlbumAccessibilityLabel('lapsed', 12), 'Sticker Album.');
  });
});
