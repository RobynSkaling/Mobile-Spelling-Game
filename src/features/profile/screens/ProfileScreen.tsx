import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { theme } from '@/shared/lib/theme';
import { useProfileStore } from '@/stores/profile-store';

const AVATARS = [
  { label: '🐧', color: '#8E44AD' },
  { label: '🐺', color: '#E74C3C' },
  { label: '🦊', color: '#3498DB' },
  { label: '🐸', color: '#F39C12' },
  { label: '🦄', color: '#FF69B4' },
  { label: '🦚', color: '#F1C40F' },
];

export function ProfileScreen() {
  const { profile, setProfile } = useProfileStore();
  const [name, setName] = useState(profile?.name ?? '');
  const [avatar, setAvatar] = useState(profile?.avatar ?? AVATARS[0].label);

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
          const selected = option.label === avatar;
          return (
            <Pressable
              key={option.label}
              onPress={() => setAvatar(option.label)}
              style={[styles.avatarOption, selected && styles.avatarOptionSelected]}
            >
              <View style={[styles.avatarBadge, { backgroundColor: option.color }]}> 
                <Text style={styles.avatarEmoji}>{option.label}</Text>
              </View>
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
    fontSize: 30,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textShadowColor: '#111111',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
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
    borderWidth: 4,
    borderColor: '#111111',
    borderRadius: 16,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  avatarOption: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  avatarOptionSelected: {
    transform: [{ scale: 1.08 }],
  },
  avatarBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#111111',
    shadowColor: '#111111',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
    elevation: 4,
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
    borderWidth: 4,
    borderColor: '#111111',
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
