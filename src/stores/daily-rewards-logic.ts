/**
 * Pure day-boundary and streak logic for the daily-rewards system (architecture doc Section 27).
 * A sibling to daily-rewards-store.ts — carries no AsyncStorage/Zustand dependency so it stays
 * cheap to unit-test, the same "pure logic beside the store that uses it" split as
 * villain-pool.ts / session-store.ts.
 */

export type DayKey = string; // local calendar day, 'YYYY-MM-DD'

export type StickerId = string;
export type StickerRarity = 'common' | 'rare' | 'milestone';

export type EarnedSticker = {
  id: StickerId;
  firstEarnedOn: DayKey;
  /** Duplicates. >1 supports the "twin bees" duplicate gag (roadmap Epic 17); the album shows the
   *  sticker once, a small badge notes the count. */
  count: number;
};

export type DailyStreakState = {
  current: number;
  longest: number;
  /** The last local day a qualifying (completed) session was recorded. Null before first play. */
  lastPlayedDay: DayKey | null;
  /** Grace/freeze days banked before the streak actually lapses (UX Step 22's "resting bee").
   *  Only ever set to full on a fresh streak (first-ever play, or a post-lapse restart) and spent
   *  down as missed days are covered — it does not silently refill mid-streak (see
   *  applyCompletedSession below), so it stays a genuinely finite buffer rather than an
   *  exploitable "always full" loophole. Exact length is open tuning (architecture 27.9/27.10). */
  graceRemaining: number;
};

export type StickerAlbumState = {
  /** Keyed by StickerId so re-earning is an increment, not a duplicate row. */
  earned: Record<StickerId, EarnedSticker>;
};

export type DailyRewardsState = {
  streak: DailyStreakState;
  album: StickerAlbumState;
  /** For future AsyncStorage migrations, mirroring progress-store's implicit shape versioning. */
  schemaVersion: number;
};

/** Placeholder grace-day allowance — the real number is product/UX tuning (architecture 27.9/27.10),
 *  not decided by this epic. */
export const DEFAULT_GRACE_DAYS = 1;

/** Device-local calendar day. Local (not UTC) is correct: a child playing at 9pm local should count
 *  as "today," which UTC bucketing would sometimes roll into tomorrow (architecture 27.5).
 *
 *  `tzOffsetMinutes` uses the conventional UTC-offset sign (local = UTC + tzOffsetMinutes, e.g. EST
 *  is -300, JST is +540) — the *opposite* sign of `Date.prototype.getTimezoneOffset()`, which
 *  returns minutes local time is BEHIND UTC as positive. Callers using `getTimezoneOffset()` must
 *  negate it first (see daily-rewards-store.ts's `recordCompletedPlay`).
 *
 *  Shifting by the offset and then reading UTC fields (rather than constructing a Date in the host's
 *  own timezone) keeps this pure and testable independent of the machine's actual local timezone. */
export function toDayKey(nowMs: number, tzOffsetMinutes: number): DayKey {
  const localMs = nowMs + tzOffsetMinutes * 60_000;
  const local = new Date(localMs);
  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** The device's own local calendar day for `nowMs`. `Date.prototype.getTimezoneOffset()` returns
 *  minutes local time is BEHIND UTC (positive west of UTC, e.g. +300 for EST), so the sign is
 *  flipped here to match toDayKey's conventional UTC-offset sign. The one place the host timezone
 *  is read — the store (recording a play) and the rewards UI (displaying status) both go through
 *  this, so they can never disagree about what "today" is. */
export function localDayKey(nowMs: number): DayKey {
  return toDayKey(nowMs, -new Date(nowMs).getTimezoneOffset());
}

/** Whole-calendar-day gap between two day keys (0 = same day, 1 = consecutive, negative = `to` is
 *  before `from`). Compares calendar days as UTC midnight timestamps, NOT raw ms subtraction of the
 *  original `nowMs` values, so DST and offset shifts can't miscount (architecture 27.5). */
export function dayGap(from: DayKey, to: DayKey): number {
  const fromMs = Date.parse(`${from}T00:00:00.000Z`);
  const toMs = Date.parse(`${to}T00:00:00.000Z`);
  return Math.round((toMs - fromMs) / 86_400_000);
}

export type StreakOutcome = { streak: DailyStreakState; qualifiesToday: boolean };

/** Pure. Applies a completed-session-today event to the streak, honoring grace days. Defensive
 *  against a clock moved BACKWARD (to earlier than lastPlayedDay): treat as a no-op rather than
 *  incrementing or punitively resetting — err toward preserving the streak, which is both the
 *  robust AND the non-punishing choice (UX Step 22, architecture 27.5). */
export function applyCompletedSession(
  streak: DailyStreakState,
  today: DayKey,
  tuning: { graceDays: number },
): StreakOutcome {
  const freshStreak = (): DailyStreakState => ({
    current: 1,
    longest: Math.max(streak.longest, 1),
    lastPlayedDay: today,
    graceRemaining: tuning.graceDays,
  });

  if (streak.lastPlayedDay === null) {
    return { streak: freshStreak(), qualifiesToday: true };
  }

  const gap = dayGap(streak.lastPlayedDay, today);

  // Same-day replay, or a clock moved backward relative to the last recorded play day — clamp to a
  // no-op rather than incrementing (double-count) or resetting (punishing a clock glitch).
  if (gap <= 0) {
    return { streak, qualifiesToday: false };
  }

  if (gap === 1) {
    const current = streak.current + 1;
    return {
      streak: {
        current,
        longest: Math.max(streak.longest, current),
        lastPlayedDay: today,
        graceRemaining: streak.graceRemaining,
      },
      qualifiesToday: true,
    };
  }

  // gap > 1: one or more calendar days were missed since the last play. Each missed day costs one
  // banked grace day (the "resting bee" state) — grace is not replenished mid-streak, only on a
  // fresh streak (above/below), so it stays a finite buffer rather than an unlimited freeze.
  const missedDays = gap - 1;
  if (missedDays <= streak.graceRemaining) {
    return {
      streak: {
        current: streak.current,
        longest: streak.longest,
        lastPlayedDay: today,
        graceRemaining: streak.graceRemaining - missedDays,
      },
      qualifiesToday: true,
    };
  }

  // Past grace: the streak lapses, but restarts at 1 immediately rather than displaying a
  // punishing "0" — the "let's start a fresh streak together" tone (UX Step 22).
  return { streak: freshStreak(), qualifiesToday: true };
}

/**
 * How the streak should *read* today, before any play has been recorded for today (UX Steps 20-22):
 * - `new`     — never played; nothing to show yet but an invitation.
 * - `active`  — played today or yesterday; the streak is alive.
 * - `resting` — one or more days missed, but all still covered by banked grace days (the
 *               "resting bee"). The next completed play keeps `current`.
 * - `lapsed`  — missed more days than grace covers. The stored `current` is stale; the next play
 *               restarts at 1, so the UI must show a fresh-start invitation, never a "0" or the
 *               stale number (UX Step 22).
 *
 * Pure, and deliberately mirrors applyCompletedSession's gap/grace rules so the badge can never
 * promise a streak that the next play would actually reset (or vice versa). A clock moved backward
 * (gap < 0) reads as `active`, matching applyCompletedSession's "err toward preserving" clamp.
 */
export type StreakStatus = 'new' | 'active' | 'resting' | 'lapsed';

export function getStreakStatus(streak: DailyStreakState, today: DayKey): StreakStatus {
  if (streak.lastPlayedDay === null) {
    return 'new';
  }

  const gap = dayGap(streak.lastPlayedDay, today);
  if (gap <= 1) {
    return 'active';
  }

  const missedDays = gap - 1;
  return missedDays <= streak.graceRemaining ? 'resting' : 'lapsed';
}

/**
 * All daily-rewards AsyncStorage keys go through here. Today `profileId` is undefined and the data
 * is per-device (consistent with progress-store's existing flat keys). When real multi-profile
 * support lands (roadmap Epic 1), pass the active profile id and the same code becomes per-child —
 * the seam is here so that change is additive, not a rewrite (architecture 27.2).
 */
export function dailyRewardsKey(profileId?: string): string {
  return profileId ? `dailyRewards.v1.profile.${profileId}` : 'dailyRewards.v1';
}
