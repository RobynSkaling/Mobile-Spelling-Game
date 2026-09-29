import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  applyCompletedSession,
  DailyRewardsState,
  dailyRewardsKey,
  DailyStreakState,
  DEFAULT_GRACE_DAYS,
  EarnedSticker,
  StickerAlbumState,
  toDayKey,
} from './daily-rewards-logic';
import { STICKER_CATALOG } from '@/data/rewards/sticker-catalog';

const SCHEMA_VERSION = 1;

function createInitialState(): DailyRewardsState {
  return {
    streak: { current: 0, longest: 0, lastPlayedDay: null, graceRemaining: DEFAULT_GRACE_DAYS },
    album: { earned: {} },
    schemaVersion: SCHEMA_VERSION,
  };
}

function persist(rewards: DailyRewardsState) {
  AsyncStorage.setItem(dailyRewardsKey(), JSON.stringify(rewards));
}

/**
 * Awards a sticker for a qualifying completed-play day. The catalog/pacing is still a placeholder
 * (architecture 27.9/27.10), so this is deliberately the simplest thing that works: walk the common
 * stickers in catalog order and hand out the first one not yet earned; once every common sticker has
 * been earned at least once, keep incrementing the first common sticker's count (the "twin bees"
 * duplicate gag, architecture 27.3) rather than reaching into rare/milestone tiers — real earn
 * pacing across rarities is future content work, not this epic's job.
 */
function awardSticker(album: StickerAlbumState, today: string): StickerAlbumState {
  const commonIds = STICKER_CATALOG.filter((sticker) => sticker.rarity === 'common').map((sticker) => sticker.id);
  const targetId = commonIds.find((id) => !album.earned[id]) ?? commonIds[0];

  if (!targetId) {
    // No common stickers configured at all — nothing to award. Guards an empty/misconfigured
    // catalog rather than assuming the seeded placeholder set always has one.
    return album;
  }

  const existing = album.earned[targetId];
  const nextEntry: EarnedSticker = existing
    ? { ...existing, count: existing.count + 1 }
    : { id: targetId, firstEarnedOn: today, count: 1 };

  return { earned: { ...album.earned, [targetId]: nextEntry } };
}

interface DailyRewardsStore {
  streak: DailyStreakState;
  album: StickerAlbumState;
  schemaVersion: number;
  isHydrated: boolean;
  loadDailyRewards: () => Promise<void>;
  /** Called on any word/round completion, in any game, per architecture 27.6's shared
   *  completed-session signal. Debounced to once per DayKey. Must never import session-store.ts or
   *  write to progress-store.ts — this store only observes "a completed session happened today." */
  recordCompletedPlay: (nowMs: number) => void;
}

const INITIAL_STATE = createInitialState();

export const useDailyRewardsStore = create<DailyRewardsStore>((set, get) => ({
  streak: INITIAL_STATE.streak,
  album: INITIAL_STATE.album,
  schemaVersion: INITIAL_STATE.schemaVersion,
  isHydrated: false,

  loadDailyRewards: async () => {
    const stored = await AsyncStorage.getItem(dailyRewardsKey());
    const rewards: DailyRewardsState = stored ? JSON.parse(stored) : createInitialState();

    set({
      streak: rewards.streak,
      album: rewards.album,
      schemaVersion: rewards.schemaVersion,
      isHydrated: true,
    });
  },

  recordCompletedPlay: (nowMs) => {
    const { streak, album, schemaVersion } = get();
    // Date.prototype.getTimezoneOffset() returns minutes local time is BEHIND UTC, positive for
    // zones west of UTC (e.g. +300 for EST). toDayKey wants the conventional UTC-offset sign instead
    // (local = UTC + tzOffsetMinutes, e.g. EST is -300), so the sign is flipped here.
    const tzOffsetMinutes = -new Date(nowMs).getTimezoneOffset();
    const today = toDayKey(nowMs, tzOffsetMinutes);

    if (streak.lastPlayedDay === today) {
      // First completion of the day already recorded — debounced to once per DayKey (27.6): no
      // re-run of applyCompletedSession, no duplicate sticker.
      return;
    }

    const outcome = applyCompletedSession(streak, today, { graceDays: DEFAULT_GRACE_DAYS });
    if (!outcome.qualifiesToday) {
      // Clock moved backward relative to lastPlayedDay — clamped no-op, nothing to persist.
      return;
    }

    const nextAlbum = awardSticker(album, today);
    const nextState: DailyRewardsState = { streak: outcome.streak, album: nextAlbum, schemaVersion };

    set({ streak: nextState.streak, album: nextState.album });
    persist(nextState);
  },
}));
