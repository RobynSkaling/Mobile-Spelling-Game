import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useProfileStore } from '@/stores/profile-store';
import { useWordListStore } from '@/stores/word-list-store';

export default function RootLayout() {
  const loadProfile = useProfileStore((state) => state.loadProfile);
  const loadLists = useWordListStore((state) => state.loadLists);

  useEffect(() => {
    loadProfile();
    loadLists();
  }, [loadProfile, loadLists]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
