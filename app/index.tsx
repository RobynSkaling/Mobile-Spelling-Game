import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { theme } from '@/shared/lib/theme';
import { getLaunchRoute } from '@/stores/family-logic';
import { useFamilyStore } from '@/stores/family-store';

/** App launch (Epic 30): first-time parent setup, "Who's playing?" for 2+ children, or straight to
 *  Home. Waits for the family to load so it never routes on the empty default. */
export default function Index() {
  const isHydrated = useFamilyStore((state) => state.isHydrated);
  const children = useFamilyStore((state) => state.children);

  if (!isHydrated) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
  }
  return <Redirect href={getLaunchRoute({ children })} />;
}
