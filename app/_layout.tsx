import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { startAppData } from '@/stores/per-child-data';
import { speechService } from '@/shared/lib/speech';

export default function RootLayout() {
  useEffect(() => {
    startAppData();
    speechService.init();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
