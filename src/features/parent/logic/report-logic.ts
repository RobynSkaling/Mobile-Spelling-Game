/**
 * Pure helpers behind the per-child Parent View reports (Epic 32). Everything takes raw stored
 * values plus an injectable "now", so it is unit-tested without stores or storage.
 */
import { dayGap, DailyRewardsState, DailyStreakState, getStreakStatus, toDayKey } from '@/stores/daily-rewards-logic';
import type { FinalTestResult } from '@/stores/final-test-results-logic';
import type { SessionRecord, WordStat } from '@/stores/progress-store';
import type { GameId } from '@/features/play/logic/games';
import { FRESH_START_CAPTION, RESTING_CAPTION } from '@/features/rewards/logic/streak-display';

export const WEEK_DAYS = 7;

/** One child's stored data, as read (never written) for a report. */
export type ChildReportData = {
  sessions: SessionRecord[];
  wordStats: Record<string, WordStat>;
  rewards: DailyRewardsState | null;
  finalTests: FinalTestResult[];
};

function parseJson<T>(raw: string | null | undefined, isValid: (value: unknown) => boolean, fallback: T): T {
  if (!raw) {
    return fallback;
  }
  try {
    const value: unknown = JSON.parse(raw);
    return isValid(value) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}

const isArray = (value: unknown) => Array.isArray(value);
const isObject = (value: unknown) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isRewards = (value: unknown) =>
  isObject(value) &&
  isObject((value as DailyRewardsState).streak) &&
  isObject((value as DailyRewardsState).album) &&
  isObject((value as DailyRewardsState).album.earned);

/** Turns the raw stored strings into report data; missing or corrupt values become empty. */
export function parseChildReportData(raw: {
  sessions?: string | null;
  wordStats?: string | null;
  rewards?: string | null;
  finalTests?: string | null;
}): ChildReportData {
  return {
    sessions: parseJson<SessionRecord[]>(raw.sessions, isArray, []),
    wordStats: parseJson<Record<string, WordStat>>(raw.wordStats, isObject, {}),
    rewards: parseJson<DailyRewardsState | null>(raw.rewards, isRewards, null),
    finalTests: parseJson<FinalTestResult[]>(raw.finalTests, isArray, []),
  };
}

/** True when the child has never played a round (no sessions, no word stats). */
export function hasNoPlay(data: ChildReportData): boolean {
  return data.sessions.length === 0 && Object.keys(data.wordStats).length === 0;
}

/**
 * Sessions started in the last 7 local calendar days, today included. A rolling week rather than a
 * Monday-to-Sunday one, so the number never resets to 0 on a Monday morning.
 */
export function sessionsThisWeek(sessions: SessionRecord[], nowMs: number, tzOffsetMinutes: number): number {
  const today = toDayKey(nowMs, tzOffsetMinutes);
  return sessions.filter((session) => {
    const gap = dayGap(toDayKey(session.startedAt, tzOffsetMinutes), today);
    return gap >= 0 && gap < WEEK_DAYS;
  }).length;
}

export function totalWordsCompleted(wordStats: Record<string, WordStat>): number {
  return Object.values(wordStats).reduce((sum, stat) => sum + stat.timesCompleted, 0);
}

export type Accuracy = { correct: number; missed: number; percent: number | null };

/** Correct vs missed flicks over the stored sessions. `percent` is null until there is an answer. */
export function accuracy(sessions: SessionRecord[]): Accuracy {
  const correct = sessions.reduce((sum, session) => sum + (session.correctFlicks || 0), 0);
  const missed = sessions.reduce((sum, session) => sum + (session.missedFlicks || 0), 0);
  const total = correct + missed;
  return { correct, missed, percent: total === 0 ? null : Math.round((correct / total) * 100) };
}

/** Words missed at least once, most missed first (ties alphabetical, so the order is stable). */
export function trickyWords(wordStats: Record<string, WordStat>): WordStat[] {
  return Object.values(wordStats)
    .filter((stat) => stat.timesMissed > 0)
    .sort((a, b) => b.timesMissed - a.timesMissed || a.word.localeCompare(b.word));
}

export type MostPlayed = {
  /** 'tie' when the two games are level; null when no session has a recorded game. */
  leader: GameId | 'tie' | null;
  counts: Record<GameId, number>;
  /** Sessions from before the game was recorded; never counted towards the leader. */
  unknown: number;
};

export function mostPlayedGame(sessions: SessionRecord[]): MostPlayed {
  const counts: Record<GameId, number> = { 'honey-pot-flick': 0, 'bee-line': 0 };
  let unknown = 0;
  for (const session of sessions) {
    if (session.game === 'final-test') {
      continue; // not a game choice
    }
    if (session.game && session.game in counts) {
      counts[session.game] += 1;
    } else {
      unknown += 1;
    }
  }
  const flick = counts['honey-pot-flick'];
  const beeLine = counts['bee-line'];
  const leader =
    flick === 0 && beeLine === 0 ? null : flick === beeLine ? 'tie' : flick > beeLine ? 'honey-pot-flick' : 'bee-line';
  return { leader, counts, unknown };
}

export const GAME_NAMES: Record<GameId, string> = { 'honey-pot-flick': 'Honey Pot Flick', 'bee-line': 'Bee Line' };

export function gameLabel(game: SessionRecord['game']): string {
  if (game === 'final-test') {
    return 'Final Test';
  }
  return game && game in GAME_NAMES ? GAME_NAMES[game] : 'Unknown game';
}

export type StreakSummary = {
  status: ReturnType<typeof getStreakStatus>;
  /** Never contains a "0" day count. */
  headline: string;
  caption: string | null;
  longest: string | null;
};

const NO_STREAK_CAPTION = 'A streak starts with the first finished word.';

function days(count: number): string {
  return `${count}-day streak`;
}

/** Parent-facing streak wording, built on the same status rules and captions as the child UI. */
export function streakSummary(streak: DailyStreakState | null, today: string): StreakSummary {
  if (!streak) {
    return { status: 'new', headline: 'No streak yet', caption: NO_STREAK_CAPTION, longest: null };
  }
  const status = getStreakStatus(streak, today);
  const longest = streak.longest >= 1 ? `Longest: ${streak.longest} day${streak.longest === 1 ? '' : 's'}` : null;
  switch (status) {
    case 'active':
      return { status, headline: days(streak.current), caption: null, longest };
    case 'resting':
      return { status, headline: `${days(streak.current)}, resting`, caption: RESTING_CAPTION, longest };
    case 'lapsed':
      return { status, headline: 'Ready for a fresh streak', caption: FRESH_START_CAPTION, longest };
    case 'new':
      return { status, headline: 'No streak yet', caption: NO_STREAK_CAPTION, longest };
  }
}

export type StickerCount = { collection: string; label: string; collected: number; total: number };

type CatalogEntry = { id: string; collection?: string };

const DEFAULT_COLLECTION = 'core';

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Collected (distinct, not duplicates) vs available stickers, per collection. The catalog has no
 * collections yet, so everything lands in one group; Epic 34 only has to add `collection` to catalog
 * entries for this to split.
 */
export function stickerCounts(album: DailyRewardsState['album'] | null, catalog: CatalogEntry[]): StickerCount[] {
  const earned = album?.earned ?? {};
  const groups = new Map<string, { collected: number; total: number }>();
  for (const entry of catalog) {
    const key = entry.collection ?? DEFAULT_COLLECTION;
    const group = groups.get(key) ?? { collected: 0, total: 0 };
    group.total += 1;
    if (earned[entry.id]) {
      group.collected += 1;
    }
    groups.set(key, group);
  }
  const single = groups.size <= 1;
  return Array.from(groups, ([collection, group]) => ({
    collection,
    label: single ? 'Stickers' : titleCase(collection),
    ...group,
  }));
}

/** "Stickers 3 / 5" or "Core 12 / 50 · Holiday 2 / 20". */
export function formatStickerCounts(counts: StickerCount[]): string {
  return counts.map((count) => `${count.label} ${count.collected} / ${count.total}`).join(' · ');
}

export type FinalTestRow = { id: string; listName: string; takenAt: number; result: string; passed: boolean };

/** Newest first. Gentle wording for a not-yet-passed test: it is a to-do, not a failure. */
export function finalTestHistory(results: FinalTestResult[], limit = 20): FinalTestRow[] {
  return [...results]
    .sort((a, b) => b.takenAt - a.takenAt)
    .slice(0, limit)
    .map((result) => {
      const score = `${result.score} / ${result.words.length}`;
      return {
        id: result.id,
        listName: result.listName,
        takenAt: result.takenAt,
        passed: result.passed,
        result: result.passed ? `Passed · ${score}` : `Keep practising · ${score}`,
      };
    });
}

export function formatSessionDateTime(timestamp: number, locale?: string): string {
  const date = new Date(timestamp);
  const datePart = date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  const timePart = date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  return `${datePart} · ${timePart}`;
}

export function emptyStateText(name: string): string {
  return `Nothing yet — ${name} hasn't played a round`;
}

/** Which child the report shows: the remembered one if still in the family, else the player. */
export function resolveViewedChildId(
  childIds: string[],
  remembered: string | null,
  activeChildId: string | null,
): string | null {
  if (remembered && childIds.includes(remembered)) {
    return remembered;
  }
  if (activeChildId && childIds.includes(activeChildId)) {
    return activeChildId;
  }
  return childIds[0] ?? null;
}
