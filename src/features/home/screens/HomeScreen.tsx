import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { theme } from '@/shared/lib/theme';

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🐻</Text>
      <Text style={styles.title}>Mama Bear's Spelling Bee</Text>
      <Text style={styles.subtitle}>A cheerful spelling adventure for little learners.</Text>
      <Text style={styles.message}>Mama Bear is ready to help you spell with a smile.</Text>

      <Pressable style={styles.button} onPress={() => router.push('/profile')}>
        <Text style={styles.buttonText}>Play</Text>
      </Pressable>
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
});
