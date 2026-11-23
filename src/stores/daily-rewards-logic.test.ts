import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCompletedSession,
  DailyStreakState,
  dayGap,
  dailyRewardsKey,
  getStreakStatus,
  localDayKey,
  toDayKey,
} from './daily-rewards-logic';

describe('toDayKey', () => {
  it('renders a UTC timestamp with zero offset as its own calendar day', () => {
    const nowMs = Date.parse('2026-09-28T12:00:00.000Z');
    assert.equal(toDayKey(nowMs, 0), '2026-09-28');
  });

  it('rolls a late-evening local time forward across the UTC date line correctly', () => {
    // 11pm in a UTC+10 zone on Sep 28 local is already Sep 28 13:00 UTC — still the same local day.
    const nowMs = Date.parse('2026-09-28T13:00:00.000Z');
    assert.equal(toDayKey(nowMs, 600), '2026-09-28');
  });

  it('a negative (west-of-UTC) offset can roll the local day back a day from the UTC date', () => {
    // 9pm Sep 27 in UTC-5 (EST) is 2am Sep 28 UTC.
    const nowMs = Date.parse('2026-09-28T02:00:00.000Z');
    assert.equal(toDayKey(nowMs, -300), '2026-09-27');
  });
});

describe('dayGap', () => {
  it('is 0 for the same day', () => {
    assert.equal(dayGap('2026-09-28', '2026-09-28'), 0);
  });

  it('is 1 for consecutive days', () => {
    assert.equal(dayGap('2026-09-28', '2026-09-29'), 1);
  });

  it('is negative when `to` is before `from`', () => {
    assert.equal(dayGap('2026-09-28', '2026-09-27'), -1);
  });

  it('counts whole calendar days across a DST fall-back boundary correctly', () => {
    // Calendar-day comparison must not be fooled by a 25-hour local day.
    assert.equal(dayGap('2026-11-01', '2026-11-02'), 1);
  });
});

function freshStreak(overrides: Partial<DailyStreakState> = {}): DailyStreakState {
  return { current: 0, longest: 0, lastPlayedDay: null, graceRemaining: 1, ...overrides };
}

describe('applyCompletedSession', () => {
  it('starts a fresh streak at 1 on the very first recorded play', () => {
    const outcome = applyCompletedSession(freshStreak(), '2026-09-28', { graceDays: 1 });
    assert.equal(outcome.qualifiesToday, true);
    assert.deepEqual(outcome.streak, {
      current: 1,
      longest: 1,
      lastPlayedDay: '2026-09-28',
      graceRemaining: 1,
    });
  });

  it('a same-day replay is a no-op', () => {
    const streak = freshStreak({ current: 3, longest: 5, lastPlayedDay: '2026-09-28', graceRemaining: 1 });
    const outcome = applyCompletedSession(streak, '2026-09-28', { graceDays: 1 });
    assert.equal(outcome.qualifiesToday, false);
    assert.deepEqual(outcome.streak, streak);
  });

  it('a consecutive day increments current and leaves grace untouched', () => {
    const streak = freshStreak({ current: 3, longest: 5, lastPlayedDay: '2026-09-28', graceRemaining: 1 });
    const outcome = applyCompletedSession(streak, '2026-09-29', { graceDays: 1 });
    assert.equal(outcome.qualifiesToday, true);
    assert.deepEqual(outcome.streak, {
      current: 4,
      longest: 5,
      lastPlayedDay: '2026-09-29',
      graceRemaining: 1,
    });
  });

  it('updates longest when current surpasses it', () => {
    const streak = freshStreak({ current: 5, longest: 5, lastPlayedDay: '2026-09-28', graceRemaining: 1 });
    const outcome = applyCompletedSession(streak, '2026-09-29', { graceDays: 1 });
    assert.equal(outcome.streak.current, 6);
    assert.equal(outcome.streak.longest, 6);
  });

  it('a gap within grace consumes a grace day and keeps current (the resting-bee state)', () => {
    const streak = freshStreak({ current: 3, longest: 5, lastPlayedDay: '2026-09-28', graceRemaining: 1 });
    // One missed day (Sep 29) before playing again on Sep 30.
    const outcome = applyCompletedSession(streak, '2026-09-30', { graceDays: 1 });
    assert.equal(outcome.qualifiesToday, true);
    assert.deepEqual(outcome.streak, {
      current: 3,
      longest: 5,
      lastPlayedDay: '2026-09-30',
      graceRemaining: 0,
    });
  });

  it('a gap past grace lapses to a fresh streak, resetting current to 1 rather than 0', () => {
    const streak = freshStreak({ current: 3, longest: 5, lastPlayedDay: '2026-09-28', graceRemaining: 1 });
    // Two missed days (Sep 29, Sep 30) exceeds the 1-day grace allowance.
    const outcome = applyCompletedSession(streak, '2026-10-01', { graceDays: 1 });
    assert.equal(outcome.qualifiesToday, true);
    assert.deepEqual(outcome.streak, {
      current: 1,
      longest: 5,
      lastPlayedDay: '2026-10-01',
      graceRemaining: 1,
    });
  });

  it('a clock moved backward clamps to a no-op rather than incrementing or resetting', () => {
    const streak = freshStreak({ current: 3, longest: 5, lastPlayedDay: '2026-09-28', graceRemaining: 1 });
    const outcome = applyCompletedSession(streak, '2026-09-27', { graceDays: 1 });
    assert.equal(outcome.qualifiesToday, false);
    assert.deepEqual(outcome.streak, streak);
  });
});

describe('getStreakStatus', () => {
  const played = (overrides: Partial<DailyStreakState> = {}) =>
    freshStreak({ current: 3, longest: 5, lastPlayedDay: '2026-09-28', graceRemaining: 1, ...overrides });

  it('is new before any play has ever been recorded', () => {
    assert.equal(getStreakStatus(freshStreak(), '2026-09-28'), 'new');
  });

  it('is active on the day of the last play', () => {
    assert.equal(getStreakStatus(played(), '2026-09-28'), 'active');
  });

  it('is active the day after the last play (streak alive, not yet played today)', () => {
    assert.equal(getStreakStatus(played(), '2026-09-29'), 'active');
  });

  it('is resting when the missed days are all covered by grace', () => {
    assert.equal(getStreakStatus(played(), '2026-09-30'), 'resting');
  });

  it('is lapsed when the missed days exceed grace', () => {
    assert.equal(getStreakStatus(played(), '2026-10-01'), 'lapsed');
  });

  it('is lapsed after a single missed day once grace has already been spent', () => {
    assert.equal(getStreakStatus(played({ graceRemaining: 0 }), '2026-09-30'), 'lapsed');
  });

  it('reads a clock moved backward as active, matching applyCompletedSession\'s preserve-the-streak clamp', () => {
    assert.equal(getStreakStatus(played(), '2026-09-20'), 'active');
  });

  it('agrees with applyCompletedSession: resting keeps current on the next play, lapsed restarts it', () => {
    const tuning = { graceDays: 1 };
    assert.equal(applyCompletedSession(played(), '2026-09-30', tuning).streak.current, 3);
    assert.equal(applyCompletedSession(played(), '2026-10-01', tuning).streak.current, 1);
  });
});

describe('localDayKey', () => {
  it("matches toDayKey with the host's own (sign-flipped) offset", () => {
    const nowMs = Date.parse('2026-09-28T23:30:00.000Z');
    assert.equal(localDayKey(nowMs), toDayKey(nowMs, -new Date(nowMs).getTimezoneOffset()));
  });
});

describe('dailyRewardsKey', () => {
  it('returns the flat per-device key when no profile id is given', () => {
    assert.equal(dailyRewardsKey(), 'dailyRewards.v1');
  });

  it('returns a profile-scoped key when a profile id is given', () => {
    assert.equal(dailyRewardsKey('kid-1'), 'dailyRewards.v1.profile.kid-1');
  });
});
