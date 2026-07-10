import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { theme } from '@/shared/lib/theme';
import { GAME_MODES, GAME_MODE_CONFIG, GameMode } from '@/features/play/logic/game-modes';

const MODE_FLAVOR: Record<GameMode, { emoji: string; flavor: string }> = {
  easy: { emoji: '🐣', flavor: 'Silly Goose is still snoozing — a gentle start.' },
  hard: { emoji: '😼', flavor: 'Cheeky Monkey is awake and looking for trouble.' },
  crazy: { emoji: '🌀', flavor: 'Both villains are causing a ruckus in the hive!' },
  impossible: { emoji: '🔥', flavor: 'Silly Goose AND Cheeky Monkey, working together. Uh oh.' },
};

export function InstructionsScreen() {
  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.replace('/home')}>
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>📖 Instructions</Text>

        <View style={[styles.card, styles.storyCard]}>
          <Text style={styles.cardHeading}>🍯 The Tale of Mama Bear's Honey</Text>
          <Text style={styles.storyText}>
            Deep in Honeycomb Forest, Mama Bear has spent all year collecting the sweetest, goldenest honey for the
            whole hive. But trouble is buzzing! Two of the naughtiest troublemakers in the forest — Silly Goose and
            Cheeky Monkey — have their eyes on her honey pots. They love mischief more than anything, and stealing
            honey sounds like the perfect prank.
          </Text>
          <Text style={styles.storyText}>
            Mama Bear needs a brave speller to help guard the hive. That's where you come in! Spell a word correctly
            and the honey pot locks up safe and sound. Miss a letter, and the villains get just enough chaos to send
            the pot wobbling away. Spell fast, spell smart, and don't let them get away with a single drop!
          </Text>
        </View>

        <View style={[styles.card, styles.villainsCard]}>
          <Text style={styles.cardHeading}>😈 Meet the Villains</Text>
          <View style={styles.villainRow}>
            <Text style={styles.villainEmoji}>🪿</Text>
            <View style={styles.villainTextBlock}>
              <Text style={styles.villainName}>Silly Goose</Text>
              <Text style={styles.villainDetail}>
                Loud, dramatic, and always up to something. When he loses, he gets so silly that the Bee Police have
                to carry him away!
              </Text>
            </View>
          </View>
          <View style={styles.villainRow}>
            <Text style={styles.villainEmoji}>🐒</Text>
            <View style={styles.villainTextBlock}>
              <Text style={styles.villainName}>Cheeky Monkey</Text>
              <Text style={styles.villainDetail}>
                Rude, cheeky, and impossible to embarrass. When he's beaten, he slips away on a banana peel he
                somehow always has handy.
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, styles.howToCard]}>
          <Text style={styles.cardHeading}>🎯 How to Play: Honey Pot Flick</Text>
          <Text style={styles.tipLine}>🔊 Listen for the word — Mama Bear says it out loud, and shows it briefly too.</Text>
          <Text style={styles.tipLine}>✋ Flick the letters, one at a time, in the right order, into the honey pot.</Text>
          <Text style={styles.tipLine}>🍯 Get every letter right and the pot is locked safe — listen for the cheer!</Text>
          <Text style={styles.tipLine}>😈 Miss the pot or the letter, and the villains cause a little chaos — try again!</Text>
          <Text style={styles.tipLine}>📣 Forgot the word? Tap the megaphone in the corner to hear it again.</Text>
          <Text style={styles.tipLine}>💡 Playing Easy mode? Tap the lightbulb hint to peek at the word again.</Text>
          <Text style={styles.tipLine}>⬅️ Need a break? Tap Back anytime — Mama Bear keeps your honey safe until you return.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>🎮 Game Modes</Text>
          {GAME_MODES.map((mode) => (
            <View key={mode} style={styles.modeRow}>
              <Text style={styles.modeEmoji}>{MODE_FLAVOR[mode].emoji}</Text>
              <View style={styles.modeTextBlock}>
                <Text style={styles.modeName}>{GAME_MODE_CONFIG[mode].label}</Text>
                <Text style={styles.modeFlavor}>{MODE_FLAVOR[mode].flavor}</Text>
                <Text style={styles.modeMechanics}>{GAME_MODE_CONFIG[mode].description}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable style={styles.primaryButton} onPress={() => router.replace('/home')}>
          <Text style={styles.primaryButtonText}>Got it — let's play!</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    position: 'absolute',
    top: theme.spacing.xl,
    left: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 3,
    borderColor: '#111111',
    zIndex: 10,
  },
  backButtonText: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl * 1.6,
    paddingBottom: theme.spacing.xl * 2,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    borderWidth: 4,
    borderColor: '#111111',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  storyCard: {
    backgroundColor: '#FFD6EC',
  },
  villainsCard: {
    backgroundColor: '#E4D4FF',
  },
  howToCard: {
    backgroundColor: '#CFEFFF',
  },
  cardHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  storyText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  villainRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  villainEmoji: {
    fontSize: 32,
  },
  villainTextBlock: {
    flex: 1,
  },
  villainName: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 2,
  },
  villainDetail: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.text,
  },
  tipLine: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  modeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: '#EEEEEE',
  },
  modeEmoji: {
    fontSize: 28,
  },
  modeTextBlock: {
    flex: 1,
  },
  modeName: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text,
  },
  modeFlavor: {
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
    color: theme.colors.muted,
    marginTop: 1,
  },
  modeMechanics: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 4,
  },
  primaryButton: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: '#111111',
  },
  primaryButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '800',
  },
});
