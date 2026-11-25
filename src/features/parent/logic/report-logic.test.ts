import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  accuracy,
  emptyStateText,
  finalTestHistory,
  gameLabel,
  formatStickerCounts,
  hasNoPlay,
  mostPlayedGame,
  parseChildReportData,
  resolveViewedChildId,
  sessionsThisWeek,
  stickerCounts,
  streakSummary,
  totalWordsCompleted,
  trickyWords,
} from './report-logic';
import type { SessionRecord } from '@/stores/progress-store';

const HOUR = 3_600_000;
const NOW = Date.UTC(2026, 5, 10, 12); // Wed 10 Jun 2026 12:00 UTC

function session(partial: Partial<SessionRecord> & { startedAt: number }): SessionRecord {
  return { id: String(partial.startedAt), wordsCompleted: 0, correctFlicks: 0, missedFlicks: 0, ...partial };
}

describe('sessionsThisWeek', () => {
  it('counts the last 7 local days, today included', () => {
    const sessions = [
      session({ startedAt: NOW - HOUR }), // today
      session({ startedAt: NOW - 6 * 24 * HOUR }), // 6 days ago: in
      session({ startedAt: NOW - 7 * 24 * HOUR }), // 7 days ago: out
      session({ startedAt: NOW + 30 * 24 * HOUR }), // future clock glitch: out
    ];
    assert.equal(sessionsThisWeek(sessions, NOW, 0), 2);
  });

  it('uses the local day, not the UTC day', () => {
    // 23:30 UTC on 3 Jun is 4 Jun in UTC+2 (6 days before the 10th), but still 3 Jun in UTC-5 (7 days).
    const late = [session({ startedAt: Date.UTC(2026, 5, 3, 23, 30) })];
    assert.equal(sessionsThisWeek(late, NOW, 120), 1);
    assert.equal(sessionsThisWeek(late, NOW, -300), 0);
  });

  it('is 0 with no sessions', () => {
    assert.equal(sessionsThisWeek([], NOW, 0), 0);
  });
});

describe('accuracy', () => {
  it('rounds correct over correct + missed', () => {
    const result = accuracy([
      session({ startedAt: 1, correctFlicks: 7, missedFlicks: 1 }),
      session({ startedAt: 2, correctFlicks: 1, missedFlicks: 1 }),
    ]);
    assert.deepEqual(result, { correct: 8, missed: 2, percent: 80 });
  });

  it('has no percent before any answer', () => {
    assert.equal(accuracy([session({ startedAt: 1 })]).percent, null);
    assert.equal(accuracy([]).percent, null);
  });
});

describe('trickyWords / totalWordsCompleted', () => {
  const stats = {
    cat: { word: 'cat', timesCompleted: 3, timesMissed: 0, lastPlayedAt: 1 },
    dog: { word: 'dog', timesCompleted: 1, timesMissed: 2, lastPlayedAt: 1 },
    ant: { word: 'ant', timesCompleted: 0, timesMissed: 2, lastPlayedAt: 1 },
    bee: { word: 'bee', timesCompleted: 2, timesMissed: 5, lastPlayedAt: 1 },
  };
  it('lists missed words most-missed first, ties alphabetical', () => {
    assert.deepEqual(trickyWords(stats).map((w) => w.word), ['bee', 'ant', 'dog']);
  });
  it('sums completed words', () => {
    assert.equal(totalWordsCompleted(stats), 6);
  });
});

describe('mostPlayedGame', () => {
  it('picks the leader and ignores old sessions without a game', () => {
    const result = mostPlayedGame([
      session({ startedAt: 1, game: 'bee-line' }),
      session({ startedAt: 2, game: 'bee-line' }),
      session({ startedAt: 3, game: 'honey-pot-flick' }),
      session({ startedAt: 4 }),
      session({ startedAt: 5 }),
      session({ startedAt: 6 }),
    ]);
    assert.equal(result.leader, 'bee-line');
    assert.equal(result.unknown, 3);
    assert.deepEqual(result.counts, { 'honey-pot-flick': 1, 'bee-line': 2 });
  });
  it('reports a tie and no leader', () => {
    const tied = [session({ startedAt: 1, game: 'bee-line' }), session({ startedAt: 2, game: 'honey-pot-flick' })];
    assert.equal(mostPlayedGame(tied).leader, 'tie');
    assert.equal(mostPlayedGame([session({ startedAt: 1 })]).leader, null);
    assert.equal(mostPlayedGame([]).leader, null);
  });
});

describe('gameLabel / final-test sessions', () => {
  it('labels every kind of session, including old ones', () => {
    assert.equal(gameLabel('bee-line'), 'Bee Line');
    assert.equal(gameLabel('final-test'), 'Final Test');
    assert.equal(gameLabel(undefined), 'Unknown game');
  });
  it('does not count Final Test sessions as a game or as unknown', () => {
    const result = mostPlayedGame([session({ startedAt: 1, game: 'final-test' }), session({ startedAt: 2, game: 'bee-line' })]);
    assert.equal(result.leader, 'bee-line');
    assert.equal(result.unknown, 0);
  });
});

describe('streakSummary', () => {
  const today = '2026-06-10';
  const streak = (over: Partial<{ current: number; longest: number; lastPlayedDay: string | null; graceRemaining: number }>) => ({
    current: 4,
    longest: 9,
    lastPlayedDay: '2026-06-10',
    graceRemaining: 1,
    ...over,
  });

  it('active shows the day count and longest', () => {
    const summary = streakSummary(streak({}), today);
    assert.equal(summary.headline, '4-day streak');
    assert.equal(summary.longest, 'Longest: 9 days');
  });
  it('resting says resting with the nap caption', () => {
    const summary = streakSummary(streak({ lastPlayedDay: '2026-06-08' }), today);
    assert.equal(summary.status, 'resting');
    assert.match(summary.headline, /resting/);
    assert.match(summary.caption ?? '', /nap/);
  });
  it('lapsed never shows the stale count', () => {
    const summary = streakSummary(streak({ lastPlayedDay: '2026-06-01' }), today);
    assert.equal(summary.status, 'lapsed');
    assert.doesNotMatch(summary.headline, /\d/);
  });
  it('never shows a 0 for new, missing or zero-longest data', () => {
    for (const summary of [
      streakSummary(null, today),
      streakSummary(streak({ lastPlayedDay: null, current: 0, longest: 0 }), today),
    ]) {
      assert.equal(summary.status, 'new');
      assert.doesNotMatch(`${summary.headline} ${summary.caption} ${summary.longest}`, /\b0\b/);
      assert.equal(summary.longest, null);
    }
  });
  it('singular longest', () => {
    assert.equal(streakSummary(streak({ current: 1, longest: 1 }), today).longest, 'Longest: 1 day');
  });
});

describe('stickerCounts', () => {
  const album = {
    earned: { a: { id: 'a', firstEarnedOn: 'x', count: 3 }, gone: { id: 'gone', firstEarnedOn: 'x', count: 1 } },
  };
  it('counts distinct earned stickers that are in the catalog; duplicates do not add', () => {
    const counts = stickerCounts(album, [{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    assert.equal(formatStickerCounts(counts), 'Stickers 1 / 3');
  });
  it('handles a child with no rewards file', () => {
    assert.equal(formatStickerCounts(stickerCounts(null, [{ id: 'a' }])), 'Stickers 0 / 1');
  });
  it('splits by collection when the catalog has them', () => {
    const counts = stickerCounts(album, [
      { id: 'a', collection: 'core' },
      { id: 'b', collection: 'core' },
      { id: 'h1', collection: 'holiday' },
    ]);
    assert.equal(formatStickerCounts(counts), 'Core 1 / 2 · Holiday 0 / 1');
  });
});

describe('finalTestHistory', () => {
  const result = (id: string, takenAt: number, correct: number, passed: boolean) => ({
    id,
    takenAt,
    listId: 'l',
    listName: `List ${id}`,
    passed,
    score: correct,
    words: Array.from({ length: 10 }, (_, i) => ({ word: `w${i}`, correct: i < correct })),
  });
  it('sorts newest first with gentle wording', () => {
    const rows = finalTestHistory([result('old', 1, 10, true), result('new', 2, 6, false)]);
    assert.deepEqual(rows.map((r) => r.id), ['new', 'old']);
    assert.equal(rows[0].result, 'Keep practising · 6 / 10');
    assert.equal(rows[1].result, 'Passed · 10 / 10');
  });
  it('limits rows', () => {
    const many = Array.from({ length: 30 }, (_, i) => result(String(i), i, 5, false));
    assert.equal(finalTestHistory(many).length, 20);
  });
});

describe('parseChildReportData / hasNoPlay', () => {
  it('returns empty data for missing or corrupt values', () => {
    const data = parseChildReportData({ sessions: '{oops', wordStats: '[]', rewards: '{"streak":1}', finalTests: null });
    assert.deepEqual(data, { sessions: [], wordStats: {}, rewards: null, finalTests: [] });
    assert.equal(hasNoPlay(data), true);
  });
  it('parses valid values', () => {
    const data = parseChildReportData({
      sessions: JSON.stringify([{ id: 's', startedAt: 1, wordsCompleted: 1, correctFlicks: 1, missedFlicks: 0 }]),
      wordStats: JSON.stringify({ cat: { word: 'cat', timesCompleted: 1, timesMissed: 0, lastPlayedAt: 1 } }),
      rewards: JSON.stringify({
        streak: { current: 1, longest: 1, lastPlayedDay: 'd', graceRemaining: 1 },
        album: { earned: {} },
        schemaVersion: 1,
      }),
    });
    assert.equal(data.sessions.length, 1);
    assert.equal(hasNoPlay(data), false);
    assert.equal(data.rewards?.streak.current, 1);
  });
});

describe('emptyStateText / resolveViewedChildId', () => {
  it('names the child', () => {
    assert.equal(emptyStateText('Mia'), "Nothing yet — Mia hasn't played a round");
  });
  it('prefers the remembered child, then the active one, then the first', () => {
    assert.equal(resolveViewedChildId(['a', 'b'], 'b', 'a'), 'b');
    assert.equal(resolveViewedChildId(['a', 'b'], 'gone', 'b'), 'b');
    assert.equal(resolveViewedChildId(['a', 'b'], null, 'gone'), 'a');
    assert.equal(resolveViewedChildId([], null, null), null);
  });
});
