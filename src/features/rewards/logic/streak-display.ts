import { StreakStatus } from '@/stores/daily-rewards-logic';

/**
 * Child-facing copy for the Home Sticker Album button and the Sticker Album's streak banner (UX Steps
 * 20-22). Pure, so the "never show a punishing 0" rule is unit-tested rather than left to whoever
 * next edits a screen.
 */

export const ALBUM_BUTTON_LABEL = 'Sticker Album';
export const RESTING_CAPTION = "Bee's taking a little nap — come play today to wake the streak back up!";
export const FRESH_START_CAPTION = "Let's start a fresh streak together!";
export const FIRST_STREAK_CAPTION = 'Finish a word today to start your streak and earn your first sticker!';

/** Short streak text shown beside the bee on the Home "Sticker Album" button, or `null` when the
 *  button should show no streak at all. A `lapsed` streak's stored `current` is stale (the next play
 *  restarts at 1), so it shows nothing extra, same as a brand-new player, rather than the old number
 *  or a drop to zero. */
export function getAlbumStreakLabel(status: StreakStatus, current: number): string | null {
  switch (status) {
    case 'active':
    case 'resting':
      return `x${current}`;
    case 'new':
    case 'lapsed':
      return null;
  }
}

/** Screen-reader label for the Sticker Album button: always names the destination, then adds the
 *  streak when there is one. */
export function getAlbumAccessibilityLabel(status: StreakStatus, current: number): string {
  switch (status) {
    case 'active':
      return `${ALBUM_BUTTON_LABEL}. ${formatDayStreak(current)}.`;
    case 'resting':
      return `${ALBUM_BUTTON_LABEL}. ${formatDayStreak(current)}, resting today.`;
    case 'new':
    case 'lapsed':
      return `${ALBUM_BUTTON_LABEL}.`;
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
