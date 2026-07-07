import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { theme } from '@/shared/lib/theme';
import { useProfileStore } from '@/stores/profile-store';
import { useWordListStore } from '@/stores/word-list-store';

export function HomeScreen() {
  const profile = useProfileStore((state) => state.profile);
  const selectedList = useWordListStore((state) => state.getSelectedList());

  const handlePlay = () => {
    router.push(profile ? '/play' : '/profile');
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

      <Pressable style={styles.button} onPress={handlePlay}>
        <Text style={styles.buttonText}>Play</Text>
      </Pressable>

      <Pressable style={styles.listsButton} onPress={() => router.push('/lists')}>
        <Text style={styles.listsButtonText}>📚 Word Lists</Text>
      </Pressable>
      {selectedList ? <Text style={styles.selectedListLabel}>Playing: {selectedList.name}</Text> : null}

      {profile ? (
        <Pressable onPress={() => router.push('/profile')}>
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
