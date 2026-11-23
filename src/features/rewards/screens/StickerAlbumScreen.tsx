import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/shared/lib/theme';
import { useReduceMotion } from '@/shared/lib/accessibility';
import { Character } from '@/shared/ui/Character';
import { Hexagon } from '@/shared/ui/Hexagon';
import { STICKER_CATALOG } from '@/data/rewards/sticker-catalog';
import { useDailyRewardsStore } from '@/stores/daily-rewards-store';
import { AlbumSlot, buildAlbumSlots, countCollected } from '../logic/sticker-album';
import { getStreakBanner } from '../logic/streak-display';
import { useStreakStatus } from '../hooks/useStreakStatus';

// Sized so three slots fit per row on a 320pt-wide phone (3 x 88 + 2 x 8 gap = 280 <= 320 - 2 x 16
// padding), keeping the grid compact rather than one long two-column scroll.
const SLOT_SIZE = 72;
/** The gold milestone frame is a slightly larger gold hex sitting behind the slot — the same
 *  "bigger shape behind" outline trick as Home's Play triangle, since RN can't border a hex. */
const MILESTONE_FRAME = 10;
const SLOT_WIDTH = 88;
const SILHOUETTE_COLOR = '#B9B6C9';

const RARITY_COLORS: Record<AlbumSlot['sticker']['rarity'], string> = {
  common: theme.colors.secondary,
  rare: theme.colors.accent,
  milestone: theme.colors.gold,
};

type StickerAlbumScreenProps = {
  visible: boolean;
  /** One tap back to Home (UX Step 21) — the ✕ and the Android back gesture. */
  onClose: () => void;
  /** The dominant "Back to Play" action — same destination as Home's Play button. */
  onPlay: () => void;
};

/**
 * The child-facing sticker book (UX Step 21), presented as a modal over Home rather than a stacked
 * route, so it reads as "a quick, proud peek" and not a second hub competing with Play. Read-only:
 * it only ever reads daily-rewards-store, never writes to it.
 */
export function StickerAlbumScreen({ visible, onClose, onPlay }: StickerAlbumScreenProps) {
  const earned = useDailyRewardsStore((state) => state.album.earned);
  const { status, current } = useStreakStatus();
  const [selected, setSelected] = useState<AlbumSlot | null>(null);

  const slots = useMemo(() => buildAlbumSlots(STICKER_CATALOG, earned), [earned]);
  const collected = countCollected(slots);
  const banner = getStreakBanner(status, current);
  const resting = status === 'resting';

  const handleClose = () => {
    setSelected(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
              My Sticker Book
            </Text>
            <Pressable
              testID="sticker-album-close"
              accessibilityRole="button"
              accessibilityLabel="Close sticker book"
              hitSlop={10}
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <View testID="sticker-album-banner" style={[styles.banner, resting && styles.bannerResting]}>
            <Character
              characterId="mama-bear"
              size="small"
              animationState={resting ? 'Idle' : 'Celebrating'}
              style={styles.bannerCharacter}
            />
            <View style={styles.bannerTextBlock}>
              <Text style={styles.bannerHeadline}>{banner.headline}</Text>
              {banner.caption ? <Text style={styles.bannerCaption}>{banner.caption}</Text> : null}
            </View>
          </View>

          <Text style={styles.collectedLabel}>
            {collected} of {slots.length} stickers collected
          </Text>

          <View style={styles.grid}>
            {slots.map((slot) => (
              <StickerSlot key={slot.sticker.id} slot={slot} onPress={() => setSelected(slot)} />
            ))}
          </View>

          <Pressable
            testID="sticker-album-play"
            accessibilityRole="button"
            style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}
            onPress={() => {
              setSelected(null);
              onPlay();
            }}
          >
            <Text style={styles.playButtonText}>▶ Back to Play</Text>
          </Pressable>
        </ScrollView>

        {selected ? <CaptionPopup slot={selected} onDismiss={() => setSelected(null)} /> : null}
      </View>
    </Modal>
  );
}

function StickerSlot({ slot, onPress }: { slot: AlbumSlot; onPress: () => void }) {
  const { sticker, earned } = slot;
  const isMilestone = sticker.rarity === 'milestone';
  const name = earned ? sticker.name : 'Mystery sticker';

  return (
    <Pressable
      testID={`sticker-slot-${sticker.id}`}
      accessibilityRole="button"
      accessibilityLabel={earned ? `${sticker.name}${earned.count > 1 ? `, times ${earned.count}` : ''}` : 'Mystery sticker, not collected yet'}
      onPress={onPress}
      style={({ pressed }) => [styles.slot, pressed && styles.pressed]}
    >
      <View style={styles.slotHexArea}>
        {isMilestone ? <MilestoneFrame shimmer={earned !== null} /> : null}
        <Hexagon size={SLOT_SIZE} backgroundColor={earned ? RARITY_COLORS[sticker.rarity] : SILHOUETTE_COLOR}>
          {/* Not-yet-earned slots show a faded bee silhouette in the same hex, so the shape of the
              whole collection is visible from day one (UX Step 21). */}
          <Text style={[styles.slotGlyph, !earned && styles.slotGlyphSilhouette]}>{earned ? sticker.emoji : '🐝'}</Text>
        </Hexagon>
        {earned && earned.count > 1 ? (
          // The "twin bees" duplicate gag: the sticker shows once, a small badge notes the count.
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>x{earned.count}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.slotName, !earned && styles.slotNameMystery]} numberOfLines={2}>
        {name}
      </Text>
    </Pressable>
  );
}

/** Gold sparkle frame for milestone stickers (UX Step 21). The shimmer is a gentle opacity pulse,
 *  skipped entirely under the OS reduce-motion setting (architecture 25.8) — the gold frame and
 *  sparkle stay, so the sticker still reads as special without any motion. */
function MilestoneFrame({ shimmer }: { shimmer: boolean }) {
  const reduceMotion = useReduceMotion();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!shimmer || reduceMotion) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.45, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer, reduceMotion, pulse]);

  return (
    <>
      <Animated.View style={[styles.milestoneFrame, { opacity: pulse }]} pointerEvents="none">
        <Hexagon size={SLOT_SIZE + MILESTONE_FRAME} backgroundColor={theme.colors.gold} />
      </Animated.View>
      <Text style={styles.sparkle} pointerEvents="none">
        ✨
      </Text>
    </>
  );
}

function CaptionPopup({ slot, onDismiss }: { slot: AlbumSlot; onDismiss: () => void }) {
  const { sticker, earned } = slot;

  return (
    <Pressable testID="sticker-caption-popup" style={styles.popupBackdrop} onPress={onDismiss} accessibilityLabel="Close">
      <View style={styles.popupCard}>
        <Text style={styles.popupGlyph}>{earned ? sticker.emoji : '🐝'}</Text>
        <Text style={styles.popupName}>{earned ? `${sticker.name}!` : 'Mystery sticker!'}</Text>
        <Text style={styles.popupCaption}>
          {earned ? sticker.caption : "Keep playing each day to find out who's hiding here."}
        </Text>
        <Text style={styles.popupHint}>Tap anywhere to close</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  // Title and ✕ share one row as flex siblings (not an absolutely-positioned ✕), so the close
  // button can never sit on top of the title on a narrow phone.
  headerRow: {
    alignSelf: 'stretch',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  title: {
    flex: 1,
    fontSize: 26,
    fontWeight: '900',
    color: theme.colors.text,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 3,
    borderColor: '#111111',
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.text,
  },
  banner: {
    alignSelf: 'stretch',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#111111',
    backgroundColor: theme.colors.gold,
    marginBottom: theme.spacing.md,
  },
  bannerResting: {
    backgroundColor: theme.colors.rest,
  },
  bannerCharacter: {
    flexShrink: 0,
  },
  bannerTextBlock: {
    flex: 1,
  },
  bannerHeadline: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.text,
  },
  bannerCaption: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  collectedLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: theme.spacing.xs,
    rowGap: theme.spacing.sm,
    maxWidth: 420,
    marginBottom: theme.spacing.lg,
  },
  slot: {
    width: SLOT_WIDTH,
    alignItems: 'center',
  },
  slotHexArea: {
    width: SLOT_SIZE + MILESTONE_FRAME,
    height: SLOT_SIZE + MILESTONE_FRAME,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneFrame: {
    position: 'absolute',
  },
  sparkle: {
    position: 'absolute',
    top: -4,
    right: -2,
    fontSize: 20,
  },
  slotGlyph: {
    fontSize: SLOT_SIZE * 0.42,
  },
  slotGlyphSilhouette: {
    opacity: 0.25,
  },
  countBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#111111',
    backgroundColor: theme.colors.surface,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.text,
  },
  slotName: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
  },
  slotNameMystery: {
    color: theme.colors.muted,
  },
  // Same `success`-green family as Home's Play button, sized to be the screen's one obvious next
  // action (UX Step 21).
  playButton: {
    minWidth: 240,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: '#111111',
    backgroundColor: theme.colors.success,
  },
  playButtonText: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.surface,
    textShadowColor: '#111111',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  popupBackdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(17, 17, 17, 0.45)',
  },
  popupCard: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#111111',
    backgroundColor: theme.colors.surface,
  },
  popupGlyph: {
    fontSize: 56,
  },
  popupName: {
    marginTop: theme.spacing.xs,
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.text,
    textAlign: 'center',
  },
  popupCaption: {
    marginTop: theme.spacing.xs,
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
  popupHint: {
    marginTop: theme.spacing.md,
    fontSize: 12,
    color: theme.colors.muted,
  },
});
