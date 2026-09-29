import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useProfileStore } from '@/stores/profile-store';
import { useWordListStore } from '@/stores/word-list-store';
import { useGameModeStore } from '@/stores/game-mode-store';
import { useGameSelectionStore } from '@/stores/game-selection-store';
import { useProgressStore } from '@/stores/progress-store';
import { useDailyRewardsStore } from '@/stores/daily-rewards-store';
import { speechService } from '@/shared/lib/speech';

export default function RootLayout() {
  const loadProfile = useProfileStore((state) => state.loadProfile);
  const loadLists = useWordListStore((state) => state.loadLists);
  const loadMode = useGameModeStore((state) => state.loadMode);
  const loadSelectedGame = useGameSelectionStore((state) => state.loadSelectedGame);
  const loadProgress = useProgressStore((state) => state.loadProgress);
  const loadDailyRewards = useDailyRewardsStore((state) => state.loadDailyRewards);

  useEffect(() => {
    loadProfile();
    loadLists();
    loadMode();
    loadSelectedGame();
    loadProgress();
    loadDailyRewards();
    speechService.init();
  }, [loadProfile, loadLists, loadMode, loadSelectedGame, loadProgress, loadDailyRewards]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
