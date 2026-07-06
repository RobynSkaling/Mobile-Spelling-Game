import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useProfileStore } from '@/stores/profile-store';

export default function RootLayout() {
  const loadProfile = useProfileStore((state) => state.loadProfile);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
