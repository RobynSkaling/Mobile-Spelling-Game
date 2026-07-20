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
import { appendTrailPathPoint, resolveTrailSegmentPositions } from '@/features/play/logic/snake-trail';
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
// `hard`+'s Snake/Centipede rework (roadmap Epic 19 revision note, post-playtest — see the roadmap
// doc for why the original fixed-dock drag mechanic was replaced). There is no dock/drop-target
// anymore: the head is steered continuously, and these two constants replace `DOCK_HIT_RADIUS`.
// How close the steered head needs to get to a still-uncollected tile to pick it up on contact.
const HEAD_PICKUP_RADIUS_PX = TILE_SIZE * 0.75;
// Center-to-center spacing between trailing body segments, so a long word's tail doesn't sprawl
// too far behind the head but segments still read as visually distinct tiles.
const TRAIL_SEGMENT_SPACING_PX = TILE_SIZE * 0.6;
// A new head-path sample is only kept once the finger has moved at least this far from the last
// recorded one — keeps the path array from growing needlessly while the finger holds still.
const TRAIL_PATH_MIN_POINT_SPACING_PX = 4;
// Generous cap so even a long, wandering drag on the longest supported word can't grow the path
// array unbounded.
const TRAIL_PATH_MAX_POINTS = 600;
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
  // The steered snake head's current position (container-relative, matching `tile.position`'s
  // coordinate space) once at least one letter has been collected; null beforehand, when the head
  // doesn't exist yet and the first letter's tile still sits at its own scattered field position.
  const [headPosition, setHeadPosition] = useState<Point | null>(null);

  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const bannerScale = useRef(new Animated.Value(0.6)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(0.5)).current;
  const confettiProgress = useRef(new Animated.Value(0)).current;
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<View | null>(null);
  const fieldRef = useRef<View | null>(null);
  const resolvingRef = useRef(false);
  // The head's recorded path history (container-relative points, oldest first, current head
  // position last) — kept in a ref so it can grow every drag frame without forcing a re-render on
  // its own; `headPosition` is the reactive trigger that actually schedules the re-render that
  // reads it. Reset whenever a new word starts or the chain breaks.
  const headPathRef = useRef<Point[]>([]);
  // Mirrors `collectionState.collected` as a Set, updated synchronously inside `attemptPickup` —
  // needed because proximity-based pickup checks happen continuously during a drag (multiple times
  // per React commit), and reading `collectionState` itself would risk re-processing the same tile
  // more than once before its collection is reflected in a re-render.
  const collectedIdsRef = useRef<Set<string>>(new Set());

  const { profile } = useProfileStore();
  const selectedList = useWordListStore((state) => state.getSelectedList());
  const words = useMemo(() => selectedList?.words ?? [], [selectedList]);
  const gameMode = useGameModeStore((state) => state.mode);
  // crazy/impossible have no Bee Line-specific behavior yet (Epic 21 adds decoys/re-randomization)
  // — BEE_LINE_MODE_CONFIG already gives them the same input/trail shape as hard by construction,
  // so this screen falls back to hard's head-steered Snake behavior at those tiers with no
  // special-casing.
  const modeConfig = BEE_LINE_MODE_CONFIG[gameMode];
  const bannerDurationMs = GAME_MODE_CONFIG[gameMode].bannerDurationMs;
  const startSession = useProgressStore((state) => state.startSession);
  const recordWordCompleted = useProgressStore((state) => state.recordWordCompleted);

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

  /** Shared by `easy`'s tap handler, `hard`+'s initial-touch pickup, and `hard`+'s continuous
   *  head-proximity pickup — the only thing that differs between all three is how a tile's pickup
   *  attempt is triggered, not what happens once one is. Returns the classification result so
   *  drag callers can synchronously decide whether a head was just born (see
   *  `handleHeadPanStart`), rather than waiting for the next render to observe `collectionState`. */
  const attemptPickup = (tile: ScatteredLetter) => {
    if (resolvingRef.current || !collectionState || collectionState.status !== 'in-progress') {
      return null;
    }

    const result = resolvePickup(collectionState, tile, DEFAULT_BEE_LINE_TUNING);
    setCollectionState(result.next);

    if (result.outcome === 'correct') {
      collectedIdsRef.current.add(tile.id);
      setFeedback('Nice! Right letter.');
      if (result.next.status === 'complete') {
        handleWordComplete(result.next.word);
      }
      return result;
    }

    setFeedback(result.outcome === 'wrong-order' ? "Not the next letter yet — try again!" : "That's not it — try again!");

    if (result.chainBroke && field) {
      // The whole trail scatters back onto the field in new positions (UX Step 18) — Epic 20 owns
      // the actual scatter animation; this just re-places the tiles and clears the mid-break flag
      // once the (currently instant) beat is done. The steered head/trail (hard+'s Snake rework)
      // resets alongside it: a broken chain has no head anymore, so the first letter's tile goes
      // back to being an ordinary undragged scattered tile once the rebuilt field lands.
      resolvingRef.current = true;
      const rebuilt = buildBeeLineField(field.word, modeConfig.decoyLetterCount, fieldBounds!);
      setTimeout(() => {
        setField(rebuilt);
        setCollectionState((state) => (state ? acknowledgeChainBreak(state) : state));
        collectedIdsRef.current = new Set();
        headPathRef.current = [];
        setHeadPosition(null);
        resolvingRef.current = false;
      }, CHAIN_BREAK_HOLD_MS);
    }

    return result;
  };

  const handleTilePress = (tile: ScatteredLetter) => {
    if (modeConfig.input !== 'tap') {
      return;
    }
    attemptPickup(tile);
  };

  /** Continuous proximity check driving `hard`+'s pickup (roadmap Epic 19 revision: the child
   *  steers the head over a tile rather than dragging each tile to a fixed target). Checks every
   *  still-uncollected tile — not just the next expected one — so a steered head that grazes an
   *  out-of-order or decoy tile along the way still triggers the existing mistake classification,
   *  exactly as it would for any other pickup trigger (currently only reachable for `wrong-order`,
   *  since every tier ships with `decoyLetterCount: 0` until Epic 21 — implemented for correctness
   *  regardless, same precedent as the chain-break handling above). */
  const checkHeadProximityPickup = (point: Point) => {
    if (!field) {
      return;
    }

    for (const tile of field.tiles) {
      if (collectedIdsRef.current.has(tile.id)) {
        continue;
      }
      const distance = Math.hypot(point.x - tile.position.x, point.y - tile.position.y);
      if (distance <= HEAD_PICKUP_RADIUS_PX) {
        attemptPickup(tile);
        return;
      }
    }
  };

  /** Fires on touch-start for any still-draggable `hard`+ tile: every not-yet-collected
   *  'correct'-kind tile before the first pickup (decoys are never draggable — dragging one makes
   *  no narrative sense once it's just a passive obstacle), and the head's own persistent element
   *  afterward (a lift-and-regrab resuming control). Before the first pickup, touching the tile
   *  immediately resolves it via `attemptPickup` — the correct-next tile becomes the head on the
   *  spot; any other correct-kind tile immediately registers as the existing wrong-order mistake,
   *  per this epic's chosen resolution of the "which tiles are grabbable at the start" open
   *  question (see the roadmap Epic 19 revision note for the full reasoning). */
  const handleHeadPanStart = (tile: ScatteredLetter, absoluteX: number, absoluteY: number) => {
    if (resolvingRef.current) {
      return;
    }

    if (collectedIdsRef.current.size > 0) {
      // Resuming control of an already-collected head after a lift-and-regrab — the recorded path
      // and trail stay exactly where they were; onUpdate just keeps extending them from here.
      return;
    }

    const result = attemptPickup(tile);
    if (!result || result.outcome !== 'correct') {
      return;
    }

    const point = toContainerRelative({ x: absoluteX, y: absoluteY }, containerBounds);
    headPathRef.current = [point];
    setHeadPosition(point);
  };

  /** Fires on every drag frame once a head exists (a no-op beforehand, for a mistaken touch that
   *  never became a head). Extends the recorded path, moves the head, and checks for a proximity
   *  pickup — this is what makes pickup continuous during the drag rather than a discrete
   *  drop-target check. */
  const handleHeadPanUpdate = (absoluteX: number, absoluteY: number) => {
    if (resolvingRef.current || collectedIdsRef.current.size === 0) {
      return;
    }

    const point = toContainerRelative({ x: absoluteX, y: absoluteY }, containerBounds);
    headPathRef.current = appendTrailPathPoint(headPathRef.current, point, {
      minSpacingPx: TRAIL_PATH_MIN_POINT_SPACING_PX,
      maxLength: TRAIL_PATH_MAX_POINTS,
    });
    setHeadPosition(point);
    checkHeadProximityPickup(point);
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
    // A new word means no head yet — clear the previous word's steered-head state so it doesn't
    // linger into the next round.
    collectedIdsRef.current = new Set();
    headPathRef.current = [];
    setHeadPosition(null);
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

  // hard+'s Snake rework: the tile for the word's first letter (orderIndex 0) is always rendered
  // as the dedicated head element — at its own scattered position before any pickup, at
  // `headPosition` afterward — never as part of the plain scattered list below, so the same
  // View/GestureDetector persists across that transition instead of unmounting mid-gesture.
  const headFieldTile = field ? field.tiles.find((tile) => tile.orderIndex === 0) ?? null : null;
  const dragRemainingTiles = headFieldTile
    ? remainingTiles.filter((tile) => tile.id !== headFieldTile.id)
    : remainingTiles;
  const trailLetters = collectedPrefix.slice(1);
  const trailPositions = resolveTrailSegmentPositions(headPathRef.current, trailLetters.length, TRAIL_SEGMENT_SPACING_PX);
  const headRenderPosition: Point | null = headPosition ?? headFieldTile?.position ?? null;
  const headLeft = headRenderPosition ? headRenderPosition.x - (fieldBounds?.x ?? 0) - TILE_SIZE / 2 : 0;
  const headTop = headRenderPosition ? headRenderPosition.y - (fieldBounds?.y ?? 0) - TILE_SIZE / 2 : 0;
  const headPan = headFieldTile
    ? Gesture.Pan()
        .runOnJS(true)
        .onStart((event) => handleHeadPanStart(headFieldTile, event.absoluteX, event.absoluteY))
        .onUpdate((event) => handleHeadPanUpdate(event.absoluteX, event.absoluteY))
    : null;

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
            {modeConfig.input === 'tap'
              ? remainingTiles.map((tile) => {
                  const left = tile.position.x - (fieldBounds?.x ?? 0) - TILE_SIZE / 2;
                  const top = tile.position.y - (fieldBounds?.y ?? 0) - TILE_SIZE / 2;

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
                })
              : (
                <>
                  {/* Not-yet-collected tiles other than the head. Draggable ('correct'-kind only —
                      dragging a decoy makes no narrative sense) before the first pickup; once a
                      head exists, every one of these is a passive, collision-only obstacle the
                      head can pick up or mistake-trigger on contact. */}
                  {dragRemainingTiles.map((tile) => {
                    const left = tile.position.x - (fieldBounds?.x ?? 0) - TILE_SIZE / 2;
                    const top = tile.position.y - (fieldBounds?.y ?? 0) - TILE_SIZE / 2;
                    const isDraggable = collectionState?.collected.length === 0 && tile.kind === 'correct';

                    if (!isDraggable) {
                      return (
                        <View key={tile.id} testID={`bee-line-tile-${tile.id}`} style={[styles.tileWrapper, { left, top }]}>
                          <HexTile letter={tile.letter} size={TILE_SIZE} />
                        </View>
                      );
                    }

                    const pan = Gesture.Pan()
                      .runOnJS(true)
                      .onStart((event) => handleHeadPanStart(tile, event.absoluteX, event.absoluteY))
                      .onUpdate((event) => handleHeadPanUpdate(event.absoluteX, event.absoluteY));

                    return (
                      <GestureDetector key={tile.id} gesture={pan}>
                        <View testID={`bee-line-tile-${tile.id}`} style={[styles.tileWrapper, { left, top }]}>
                          <HexTile letter={tile.letter} size={TILE_SIZE} />
                        </View>
                      </GestureDetector>
                    );
                  })}

                  {/* Trailing body segments — one per letter collected after the first — placed
                      along the head's recorded path, farthest-from-head first so nearer segments
                      stack visually on top where positions overlap. */}
                  {trailPositions.map((position, index) => {
                    const left = position.x - (fieldBounds?.x ?? 0) - TILE_SIZE / 2;
                    const top = position.y - (fieldBounds?.y ?? 0) - TILE_SIZE / 2;

                    return (
                      <View
                        key={`bee-line-trail-${index}`}
                        pointerEvents="none"
                        style={[styles.tileWrapper, { left, top, zIndex: 5 + (trailPositions.length - index) }]}
                      >
                        <HexTile letter={trailLetters[index]} size={TILE_SIZE} backgroundColor={theme.colors.gold} />
                      </View>
                    );
                  })}

                  {/* The head: the first letter's tile, doubling as the drag handle for the whole
                      chain. Always the same element (never unmounted across the "just a scattered
                      tile" -> "steering the snake" transition), so an in-flight touch survives it. */}
                  {headFieldTile && headPan ? (
                    <GestureDetector gesture={headPan}>
                      <View
                        testID="bee-line-head"
                        style={[styles.tileWrapper, styles.headWrapper, { left: headLeft, top: headTop }]}
                      >
                        <Text style={styles.beeRider} pointerEvents="none">🐝</Text>
                        <HexTile letter={headFieldTile.letter} size={TILE_SIZE} />
                      </View>
                    </GestureDetector>
                  ) : null}
                </>
              )}
          </View>

          <Text
            testID="bee-line-feedback"
            style={[
              styles.feedback,
              feedback.includes('Not the') || feedback.includes("That's not")
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
  tileWrapper: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  headWrapper: {
    alignItems: 'center',
    // Always drawn above every trailing segment and passive tile it might overlap.
    zIndex: 20,
  },
  beeRider: {
    position: 'absolute',
    top: -18,
    fontSize: 22,
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
