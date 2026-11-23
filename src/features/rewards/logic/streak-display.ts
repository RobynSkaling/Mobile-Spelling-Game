import { StreakStatus } from '@/stores/daily-rewards-logic';

/**
 * Child-facing copy for the Home streak badge and the Sticker Album's streak banner (UX Steps
 * 20-22). Pure, so the "never show a punishing 0" rule is unit-tested rather than left to whoever
 * next edits a screen.
 */

export const RESTING_CAPTION = "Bee's taking a little nap — come play today to wake the streak back up!";
export const FRESH_START_CAPTION = "Let's start a fresh streak together!";
export const FIRST_STREAK_CAPTION = 'Finish a word today to start your streak and earn your first sticker!';

/** Short text inside the Home badge, next to the bee. A `lapsed` streak's stored `current` is stale
 *  (the next play restarts at 1), so it shows the same invitation as a brand-new player rather than
 *  the old number or a drop to zero. */
export function getBadgeLabel(status: StreakStatus, current: number): string {
  switch (status) {
    case 'active':
    case 'resting':
      return `x${current}`;
    case 'new':
    case 'lapsed':
      return 'Start!';
  }
}

/** Screen-reader label for the badge — a tappable control, so it says where it goes. */
export function getBadgeAccessibilityLabel(status: StreakStatus, current: number): string {
  const destination = 'Opens your sticker book.';
  switch (status) {
    case 'active':
      return `${formatDayStreak(current)}. ${destination}`;
    case 'resting':
      return `${formatDayStreak(current)}, resting today. ${destination}`;
    case 'new':
    case 'lapsed':
      return `Start a streak today. ${destination}`;
  }
}

export type StreakBanner = { headline: string; caption: string | null };

/** The album's top banner. Only `active`/`resting` ever mention a day count; neither path can
 *  produce "0" (a recorded streak is always >= 1, and the other two states show no number). */
export function getStreakBanner(status: StreakStatus, current: number): StreakBanner {
  switch (status) {
    case 'active':
      return { headline: `🔥 ${formatDayStreak(current)}!`, caption: 'Keep buzzing, superstar!' };
    case 'resting':
      return { headline: `💤 ${formatDayStreak(current)}`, caption: RESTING_CAPTION };
    case 'lapsed':
      return { headline: '🌼 New day, new streak!', caption: FRESH_START_CAPTION };
    case 'new':
      return { headline: '🐝 Your sticker book', caption: FIRST_STREAK_CAPTION };
  }
}

function formatDayStreak(current: number): string {
  return `${current}-Day Streak`;
}
