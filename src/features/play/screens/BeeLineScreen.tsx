import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { theme } from '@/shared/lib/theme';
import { useProfileStore } from '@/stores/profile-store';
import { useWordListStore } from '@/stores/word-list-store';
import { useGameModeStore } from '@/stores/game-mode-store';
import { useProgressStore } from '@/stores/progress-store';
import { speechService } from '@/shared/lib/speech';
import { Confetti } from '@/shared/ui/Confetti';
import { HexTile } from '@/shared/ui/HexTile';
import { GAME_MODE_CONFIG } from '@/features/play/logic/game-modes';
import { Bounds, Point, getNextWord, toContainerRelative } from '@/features/play/logic/honey-pot-flick';
import {
  acknowledgeChainBreak,
  BEE_LINE_MODE_CONFIG,
  BeeLineField,
  buildBeeLineField,
  CollectionState,
  createCollectionState,
  DEFAULT_BEE_LINE_TUNING,
  resolvePickup,
  ScatteredLetter,
} from '@/features/play/logic/bee-line';

const TILE_SIZE = 64;
const GHOST_HALF = TILE_SIZE / 2;
// How close a released drag needs to land to the bee's dock to count as "delivered" (UX Step 15:
// dragging needs real margin for a 7-year-old's imprecise gesture).
const DOCK_HIT_RADIUS = 64;
const CELEBRATION_BURST_MS = 800;
const CELEBRATION_HOLD_MS = 900;
const CELEBRATION_FADE_MS = 300;
const CELEBRATION_TOTAL_MS = CELEBRATION_BURST_MS + CELEBRATION_HOLD_MS + CELEBRATION_FADE_MS;
const NEXT_WORD_DELAY_MS = CELEBRATION_TOTAL_MS + 100;
// How long the "whole trail bursts apart" beat holds before the field is ready to try again
// (architecture 26.5's chainIntact:false window) — unreachable today since every tier ships with
// decoyLetterCount: 0 (Epic 21 turns decoys on), but implemented for correctness regardless.
const CHAIN_BREAK_HOLD_MS = 450;

export function BeeLineScreen() {
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [field, setField] = useState<BeeLineField | null>(null);
  const [collectionState, setCollectionState] = useState<CollectionState | null>(null);
  const [feedback, setFeedback] = useState('Collect the letters in order!');
  const [showBanner, setShowBanner] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationPhrase, setCelebrationPhrase] = useState('');

  const [containerBounds, setContainerBounds] = useState<Bounds | null>(null);
  const [fieldBounds, setFieldBounds] = useState<Bounds | null>(null);
  const [activeTileId, setActiveTileId] = useState<string | null>(null);

  const ghostAnim = useRef(new Animated.ValueXY()).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const bannerScale = useRef(new Animated.Value(0.6)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(0.5)).current;
  const confettiProgress = useRef(new Animated.Value(0)).current;
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<View | null>(null);
  const fieldRef = useRef<View | null>(null);
  const resolvingRef = useRef(false);

  const { profile } = useProfileStore();
  const selectedList = useWordListStore((state) => state.getSelectedList());
  const words = useMemo(() => selectedList?.words ?? [], [selectedList]);
  const gameMode = useGameModeStore((state) => state.mode);
  // crazy/impossible have no Bee Line-specific behavior yet (Epic 21 adds decoys/re-randomization)
  // — BEE_LINE_MODE_CONFIG already gives them the same input/trail shape as hard by construction,
  // so this screen falls back to hard's drag-and-tow behavior at those tiers with no special-casing.
  const modeConfig = BEE_LINE_MODE_CONFIG[gameMode];
  const bannerDurationMs = GAME_MODE_CONFIG[gameMode].bannerDurationMs;
  const startSession = useProgressStore((state) => state.startSession);
  const recordWordCompleted = useProgressStore((state) => state.recordWordCompleted);

  const dockCenter: Point | null = fieldBounds ? { x: fieldBounds.x + fieldBounds.width / 2, y: fieldBounds.y + 48 } : null;

  const revealWord = (word: string) => {
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
    }

    setShowBanner(true);
    bannerOpacity.setValue(0);
    bannerScale.setValue(0.6);
    Animated.parallel([
      Animated.spring(bannerScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(bannerOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    speechService.speakWord(word);

    bannerTimeoutRef.current = setTimeout(() => {
      Animated.timing(bannerOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setShowBanner(false);
      });
    }, bannerDurationMs);
  };

  const handleMegaphonePress = () => {
    if (currentWord) {
      speechService.speakWord(currentWord);
    }
  };

  const triggerCelebration = () => {
    setCelebrating(true);
    celebrationOpacity.setValue(0);
    celebrationScale.setValue(0.5);
    confettiProgress.setValue(0);
    setCelebrationPhrase(speechService.speakPraise());

    Animated.parallel([
      Animated.timing(confettiProgress, {
        toValue: 1,
        duration: CELEBRATION_BURST_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(celebrationScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(celebrationOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      Animated.timing(celebrationOpacity, {
        toValue: 0,
        duration: CELEBRATION_FADE_MS,
        useNativeDriver: true,
      }).start(() => {
        setCelebrating(false);
      });
    }, CELEBRATION_BURST_MS + CELEBRATION_HOLD_MS);
  };

  const handleWordComplete = (word: string) => {
    resolvingRef.current = true;
    setFeedback('Perfect! The whole word is collected.');
    recordWordCompleted(word);
    triggerCelebration();
    setTimeout(() => {
      setCurrentWord(getNextWord(words, word));
      resolvingRef.current = false;
    }, NEXT_WORD_DELAY_MS);
  };

  /** Shared by both the `easy` tap handler and the `hard`+ drag-drop handler — the only thing that
   *  differs between tiers is how a tile's pickup attempt is triggered, not what happens once one
   *  is. */
  const attemptPickup = (tile: ScatteredLetter) => {
    if (resolvingRef.current || !collectionState || collectionState.status !== 'in-progress') {
      return;
    }

    const result = resolvePickup(collectionState, tile, DEFAULT_BEE_LINE_TUNING);
    setCollectionState(result.next);

    if (result.outcome === 'correct') {
      setFeedback('Nice! Right letter.');
      if (result.next.status === 'complete') {
        handleWordComplete(result.next.word);
      }
      return;
    }

    setFeedback(result.outcome === 'wrong-order' ? "Not the next letter yet — try again!" : "That's not it — try again!");

    if (result.chainBroke && field) {
      // The whole trail scatters back onto the field in new positions (UX Step 18) — Epic 20 owns
      // the actual scatter animation; this just re-places the tiles and clears the mid-break flag
      // once the (currently instant) beat is done.
      resolvingRef.current = true;
      const rebuilt = buildBeeLineField(field.word, modeConfig.decoyLetterCount, fieldBounds!);
      setTimeout(() => {
        setField(rebuilt);
        setCollectionState((state) => (state ? acknowledgeChainBreak(state) : state));
        resolvingRef.current = false;
      }, CHAIN_BREAK_HOLD_MS);
    }
  };

  const handleTilePress = (tile: ScatteredLetter) => {
    if (modeConfig.input !== 'tap') {
      return;
    }
    attemptPickup(tile);
  };

  const handleDragStart = (tile: ScatteredLetter, absoluteX: number, absoluteY: number) => {
    if (resolvingRef.current) {
      return;
    }
    setActiveTileId(tile.id);
    ghostAnim.setValue(toContainerRelative({ x: absoluteX, y: absoluteY }, containerBounds));
  };

  const handleDragUpdate = (absoluteX: number, absoluteY: number) => {
    if (resolvingRef.current) {
      return;
    }
    ghostAnim.setValue(toContainerRelative({ x: absoluteX, y: absoluteY }, containerBounds));
  };

  const handleDragEnd = (tile: ScatteredLetter, absoluteX: number, absoluteY: number) => {
    setActiveTileId(null);
    if (resolvingRef.current || !dockCenter) {
      return;
    }

    const releasePoint = toContainerRelative({ x: absoluteX, y: absoluteY }, containerBounds);
    const distance = Math.hypot(releasePoint.x - dockCenter.x, releasePoint.y - dockCenter.y);

    if (distance <= DOCK_HIT_RADIUS) {
      attemptPickup(tile);
    } else {
      setFeedback('Drag the letter all the way to the bee!');
    }
  };

  useEffect(() => {
    startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current);
      }
      speechService.stop();
    };
  }, []);

  useEffect(() => {
    if (words.length === 0) {
      return;
    }
    setCurrentWord((current) => current ?? words[0]);
  }, [words]);

  useEffect(() => {
    if (!currentWord) {
      return;
    }
    setCollectionState(createCollectionState(currentWord));
    setFeedback('Collect the letters in order!');
    revealWord(currentWord);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWord]);

  useEffect(() => {
    if (!currentWord || !fieldBounds) {
      return;
    }
    setField(buildBeeLineField(currentWord, modeConfig.decoyLetterCount, fieldBounds));
    // A fresh field per word (or once fieldBounds first becomes available) — impossible's
    // per-attempt re-randomization is Epic 21's tuning work, not this epic's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWord, fieldBounds]);

  const measureField = () => {
    if (!containerBounds) {
      return;
    }
    fieldRef.current?.measureInWindow((x, y, width, height) => {
      setFieldBounds({ x: x - containerBounds.x, y: y - containerBounds.y, width, height });
    });
  };

  useEffect(() => {
    measureField();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerBounds]);

  const handleGoHome = () => {
    router.replace('/home');
  };

  const handleExitApp = () => {
    if (typeof window !== 'undefined' && window.location) {
      window.location.href = 'about:blank';
      return;
    }
    router.replace('/home');
  };

  const remainingTiles = field && collectionState
    ? field.tiles.filter((tile) => !collectionState.collected.includes(tile.id))
    : [];
  const collectedPrefix = currentWord && collectionState ? currentWord.slice(0, collectionState.nextExpectedIndex) : '';
  const activeTile = activeTileId ? remainingTiles.find((tile) => tile.id === activeTileId) ?? null : null;

  return (
    <View
      ref={containerRef}
      style={styles.container}
      onLayout={() => {
        containerRef.current?.measureInWindow((x, y, width, height) => {
          setContainerBounds({ x, y, width, height });
        });
      }}
    >
      <Pressable testID="back-button" style={styles.backButton} onPress={handleGoHome}>
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Bee Line</Text>
      <Text style={styles.greeting}>
        {profile ? `Hi ${profile.name}! Follow the bee and collect the letters.` : 'Follow the bee and collect the letters.'}
      </Text>
      {selectedList ? <Text style={styles.listName}>List: {selectedList.name}</Text> : null}
      <Text style={styles.modeLine}>Mode: {GAME_MODE_CONFIG[gameMode].label}</Text>

      {words.length === 0 ? (
        <View style={styles.emptyListCard}>
          <Text style={styles.emptyListText}>This list doesn't have any words yet.</Text>
          <Pressable style={styles.secondaryButton} onPress={() => router.replace('/lists')}>
            <Text style={styles.secondaryButtonText}>Add words or pick another list</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.targetCard}>
            <Text style={styles.targetLabel}>Listen and collect it!</Text>
            <Pressable testID="megaphone-button" onPress={handleMegaphonePress}>
              <Text style={styles.targetPrompt}>🎯 🐝</Text>
            </Pressable>
          </View>

          <View style={styles.wordSoFarRow}>
            {collectedPrefix.split('').map((letter, index) => (
              <React.Fragment key={`${letter}-${index}`}>
                {index > 0 ? <Text style={styles.wordSoFarConnector}>{modeConfig.showTowedTrail ? '' : '·'}</Text> : null}
                <View style={styles.wordSoFarTile}>
                  <Text style={styles.wordSoFarTileText}>{letter.toUpperCase()}</Text>
                </View>
              </React.Fragment>
            ))}
            {currentWord && collectedPrefix.length < currentWord.length ? (
              <View style={styles.wordSoFarSlot}>
                <Text style={styles.wordSoFarSlotText}>?</Text>
              </View>
            ) : null}
          </View>

          <View ref={fieldRef} style={styles.field} onLayout={measureField}>
            {modeConfig.showTowedTrail && dockCenter && fieldBounds ? (
              <View
                testID="bee-dock"
                style={[styles.beeDock, { left: dockCenter.x - fieldBounds.x - 24, top: dockCenter.y - fieldBounds.y - 24 }]}
              >
                <Text style={styles.beeDockEmoji}>🐝</Text>
                <View style={styles.trailRow}>
                  {collectedPrefix.split('').map((letter, index) => (
                    <HexTile key={`trail-${index}`} letter={letter} size={30} backgroundColor={theme.colors.gold} />
                  ))}
                </View>
              </View>
            ) : null}

            {remainingTiles.map((tile) => {
              const left = tile.position.x - (fieldBounds?.x ?? 0) - TILE_SIZE / 2;
              const top = tile.position.y - (fieldBounds?.y ?? 0) - TILE_SIZE / 2;

              if (modeConfig.input === 'tap') {
                return (
                  <Pressable
                    key={tile.id}
                    testID={`bee-line-tile-${tile.id}`}
                    style={[styles.tileWrapper, { left, top }]}
                    onPress={() => handleTilePress(tile)}
                  >
                    <HexTile letter={tile.letter} size={TILE_SIZE} />
                  </Pressable>
                );
              }

              const pan = Gesture.Pan()
                .runOnJS(true)
                .onStart((event) => handleDragStart(tile, event.absoluteX, event.absoluteY))
                .onUpdate((event) => handleDragUpdate(event.absoluteX, event.absoluteY))
                .onFinalize((event) => handleDragEnd(tile, event.absoluteX, event.absoluteY));

              return (
                <GestureDetector key={tile.id} gesture={pan}>
                  <View
                    testID={`bee-line-tile-${tile.id}`}
                    style={[styles.tileWrapper, { left, top }, activeTileId === tile.id && styles.tileWrapperHidden]}
                  >
                    <HexTile letter={tile.letter} size={TILE_SIZE} />
                  </View>
                </GestureDetector>
              );
            })}
          </View>

          {activeTile ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.dragGhost,
                {
                  transform: [
                    { translateX: Animated.subtract(ghostAnim.x, GHOST_HALF) },
                    { translateY: Animated.subtract(ghostAnim.y, GHOST_HALF) },
                  ],
                },
              ]}
            >
              <HexTile letter={activeTile.letter} size={TILE_SIZE} />
            </Animated.View>
          ) : null}

          <Text
            testID="bee-line-feedback"
            style={[
              styles.feedback,
              feedback.includes('Not the') || feedback.includes("That's not") || feedback.includes('Drag')
                ? styles.feedbackError
                : styles.feedbackSuccess,
            ]}
          >
            {feedback}
          </Text>
        </>
      )}

      {celebrating ? (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          <Confetti progress={confettiProgress} />
          <Animated.View
            testID="celebration-card"
            style={[
              styles.celebrationCard,
              { opacity: celebrationOpacity, transform: [{ scale: celebrationScale }] },
            ]}
          >
            <Text style={styles.celebrationTitle}>🎉 PERFECT! 🎉</Text>
            <Text style={styles.celebrationPhrase}>{celebrationPhrase}</Text>
          </Animated.View>
        </View>
      ) : null}

      {showBanner && currentWord ? (
        <View style={styles.bannerOverlay} pointerEvents="auto">
          <Animated.View
            style={[styles.bannerCard, { opacity: bannerOpacity, transform: [{ scale: bannerScale }] }]}
          >
            <Text style={styles.bannerFlourish}>🎉 ✨ 🐝 ✨ 🎉</Text>
            <Text testID="target-word" style={styles.bannerWord}>{currentWord.toUpperCase()}</Text>
            <Text style={styles.bannerSubtext}>Listen closely and remember it!</Text>
          </Animated.View>
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <Pressable style={styles.secondaryButton} onPress={() => router.replace('/lists')}>
          <Text style={styles.secondaryButtonText}>📚 Word Lists</Text>
        </Pressable>
        <Pressable style={styles.exitButton} onPress={handleExitApp}>
          <Text style={styles.exitButtonText}>Exit</Text>
        </Pressable>
      </View>
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
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
  },
  greeting: {
    marginTop: theme.spacing.sm,
    color: theme.colors.muted,
    textAlign: 'center',
  },
  listName: {
    marginTop: 2,
    color: theme.colors.muted,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 13,
  },
  modeLine: {
    marginTop: 2,
    color: theme.colors.muted,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyListCard: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#111111',
    gap: theme.spacing.sm,
  },
  emptyListText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  targetCard: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#111111',
    minHeight: 96,
    justifyContent: 'center',
  },
  targetLabel: {
    fontSize: 13,
    color: theme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  targetPrompt: {
    marginTop: theme.spacing.xs,
    fontSize: 32,
  },
  wordSoFarRow: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
  },
  wordSoFarConnector: {
    fontSize: 18,
    color: theme.colors.muted,
    marginHorizontal: 2,
  },
  wordSoFarTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
    borderWidth: 3,
    borderColor: '#111111',
  },
  wordSoFarTileText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.surface,
  },
  wordSoFarSlot: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.xs,
    borderWidth: 3,
    borderColor: '#D4A41C',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  wordSoFarSlotText: {
    fontSize: 16,
    color: theme.colors.muted,
  },
  field: {
    marginTop: theme.spacing.sm,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 340,
    aspectRatio: 1,
    borderRadius: 24,
    backgroundColor: '#F5D998',
    borderWidth: 4,
    borderColor: '#111111',
    overflow: 'hidden',
  },
  beeDock: {
    position: 'absolute',
    width: 48,
    alignItems: 'center',
    // Cosmetic layer only — never part of the field's hit-testable set, so it can never block a
    // remaining tile underneath it (architecture 26.4's render-only trail guarantee).
    zIndex: 5,
    pointerEvents: 'none',
  },
  beeDockEmoji: {
    fontSize: 30,
  },
  trailRow: {
    flexDirection: 'row',
    marginTop: 2,
    gap: -6,
  },
  tileWrapper: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  tileWrapperHidden: {
    opacity: 0,
  },
  dragGhost: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  feedback: {
    marginTop: theme.spacing.lg,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
  },
  feedbackSuccess: {
    color: theme.colors.accent,
  },
  feedbackError: {
    color: theme.colors.primary,
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17,17,17,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  celebrationCard: {
    backgroundColor: theme.colors.accent,
    borderRadius: 28,
    borderWidth: 6,
    borderColor: '#111111',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    maxWidth: '85%',
    shadowColor: '#111111',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  celebrationTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: theme.colors.surface,
    textAlign: 'center',
    letterSpacing: 1,
  },
  celebrationPhrase: {
    marginTop: theme.spacing.sm,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.surface,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: theme.spacing.lg,
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
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17,17,17,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  bannerCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 28,
    borderWidth: 6,
    borderColor: '#111111',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    maxWidth: '85%',
    shadowColor: '#111111',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  bannerFlourish: {
    fontSize: 20,
    marginBottom: theme.spacing.sm,
  },
  bannerWord: {
    fontSize: 48,
    fontWeight: '900',
    color: theme.colors.surface,
    textAlign: 'center',
    letterSpacing: 2,
  },
  bannerSubtext: {
    marginTop: theme.spacing.md,
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.surface,
    textAlign: 'center',
  },
  actionsRow: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  secondaryButton: {
    alignSelf: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 999,
    backgroundColor: '#E4D4FF',
    borderWidth: 3,
    borderColor: '#111111',
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  exitButton: {
    alignSelf: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 999,
    backgroundColor: theme.colors.accent,
    borderWidth: 3,
    borderColor: '#111111',
  },
  exitButtonText: {
    color: theme.colors.surface,
    fontWeight: '700',
  },
});
