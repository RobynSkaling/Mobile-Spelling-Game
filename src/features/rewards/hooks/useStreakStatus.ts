import { useDailyRewardsStore } from '@/stores/daily-rewards-store';
import { getStreakStatus, localDayKey, StreakStatus } from '@/stores/daily-rewards-logic';

export type StreakView = { status: StreakStatus; current: number; isHydrated: boolean };

/** The streak as it should read right now. "Today" is taken at render time: Home and the album
 *  both re-render on every visit (Home is re-mounted by router.replace), so there's no long-lived
 *  screen that would need a midnight timer to roll the day over. */
export function useStreakStatus(): StreakView {
  const streak = useDailyRewardsStore((state) => state.streak);
  const isHydrated = useDailyRewardsStore((state) => state.isHydrated);

  return {
    status: getStreakStatus(streak, localDayKey(Date.now())),
    current: streak.current,
    isHydrated,
  };
}
