import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { theme } from '@/shared/lib/theme';
import { useProfileStore } from '@/stores/profile-store';
import { useWordListStore } from '@/stores/word-list-store';
import { useGameModeStore } from '@/stores/game-mode-store';
import { useGameSelectionStore } from '@/stores/game-selection-store';
import { GAME_MODES, GAME_MODE_CONFIG } from '@/features/play/logic/game-modes';
import { GAMES, GAME_CONFIG } from '@/features/play/logic/games';
import { Character } from '@/shared/ui/Character';

export function HomeScreen() {
  const profile = useProfileStore((state) => state.profile);
  const selectedList = useWordListStore((state) => state.getSelectedList());
  const mode = useGameModeStore((state) => state.mode);
  const setMode = useGameModeStore((state) => state.setMode);
  const selectedGame = useGameSelectionStore((state) => state.selectedGame);
  const setSelectedGame = useGameSelectionStore((state) => state.setSelectedGame);

  const handlePlay = () => {
    if (!profile) {
      router.replace('/profile');
      return;
    }
    router.replace(selectedGame === 'bee-line' ? '/bee-line' : '/play');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Character characterId="mama-bear" size="medium" style={styles.characterBadge} />
      <Text style={styles.title}>Mama Bear's Spelling Bee</Text>
      <Text style={styles.message}>
        {profile
          ? `Welcome back, ${profile.name}! Mama Bear missed you.`
          : 'Mama Bear is ready to help you spell with a smile.'}
      </Text>

      <Pressable style={styles.instructionsButton} onPress={() => router.replace('/instructions')}>
        <Text style={styles.instructionsButtonText}>📖 Instructions</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>Choose your game</Text>
      <View style={styles.pillRow}>
        {GAMES.map((gameId) => {
          const selected = gameId === selectedGame;
          return (
            <Pressable
              key={gameId}
              testID={`game-${gameId}`}
              style={[styles.pillButton, selected && styles.gamePillSelected]}
              onPress={() => setSelectedGame(gameId)}
            >
              <Text style={[styles.pillButtonText, selected && styles.pillButtonTextSelected]}>
                {GAME_CONFIG[gameId].label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Choose your challenge</Text>
      <View style={styles.pillRow}>
        {GAME_MODES.map((gameMode) => {
          const selected = gameMode === mode;
          return (
            <Pressable
              key={gameMode}
              testID={`mode-${gameMode}`}
              style={[styles.pillButton, selected && styles.modePillSelected]}
              onPress={() => setMode(gameMode)}
            >
              <Text style={[styles.pillButtonText, selected && styles.pillButtonTextSelected]}>
                {GAME_MODE_CONFIG[gameMode].label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable testID="play-button" style={styles.playButtonWrapper} onPress={handlePlay}>
        <View style={styles.playTriangleOutline} />
        <View style={styles.playTriangle} />
        <Text style={styles.playButtonText}>Play</Text>
      </Pressable>
      {selectedList ? <Text style={styles.selectedListLabel}>Playing: {selectedList.name}</Text> : null}

      <View style={styles.actionsRow}>
        <Pressable
          testID="lists-button"
          style={[styles.actionButtonCompact, styles.listsButton]}
          onPress={() => router.replace('/lists')}
        >
          <Text style={styles.actionButtonEmoji}>📚</Text>
          <Text style={[styles.actionButtonLabel, styles.actionButtonLabelLight]}>Word Lists</Text>
        </Pressable>

        <Pressable
          testID="final-test-button"
          style={[styles.actionButtonCompact, styles.finalTestButton]}
          onPress={() => router.replace('/final-test')}
        >
          <Text style={styles.actionButtonEmoji}>🎓</Text>
          <Text style={styles.actionButtonLabel}>Final Test</Text>
        </Pressable>

        <Pressable
          testID="parent-button"
          style={[styles.actionButtonCompact, styles.parentButton]}
          onPress={() => router.replace('/parent')}
        >
          <Text style={styles.actionButtonEmoji}>👪</Text>
          <Text style={styles.actionButtonLabel}>Parent View</Text>
        </Pressable>
      </View>

      {profile ? (
        <Pressable onPress={() => router.replace('/profile')}>
          <Text style={styles.switchProfile}>Not {profile.name}? Switch profile</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  characterBadge: {
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  message: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  instructionsButton: {
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#111111',
  },
  instructionsButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    maxWidth: 320,
  },
  pillButton: {
    minWidth: 128,
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 3,
    borderColor: '#111111',
  },
  // The game row uses `secondary` (Blue Violet) for its selected pill and the mode row keeps
  // `primary` (Tomato) — two different colors so the two stacked rows read as distinct choices
  // rather than one long list of settings (UX Step 13).
  gamePillSelected: {
    backgroundColor: theme.colors.secondary,
  },
  modePillSelected: {
    backgroundColor: theme.colors.primary,
  },
  pillButtonText: {
    fontWeight: '800',
    color: theme.colors.text,
  },
  pillButtonTextSelected: {
    color: theme.colors.surface,
  },
  playButtonWrapper: {
    marginTop: theme.spacing.xs,
    width: 150,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // A slightly larger black triangle sits directly behind the colored one, showing through as a
  // uniform ~4px outline — the same thick-black-border look used on every other button, just
  // built by hand since CSS border/shadow tricks don't clip to a triangle's actual silhouette.
  playTriangleOutline: {
    position: 'absolute',
    left: 6,
    top: 0,
    width: 0,
    height: 0,
    borderTopWidth: 64,
    borderBottomWidth: 64,
    borderLeftWidth: 120,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#111111',
  },
  playTriangle: {
    position: 'absolute',
    left: 14,
    top: 4,
    width: 0,
    height: 0,
    borderTopWidth: 60,
    borderBottomWidth: 60,
    borderLeftWidth: 112,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: theme.colors.success,
  },
  playButtonText: {
    position: 'absolute',
    left: 30,
    color: theme.colors.surface,
    fontSize: 17,
    fontWeight: '800',
  },
  switchProfile: {
    marginTop: theme.spacing.sm,
    color: theme.colors.muted,
    textDecorationLine: 'underline',
  },
  selectedListLabel: {
    marginTop: theme.spacing.sm,
    color: theme.colors.muted,
    fontWeight: '600',
  },
  // Word Lists / Final Test / Parent View as one horizontal row of compact icon+label buttons
  // instead of three stacked full-width pills — reclaims a lot of vertical space so Parent View
  // stays reachable without heavy scrolling, even after the game-picker row above added height.
  actionsRow: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  actionButtonCompact: {
    width: 92,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#111111',
  },
  actionButtonEmoji: {
    fontSize: 22,
  },
  actionButtonLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  actionButtonLabelLight: {
    color: theme.colors.surface,
  },
  listsButton: {
    backgroundColor: theme.colors.secondary,
  },
  finalTestButton: {
    backgroundColor: theme.colors.gold,
  },
  parentButton: {
    backgroundColor: theme.colors.surface,
  },
});
