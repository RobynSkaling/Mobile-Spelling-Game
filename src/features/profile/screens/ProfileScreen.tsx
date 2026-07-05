import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { theme } from '@/shared/lib/theme';
import { useProfileStore } from '@/stores/profile-store';

const AVATARS = ['🐻', '🦉', '🐵', '🐝'];

export function ProfileScreen() {
  const { profile, setProfile } = useProfileStore();
  const [name, setName] = useState(profile?.name ?? '');
  const [avatar, setAvatar] = useState(profile?.avatar ?? AVATARS[0]);

  const isReady = useMemo(() => name.trim().length > 0, [name]);

  const handleStart = () => {
    if (!isReady) {
      return;
    }

    setProfile({
      id: profile?.id ?? `player-${Date.now()}`,
      name: name.trim(),
      avatar,
    });

    router.push('/play');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, little learner!</Text>
      <Text style={styles.message}>
        Mama Bear is ready to help you practice your spelling with a happy little challenge.
      </Text>

      <Text style={styles.label}>What should we call you?</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Enter your name"
        style={styles.input}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Pick an avatar</Text>
      <View style={styles.avatarRow}>
        {AVATARS.map((option) => {
          const selected = option === avatar;
          return (
            <Pressable
              key={option}
              onPress={() => setAvatar(option)}
              style={[styles.avatarOption, selected && styles.avatarOptionSelected]}
            >
              <Text style={styles.avatarEmoji}>{option}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={[styles.button, !isReady && styles.buttonDisabled]} onPress={handleStart}>
        <Text style={styles.buttonText}>Start</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  message: {
    fontSize: 16,
    color: theme.colors.muted,
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    borderRadius: 12,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionSelected: {
    borderColor: theme.colors.primary,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: theme.colors.surface,
    fontSize: 18,
    fontWeight: '600',
  },
});
