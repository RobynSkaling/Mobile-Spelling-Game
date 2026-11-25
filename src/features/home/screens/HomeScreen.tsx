import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Redirect, router } from 'expo-router';
import { theme } from '@/shared/lib/theme';
import { useActiveChild, useFamilyStore } from '@/stores/family-store';
import { ChildAvatar } from '@/features/family/components/ChildAvatar';
import { useWordListStore } from '@/stores/word-list-store';
import { useGameModeStore } from '@/stores/game-mode-store';
import { useGameSelectionStore } from '@/stores/game-selection-store';
import { GAME_MODES, GAME_MODE_CONFIG } from '@/features/play/logic/game-modes';
import { GAMES, GAME_CONFIG } from '@/features/play/logic/games';
import { Character } from '@/shared/ui/Character';
import { StickerAlbumScreen, StickerAlbumButton } from '@/features/rewards';

export function HomeScreen() {
  const [albumOpen, setAlbumOpen] = useState(false);
  const activeChild = useActiveChild();
  const familyHydrated = useFamilyStore((state) => state.isHydrated);
  const lockParentArea = useFamilyStore((state) => state.lockParentArea);
  const selectedList = useWordListStore((state) => state.getSelectedList());
  const mode = useGameModeStore((state) => state.mode);
  const setMode = useGameModeStore((state) => state.setMode);
  const selectedGame = useGameSelectionStore((state) => state.selectedGame);
  const setSelectedGame = useGameSelectionStore((state) => state.setSelectedGame);

  // Coming back to Home always re-locks the parent area, so a child can't wander from Home into
  // Parent View on a PIN the parent entered earlier (Epic 30).
  useEffect(() => {
    lockParentArea();
  }, [lockParentArea]);

  const handlePlay = () => {
    if (!activeChild) {
      router.replace('/whos-playing');
      return;
    }
    router.replace(selectedGame === 'bee-line' ? '/bee-line' : '/play');
  };

  // A family with no children yet (e.g. a deep link straight to /home) goes through setup first.
  if (familyHydrated && !activeChild) {
    return <Redirect href="/parent-setup" />;
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeChild ? (
          // Top-left corner, absolutely positioned so it adds no height (Epic 30). Opens "Who's
          // playing?" to switch child.
          <Pressable
            testID="child-chip"
            accessibilityRole="button"
            accessibilityLabel={`Playing as ${activeChild.name}. Switch player.`}
            onPress={() => router.replace('/whos-playing')}
            style={({ pressed }) => [styles.childChip, pressed && styles.pressed]}
          >
            <ChildAvatar emoji={activeChild.avatar} size={26} />
            <Text style={styles.childChipName} numberOfLines={1}>
              {activeChild.name}
            </Text>
          </Pressable>
        ) : null}

        <Character characterId="mama-bear" size="medium" style={styles.characterBadge} />
        <Text style={styles.title}>Mama Bear's Spelling Bee</Text>

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

        <View style={styles.secondaryRow}>
          <Pressable
            testID="final-test-button"
            accessibilityRole="button"
            accessibilityLabel="Final Test"
            style={[styles.secondaryButton, styles.finalTestButton]}
            onPress={() => router.replace('/final-test')}
          >
            <Text style={styles.secondaryEmoji}>🎓</Text>
            <Text style={styles.secondaryLabel}>Final Test</Text>
          </Pressable>

          <StickerAlbumButton onPress={() => setAlbumOpen(true)} />
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            testID="lists-button"
            accessibilityRole="button"
            accessibilityLabel="Word Lists"
            style={[styles.actionButtonSquare, styles.listsButton]}
            onPress={() => router.replace('/lists')}
          >
            <Text style={styles.actionButtonEmoji}>📚</Text>
            <Text style={[styles.actionButtonLabel, styles.actionButtonLabelLight]}>Word Lists</Text>
          </Pressable>

          <Pressable
            testID="instructions-button"
            accessibilityRole="button"
            accessibilityLabel="Instructions"
            style={[styles.actionButtonSquare, styles.instructionsButton]}
            onPress={() => router.replace('/instructions')}
          >
            <Text style={styles.actionButtonEmoji}>📖</Text>
            <Text style={styles.actionButtonLabel}>Instructions</Text>
          </Pressable>

          <Pressable
            testID="parent-button"
            accessibilityRole="button"
            accessibilityLabel="Parent View"
            style={[styles.actionButtonSquare, styles.parentButton]}
            onPress={() => router.replace('/parent')}
          >
            <Text style={styles.actionButtonEmoji}>👪</Text>
            <Text style={styles.actionButtonLabel}>Parent View</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* A modal over Home, not a stacked route: one tap in (the Sticker Album button), one tap out (UX Step 21). */}
      <StickerAlbumScreen
        visible={albumOpen}
        onClose={() => setAlbumOpen(false)}
        onPlay={() => {
          setAlbumOpen(false);
          handlePlay();
        }}
      />
    </>
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
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
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
  childChip: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    zIndex: 1,
    // Capped so it clears the centred Mama Bear badge at 320pt wide; long names truncate.
    maxWidth: 96,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 4,
    paddingRight: theme.spacing.xs,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#111111',
    backgroundColor: theme.colors.surface,
  },
  childChipName: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  selectedListLabel: {
    marginTop: theme.spacing.xs,
    color: theme.colors.muted,
    fontWeight: '600',
  },
  // Final Test + Sticker Album: equal-size secondary actions directly under Play — smaller than
  // Play, larger than the bottom row (Epic 27). Same row width as the bottom row so they line up.
  secondaryRow: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignSelf: 'stretch',
    maxWidth: 320,
    gap: theme.spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#111111',
  },
  secondaryEmoji: {
    fontSize: 22,
    height: 28,
    lineHeight: 28,
  },
  secondaryLabel: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
  },
  // Word Lists / Instructions / Parent View as three equal squares (width-driven via flex +
  // aspectRatio) so they stay square from 320 up to the row's max width.
  actionsRow: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    alignSelf: 'stretch',
    maxWidth: 320,
    gap: theme.spacing.sm,
  },
  actionButtonSquare: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#111111',
  },
  actionButtonEmoji: {
    fontSize: 24,
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
  instructionsButton: {
    backgroundColor: theme.colors.surface,
  },
  finalTestButton: {
    backgroundColor: theme.colors.gold,
  },
  parentButton: {
    backgroundColor: theme.colors.surface,
  },
});
