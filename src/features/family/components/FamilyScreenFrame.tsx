import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/shared/lib/theme';

type FamilyScreenFrameProps = {
  /** Omit to hide the Back button (e.g. first-launch setup, where there's nowhere to go back to). */
  onBack?: () => void;
  backLabel?: string;
  children: React.ReactNode;
};

/** Shared chrome for the family screens: app background, safe-area padding, an optional Back pill,
 *  and a scrolling, width-capped content column so forms work at 320pt wide and on tablets. */
export function FamilyScreenFrame({ onBack, backLabel = '← Back', children }: FamilyScreenFrameProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + theme.spacing.md, paddingBottom: insets.bottom + theme.spacing.xl },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.column}>
        {onBack ? (
          <Pressable accessibilityRole="button" testID="back-button" style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>{backLabel}</Text>
          </Pressable>
        ) : null}
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  column: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#111111',
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
  },
  backButtonText: {
    fontWeight: '800',
    color: theme.colors.text,
  },
});
