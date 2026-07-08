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
      <Text style={styles.modeDescription}>{GAME_MODE_CONFIG[mode].description}</Text>

      <Pressable style={styles.button} onPress={handlePlay}>
        <Text style={styles.buttonText}>Play</Text>
      </Pressable>

      <Pressable style={styles.listsButton} onPress={() => router.replace('/lists')}>
        <Text style={styles.listsButtonText}>📚 Word Lists</Text>
      </Pressable>
      {selectedList ? <Text style={styles.selectedListLabel}>Playing: {selectedList.name}</Text> : null}

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
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  modeButton: {
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
  modeDescription: {
    fontSize: 12,
    color: theme.colors.muted,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    maxWidth: 260,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 999,
  },
  buttonText: {
    color: theme.colors.surface,
    fontSize: 18,
    fontWeight: '600',
  },
  switchProfile: {
    marginTop: theme.spacing.md,
    color: theme.colors.muted,
    textDecorationLine: 'underline',
  },
  listsButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.secondary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#111111',
  },
  listsButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  selectedListLabel: {
    marginTop: theme.spacing.sm,
    color: theme.colors.muted,
    fontWeight: '600',
  },
});
