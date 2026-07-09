import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { theme } from '@/shared/lib/theme';
import { useProgressStore } from '@/stores/progress-store';
import { useProfileStore } from '@/stores/profile-store';
import { useWordListStore } from '@/stores/word-list-store';

const MAX_RECENT_SESSIONS_SHOWN = 6;

function formatSessionDate(timestamp: number): string {
  const date = new Date(timestamp);
  const datePart = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const timePart = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${datePart} · ${timePart}`;
}

export function ParentScreen() {
  const profile = useProfileStore((state) => state.profile);
  const sessions = useProgressStore((state) => state.sessions);
  const wordStats = useProgressStore((state) => state.wordStats);
  const clearWordStats = useProgressStore((state) => state.clearWordStats);
  const createListWithWords = useWordListStore((state) => state.createListWithWords);

  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [makeListError, setMakeListError] = useState<string | null>(null);

  const totals = useMemo(() => {
    const wordsCompleted = Object.values(wordStats).reduce((sum, word) => sum + word.timesCompleted, 0);
    const correctAnswers = sessions.reduce((sum, session) => sum + session.correctFlicks, 0);
    return { wordsCompleted, correctAnswers, sessionCount: sessions.length };
  }, [sessions, wordStats]);

  const missedWords = useMemo(
    () =>
      Object.values(wordStats)
        .filter((word) => word.timesMissed > 0)
        .sort((a, b) => b.timesMissed - a.timesMissed),
    [wordStats],
  );

  const recentSessions = useMemo(() => sessions.slice(0, MAX_RECENT_SESSIONS_SHOWN), [sessions]);

  const hasActivity = sessions.length > 0;
  const allSelected = missedWords.length > 0 && selectedWords.size === missedWords.length;

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
    setSelectedWords(allSelected ? new Set() : new Set(missedWords.map((word) => word.word)));
    setMakeListError(null);
  };

  const handleMakeWordList = () => {
    if (selectedWords.size === 0) {
      return;
    }

    const { list, error } = createListWithWords('Tricky Words', Array.from(selectedWords));
    if (error || !list) {
      setMakeListError(error);
      return;
    }

    setSelectedWords(new Set());
    router.replace({ pathname: '/list-editor', params: { listId: list.id } });
  };

  const handleClearSelectedConfirmed = () => {
    clearWordStats(Array.from(selectedWords));
    setSelectedWords(new Set());
    setConfirmingClear(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.replace('/home')}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Parent View</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>{profile ? `How ${profile.name} is doing` : 'How your child is doing'}</Text>

        {!hasActivity ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>No activity yet — encourage your child to play a round!</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statTile}>
                <Text testID="stat-sessions" style={styles.statValue}>
                  {totals.sessionCount}
                </Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={styles.statTile}>
                <Text testID="stat-words-completed" style={styles.statValue}>
                  {totals.wordsCompleted}
                </Text>
                <Text style={styles.statLabel}>Words spelled</Text>
              </View>
              <View style={styles.statTile}>
                <Text testID="stat-correct-answers" style={styles.statValue}>
                  {totals.correctAnswers}
                </Text>
                <Text style={styles.statLabel}>Correct answers</Text>
              </View>
            </View>

            <View style={styles.trickyHeaderRow}>
              <Text style={styles.sectionLabel}>Words to practice</Text>
              {missedWords.length > 0 ? (
                <Pressable testID="select-all-tricky" onPress={toggleSelectAll}>
                  <Text style={styles.selectAllText}>{allSelected ? 'Deselect all' : 'Select all'}</Text>
                </Pressable>
              ) : null}
            </View>

            {missedWords.length === 0 ? (
              <Text style={styles.emptyText}>No tricky words yet — great job!</Text>
            ) : (
              <>
                <View style={styles.card}>
                  {missedWords.map((word, index) => {
                    const selected = selectedWords.has(word.word);
                    return (
                      <Pressable
                        key={word.word}
                        testID={`tricky-word-${word.word}`}
                        style={[
                          styles.wordRow,
                          selected && styles.wordRowSelected,
                          index === missedWords.length - 1 && styles.rowNoBorder,
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

                {selectedWords.size > 0 ? (
                  <View style={styles.trickyActionsRow}>
                    <Pressable testID="make-word-list-button" style={styles.makeListButton} onPress={handleMakeWordList}>
                      <Text style={styles.makeListButtonText}>📝 Make Word List ({selectedWords.size})</Text>
                    </Pressable>
                    {!confirmingClear ? (
                      <Pressable style={styles.clearSelectedButton} onPress={() => setConfirmingClear(true)}>
                        <Text style={styles.clearSelectedButtonText}>🗑️ Clear Selected</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}

                {makeListError ? <Text style={styles.errorText}>{makeListError}</Text> : null}

                {confirmingClear ? (
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmText}>
                      Remove {selectedWords.size} word{selectedWords.size === 1 ? '' : 's'} from this list?
                    </Text>
                    <Pressable style={styles.confirmYesButton} onPress={handleClearSelectedConfirmed}>
                      <Text style={styles.confirmYesText}>Yes, clear them</Text>
                    </Pressable>
                    <Pressable style={styles.confirmNoButton} onPress={() => setConfirmingClear(false)}>
                      <Text style={styles.confirmNoText}>Cancel</Text>
                    </Pressable>
                  </View>
                ) : null}
              </>
            )}

            <Text style={styles.sectionLabel}>Recent activity</Text>
            <View style={styles.card}>
              {recentSessions.map((session, index) => (
                <View
                  key={session.id}
                  style={[styles.sessionRow, index === recentSessions.length - 1 && styles.rowNoBorder]}
                >
                  <Text style={styles.sessionDate}>{formatSessionDate(session.startedAt)}</Text>
                  <Text style={styles.sessionDetail}>
                    {session.wordsCompleted} word{session.wordsCompleted === 1 ? '' : 's'} spelled
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
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
    paddingVertical: theme.spacing.xs,
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
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
  },
  headerSpacer: {
    width: 76,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  subtitle: {
    color: theme.colors.muted,
    fontWeight: '600',
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
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  statTile: {
    flex: 1,
    padding: theme.spacing.sm,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 4,
    borderColor: '#111111',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.muted,
    textAlign: 'center',
  },
  trickyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
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
  emptyText: {
    color: theme.colors.muted,
    fontWeight: '600',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#111111',
    paddingHorizontal: theme.spacing.md,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
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
    paddingVertical: theme.spacing.xs,
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
    paddingVertical: theme.spacing.xs,
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
    color: theme.colors.primary,
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
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
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
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.sm,
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
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: '#EEEEEE',
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  sessionDetail: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.muted,
  },
  rowNoBorder: {
    borderBottomWidth: 0,
  },
});
