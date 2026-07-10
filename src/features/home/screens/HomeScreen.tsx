import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { theme } from '@/shared/lib/theme';
import { useProfileStore } from '@/stores/profile-store';
import { useWordListStore } from '@/stores/word-list-store';
import { useGameModeStore } from '@/stores/game-mode-store';
import { GAME_MODES, GAME_MODE_CONFIG } from '@/features/play/logic/game-modes';

export function HomeScreen() {
  const profile = useProfileStore((state) => state.profile);
  const selectedList = useWordListStore((state) => state.getSelectedList());
  const mode = useGameModeStore((state) => state.mode);
  const setMode = useGameModeStore((state) => state.setMode);

  const handlePlay = () => {
    router.replace(profile ? '/play' : '/profile');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🐻</Text>
      <Text style={styles.title}>Mama Bear's Spelling Bee</Text>
      <Text style={styles.subtitle}>A cheerful spelling adventure for little learners.</Text>
      <Text style={styles.message}>
        {profile
          ? `Welcome back, ${profile.name}! Mama Bear missed you.`
          : 'Mama Bear is ready to help you spell with a smile.'}
      </Text>

      <Pressable style={styles.instructionsButton} onPress={() => router.replace('/instructions')}>
        <Text style={styles.instructionsButtonText}>📖 Instructions</Text>
      </Pressable>

      <Text style={styles.modeLabel}>Choose your challenge</Text>
      <View style={styles.modeRow}>
        {GAME_MODES.map((gameMode) => {
          const selected = gameMode === mode;
          return (
            <Pressable
              key={gameMode}
              testID={`mode-${gameMode}`}
              style={[styles.modeButton, selected && styles.modeButtonSelected]}
              onPress={() => setMode(gameMode)}
            >
              <Text style={[styles.modeButtonText, selected && styles.modeButtonTextSelected]}>
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

      <Pressable style={[styles.actionButton, styles.listsButton]} onPress={() => router.replace('/lists')}>
        <Text style={[styles.actionButtonText, styles.actionButtonTextLight]}>📚 Word Lists</Text>
      </Pressable>

      <Pressable style={[styles.actionButton, styles.finalTestButton]} onPress={() => router.replace('/final-test')}>
        <Text style={styles.actionButtonText}>🎓 Final Test</Text>
      </Pressable>

      <Pressable style={[styles.actionButton, styles.parentButton]} onPress={() => router.replace('/parent')}>
        <Text style={styles.actionButtonText}>👪 Parent View</Text>
      </Pressable>

      {profile ? (
        <Pressable onPress={() => router.replace('/profile')}>
          <Text style={styles.switchProfile}>Not {profile.name}? Switch profile</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  emoji: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.muted,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  message: {
    fontSize: 15,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  instructionsButton: {
    marginBottom: theme.spacing.md,
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
  modeLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
    maxWidth: 320,
  },
  modeButton: {
    minWidth: 128,
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 3,
    borderColor: '#111111',
  },
  modeButtonSelected: {
    backgroundColor: theme.colors.primary,
  },
  modeButtonText: {
    fontWeight: '800',
    color: theme.colors.text,
  },
  modeButtonTextSelected: {
    color: theme.colors.surface,
  },
  playButtonWrapper: {
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
    borderLeftColor: theme.colors.primary,
  },
  playButtonText: {
    position: 'absolute',
    left: 30,
    color: theme.colors.surface,
    fontSize: 17,
    fontWeight: '800',
  },
  switchProfile: {
    marginTop: theme.spacing.md,
    color: theme.colors.muted,
    textDecorationLine: 'underline',
  },
  actionButton: {
    marginTop: theme.spacing.md,
    minWidth: 200,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#111111',
  },
  actionButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  actionButtonTextLight: {
    color: theme.colors.surface,
  },
  listsButton: {
    backgroundColor: theme.colors.secondary,
  },
  selectedListLabel: {
    marginTop: theme.spacing.sm,
    color: theme.colors.muted,
    fontWeight: '600',
  },
  finalTestButton: {
    backgroundColor: theme.colors.gold,
  },
  parentButton: {
    backgroundColor: theme.colors.surface,
  },
});
