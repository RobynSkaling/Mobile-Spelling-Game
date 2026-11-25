import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { theme } from '@/shared/lib/theme';
import { useFamilyStore } from '@/stores/family-store';
import { RequireParent } from '@/features/family/components/RequireParent';
import { useWordListStore } from '@/stores/word-list-store';
import { localDayKey } from '@/stores/daily-rewards-logic';
import { STICKER_CATALOG } from '@/data/rewards/sticker-catalog';
import { ChildSwitcher } from '../components/ChildSwitcher';
import { clearWordStatsForChild, loadChildReport, selectListForChild } from '../data/child-report-storage';
import { useViewedChildStore } from '../data/viewed-child-store';
import {
  accuracy,
  ChildReportData,
  emptyStateText,
  finalTestHistory,
  formatSessionDateTime,
  formatStickerCounts,
  GAME_NAMES,
  gameLabel,
  hasNoPlay,
  mostPlayedGame,
  resolveViewedChildId,
  sessionsThisWeek,
  stickerCounts,
  streakSummary,
  totalWordsCompleted,
  trickyWords,
} from '../logic/report-logic';

const MAX_RECENT_SESSIONS_SHOWN = 10;

/** Parent View sits behind the parent PIN gate (Epic 30). */
export function ParentScreen() {
  return (
    <RequireParent next="/parent">
      <ParentReport />
    </RequireParent>
  );
}

type LoadedReport = { childId: string; data: ChildReportData };

function ParentReport() {
  const children = useFamilyStore((state) => state.children);
  const activeChildId = useFamilyStore((state) => state.activeChildId);
  const remembered = useViewedChildStore((state) => state.viewedChildId);
  const setViewedChildId = useViewedChildStore((state) => state.setViewedChildId);
  const createListWithWords = useWordListStore((state) => state.createListWithWords);

  const viewedId = resolveViewedChildId(
    children.map((child) => child.id),
    remembered,
    activeChildId,
  );
  const viewedChild = children.find((child) => child.id === viewedId) ?? null;

  const [report, setReport] = useState<LoadedReport | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [makeListError, setMakeListError] = useState<string | null>(null);

  useEffect(() => {
    if (!viewedId) {
      return;
    }
    let cancelled = false;
    void loadChildReport(viewedId).then((data) => {
      if (!cancelled) {
        setReport({ childId: viewedId, data });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [viewedId, reloadCount]);

  const selectChild = useCallback(
    (id: string) => {
      setViewedChildId(id);
      setSelectedWords(new Set());
      setConfirmingClear(false);
      setMakeListError(null);
    },
    [setViewedChildId],
  );

  // Only ever render data that belongs to the child on screen.
  const data = report && report.childId === viewedId ? report.data : null;

  const view = useMemo(() => {
    if (!data) {
      return null;
    }
    const now = Date.now();
    const tricky = trickyWords(data.wordStats);
    return {
      weekSessions: sessionsThisWeek(data.sessions, now, -new Date(now).getTimezoneOffset()),
      wordsCompleted: totalWordsCompleted(data.wordStats),
      accuracy: accuracy(data.sessions),
      tricky,
      recent: data.sessions.slice(0, MAX_RECENT_SESSIONS_SHOWN),
      streak: streakSummary(data.rewards?.streak ?? null, localDayKey(now)),
      stickers: formatStickerCounts(stickerCounts(data.rewards?.album ?? null, STICKER_CATALOG)),
      mostPlayed: mostPlayedGame(data.sessions),
      finalTests: finalTestHistory(data.finalTests),
    };
  }, [data]);

  const tricky = view?.tricky ?? [];
  const allSelected = tricky.length > 0 && selectedWords.size === tricky.length;

  const toggleWord = (word: string) => {
    setSelectedWords((current) => {
      const next = new Set(current);
      if (next.has(word)) {
        next.delete(word);
      } else {
        next.add(word);
      }
      return next;
    });
    setMakeListError(null);
  };

  const toggleSelectAll = () => {
    setSelectedWords(allSelected ? new Set() : new Set(tricky.map((word) => word.word)));
    setMakeListError(null);
  };

  const handleMakeWordList = async () => {
    if (selectedWords.size === 0 || !viewedId) {
      return;
    }
    const { list, error } = createListWithWords('Tricky Words', Array.from(selectedWords));
    if (error || !list) {
      setMakeListError(error);
      return;
    }
    await selectListForChild(viewedId, list.id);
    setSelectedWords(new Set());
    router.replace({ pathname: '/list-editor', params: { listId: list.id } });
  };

  const handleClearSelectedConfirmed = async () => {
    if (!viewedId) {
      return;
    }
    await clearWordStatsForChild(viewedId, Array.from(selectedWords));
    setSelectedWords(new Set());
    setConfirmingClear(false);
    setReloadCount((count) => count + 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable testID="parent-back-button" accessibilityRole="button" style={styles.backButton} onPress={() => router.replace('/home')}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Parent View</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Pressable
          testID="manage-children-button"
          accessibilityRole="button"
          style={styles.manageChildrenButton}
          onPress={() => router.replace('/children')}
        >
          <Text style={styles.manageChildrenText}>👪 Manage children</Text>
        </Pressable>

        {children.length > 0 ? (
          <ChildSwitcher childProfiles={children} selectedId={viewedId} onSelect={selectChild} />
        ) : null}

        <Text testID="report-title" style={styles.subtitle}>
          {viewedChild ? `How ${viewedChild.name} is doing` : 'No children yet'}
        </Text>

        {viewedChild && data && view ? (
          hasNoPlay(data) ? (
            <View testID="report-empty" style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>{emptyStateText(viewedChild.name)}</Text>
            </View>
          ) : (
            <>
              <View style={styles.statsRow}>
                <View style={styles.statTile}>
                  <Text testID="stat-sessions-week" style={styles.statValue}>
                    {view.weekSessions}
                  </Text>
                  <Text style={styles.statLabel}>Sessions this week</Text>
                </View>
                <View style={styles.statTile}>
                  <Text testID="stat-words-completed" style={styles.statValue}>
                    {view.wordsCompleted}
                  </Text>
                  <Text style={styles.statLabel}>Words spelled</Text>
                </View>
                <View style={styles.statTile}>
                  <Text testID="stat-accuracy" style={styles.statValue}>
                    {view.accuracy.percent === null ? '—' : `${view.accuracy.percent}%`}
                  </Text>
                  <Text style={styles.statLabel}>Accuracy</Text>
                </View>
              </View>
              <Text testID="stat-correct-missed" style={styles.footnote}>
                {view.accuracy.correct} correct, {view.accuracy.missed} missed (recent rounds)
              </Text>

              <Text style={styles.sectionLabel}>Streak</Text>
              <View style={styles.card}>
                <View style={styles.cardBody}>
                  <Text testID="streak-headline" style={styles.cardHeadline}>
                    {view.streak.headline}
                  </Text>
                  {view.streak.caption ? <Text style={styles.cardCaption}>{view.streak.caption}</Text> : null}
                  {view.streak.longest ? (
                    <Text testID="streak-longest" style={styles.cardCaption}>
                      {view.streak.longest}
                    </Text>
                  ) : null}
                </View>
              </View>

              <Text style={styles.sectionLabel}>Stickers</Text>
              <View style={styles.card}>
                <View style={styles.cardBody}>
                  <Text testID="sticker-counts" style={styles.cardHeadline}>
                    {view.stickers}
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionLabel}>Most-played game</Text>
              <View style={styles.card}>
                <View style={styles.cardBody}>
                  <Text testID="most-played" style={styles.cardHeadline}>
                    {view.mostPlayed.leader === null
                      ? 'Not enough rounds yet'
                      : view.mostPlayed.leader === 'tie'
                        ? 'Both games equally'
                        : GAME_NAMES[view.mostPlayed.leader]}
                  </Text>
                  <Text style={styles.cardCaption}>
                    {GAME_NAMES['honey-pot-flick']} {view.mostPlayed.counts['honey-pot-flick']} · {GAME_NAMES['bee-line']}{' '}
                    {view.mostPlayed.counts['bee-line']}
                    {view.mostPlayed.unknown > 0 ? ` · earlier rounds ${view.mostPlayed.unknown}` : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.trickyHeaderRow}>
                <Text style={[styles.sectionLabel, styles.sectionLabelInRow]}>Words to practice</Text>
                {tricky.length > 0 ? (
                  <Pressable testID="select-all-tricky" style={styles.selectAllButton} onPress={toggleSelectAll}>
                    <Text style={styles.selectAllText}>{allSelected ? 'Deselect all' : 'Select all'}</Text>
                  </Pressable>
                ) : null}
              </View>

              {tricky.length === 0 ? (
                <Text style={styles.emptyText}>No tricky words yet — great job!</Text>
              ) : (
                <>
                  <View style={styles.card}>
                    <ScrollView testID="tricky-words-scroll" style={styles.sectionScroll} nestedScrollEnabled>
                      <View style={styles.cardBody}>
                        {tricky.map((word, index) => {
                          const selected = selectedWords.has(word.word);
                          return (
                            <Pressable
                              key={word.word}
                              testID={`tricky-word-${word.word}`}
                              accessibilityRole="checkbox"
                              accessibilityState={{ checked: selected }}
                              style={[
                                styles.wordRow,
                                selected && styles.wordRowSelected,
                                index === tricky.length - 1 && styles.rowNoBorder,
                              ]}
                              onPress={() => toggleWord(word.word)}
                            >
                              <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
                                {selected ? <Text style={styles.checkboxMark}>✓</Text> : null}
                              </View>
                              <Text style={styles.wordText}>{word.word}</Text>
                              <Text style={styles.wordMissCount}>missed {word.timesMissed}x</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>

                  {selectedWords.size > 0 ? (
                    <View style={styles.trickyActionsRow}>
                      <Pressable
                        testID="make-word-list-button"
                        style={styles.makeListButton}
                        onPress={handleMakeWordList}
                      >
                        <Text style={styles.makeListButtonText}>📝 Make Word List ({selectedWords.size})</Text>
                      </Pressable>
                      {!confirmingClear ? (
                        <Pressable
                          testID="clear-selected-button"
                          style={styles.clearSelectedButton}
                          onPress={() => setConfirmingClear(true)}
                        >
                          <Text style={styles.clearSelectedButtonText}>🗑️ Clear Selected</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : null}

                  {makeListError ? <Text style={styles.errorText}>{makeListError}</Text> : null}

                  {confirmingClear ? (
                    <View testID="clear-confirm" style={styles.confirmRow}>
                      <Text style={styles.confirmText}>
                        Remove {selectedWords.size} word{selectedWords.size === 1 ? '' : 's'} from{' '}
                        {viewedChild.name}'s word stats? This only affects {viewedChild.name}.
                      </Text>
                      <Pressable
                        testID="clear-confirm-yes"
                        style={styles.confirmYesButton}
                        onPress={handleClearSelectedConfirmed}
                      >
                        <Text style={styles.confirmYesText}>Yes, clear them</Text>
                      </Pressable>
                      <Pressable style={styles.confirmNoButton} onPress={() => setConfirmingClear(false)}>
                        <Text style={styles.confirmNoText}>Cancel</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </>
              )}

              <Text style={styles.sectionLabel}>Recent sessions</Text>
              <View style={styles.card}>
                <ScrollView testID="recent-sessions-scroll" style={styles.sectionScroll} nestedScrollEnabled>
                  <View style={styles.cardBody}>
                    {view.recent.length === 0 ? (
                      <Text style={styles.emptyText}>No rounds yet.</Text>
                    ) : (
                      view.recent.map((session, index) => (
                        <View
                          key={session.id}
                          testID="recent-session-row"
                          style={[styles.listRow, index === view.recent.length - 1 && styles.rowNoBorder]}
                        >
                          <Text style={styles.rowTitle}>{formatSessionDateTime(session.startedAt)}</Text>
                          <Text style={styles.rowDetail}>
                            {gameLabel(session.game)} · {session.wordsCompleted} word
                            {session.wordsCompleted === 1 ? '' : 's'} spelled
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                </ScrollView>
              </View>

              <Text style={styles.sectionLabel}>Final Test history</Text>
              <View style={styles.card}>
                <ScrollView testID="final-tests-scroll" style={styles.sectionScroll} nestedScrollEnabled>
                  <View style={styles.cardBody}>
                    {view.finalTests.length === 0 ? (
                      <Text style={styles.emptyText}>No Final Tests yet.</Text>
                    ) : (
                      view.finalTests.map((test, index) => (
                        <View
                          key={test.id}
                          testID="final-test-row"
                          style={[styles.listRow, index === view.finalTests.length - 1 && styles.rowNoBorder]}
                        >
                          <Text style={styles.rowTitle}>{test.listName}</Text>
                          <Text style={styles.rowDetail}>
                            {formatSessionDateTime(test.takenAt)} · {test.result}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                </ScrollView>
              </View>
            </>
          )
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.sm,
  },
  backButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 3,
    borderColor: '#111111',
  },
  backButtonText: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  title: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
  },
  manageChildrenButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#111111',
    backgroundColor: theme.colors.gold,
  },
  manageChildrenText: {
    fontWeight: '800',
    color: theme.colors.text,
  },
  subtitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: theme.spacing.md,
  },
  emptyCard: {
    padding: theme.spacing.lg,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 4,
    borderColor: '#111111',
    alignItems: 'center',
  },
  emptyCardText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  statTile: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: 4,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 4,
    borderColor: '#111111',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    color: theme.colors.secondary,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.muted,
    textAlign: 'center',
  },
  footnote: {
    marginTop: theme.spacing.xs,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.muted,
  },
  trickyHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  selectAllButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  selectAllText: {
    color: theme.colors.secondary,
    fontWeight: '700',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sectionLabelInRow: {
    marginTop: 0,
    marginBottom: 0,
  },
  emptyText: {
    color: theme.colors.muted,
    fontWeight: '600',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#111111',
    overflow: 'hidden',
  },
  cardBody: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  cardHeadline: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    paddingVertical: 4,
  },
  cardCaption: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.muted,
    paddingBottom: 4,
  },
  sectionScroll: {
    maxHeight: 260,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: '#EEEEEE',
    gap: theme.spacing.sm,
  },
  wordRowSelected: {
    backgroundColor: '#FFD6EC',
    marginHorizontal: -theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#111111',
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.accent,
  },
  checkboxMark: {
    color: theme.colors.surface,
    fontWeight: '900',
    fontSize: 14,
  },
  wordText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  // Tomato is reserved for wrong answers; a miss count is exactly that.
  wordMissCount: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  trickyActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  makeListButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    borderRadius: 999,
    backgroundColor: theme.colors.secondary,
    borderWidth: 3,
    borderColor: '#111111',
  },
  makeListButtonText: {
    color: theme.colors.surface,
    fontWeight: '800',
    fontSize: 13,
  },
  clearSelectedButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    borderRadius: 999,
    backgroundColor: '#FFD6EC',
    borderWidth: 3,
    borderColor: '#111111',
  },
  clearSelectedButtonText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  errorText: {
    color: theme.colors.text,
    fontWeight: '700',
    marginTop: theme.spacing.sm,
  },
  confirmRow: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: 14,
    backgroundColor: '#FFD6EC',
    borderWidth: 3,
    borderColor: '#111111',
  },
  confirmText: {
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  confirmYesButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    borderRadius: 999,
    backgroundColor: theme.colors.text,
    borderWidth: 2,
    borderColor: '#111111',
    marginBottom: theme.spacing.xs,
  },
  confirmYesText: {
    color: theme.colors.surface,
    fontWeight: '700',
    fontSize: 13,
  },
  confirmNoButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: '#111111',
  },
  confirmNoText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  listRow: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: '#EEEEEE',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  rowDetail: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.muted,
  },
  rowNoBorder: {
    borderBottomWidth: 0,
  },
});
