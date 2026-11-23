import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { StreakStatus } from '@/stores/daily-rewards-logic';
import {
  FIRST_STREAK_CAPTION,
  FRESH_START_CAPTION,
  getBadgeAccessibilityLabel,
  getBadgeLabel,
  getStreakBanner,
  RESTING_CAPTION,
} from './streak-display';

const ALL_STATUSES: StreakStatus[] = ['new', 'active', 'resting', 'lapsed'];

describe('getBadgeLabel', () => {
  it('shows the day count for a live streak, active or resting', () => {
    assert.equal(getBadgeLabel('active', 5), 'x5');
    assert.equal(getBadgeLabel('resting', 5), 'x5');
  });

  it('shows an invitation, not the stale count, once a streak has lapsed', () => {
    assert.equal(getBadgeLabel('lapsed', 12), 'Start!');
  });

  it('shows an invitation for a brand-new player', () => {
    assert.equal(getBadgeLabel('new', 0), 'Start!');
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
      const texts = [getBadgeLabel(status, current), getBadgeAccessibilityLabel(status, current), banner.headline, banner.caption ?? ''];
      for (const text of texts) {
        assert.doesNotMatch(text, /\b0\b/, `${status}: "${text}"`);
      }
    }
  });
});

describe('getBadgeAccessibilityLabel', () => {
  it('tells a screen-reader user where the badge goes in every state', () => {
    for (const status of ALL_STATUSES) {
      assert.match(getBadgeAccessibilityLabel(status, 3), /sticker book/);
    }
  });

  it('says the streak is resting on a grace day', () => {
    assert.match(getBadgeAccessibilityLabel('resting', 3), /resting/);
  });
});
