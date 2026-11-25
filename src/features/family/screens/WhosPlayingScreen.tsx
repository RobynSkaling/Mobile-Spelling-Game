import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { theme } from '@/shared/lib/theme';
import { useFamilyStore } from '@/stores/family-store';
import { ChildAvatar } from '../components/ChildAvatar';
import { FamilyScreenFrame } from '../components/FamilyScreenFrame';

/**
 * "Who's playing?" (Epic 30): large avatar + name tiles, one tap to pick a child and go to Home. No
 * passwords for children (roadmap Section 13, decision 2). Shown on launch when there are 2+
 * children, and from Home's avatar chip any time.
 */
export function WhosPlayingScreen() {
  const children = useFamilyStore((state) => state.children);
  const activeChildId = useFamilyStore((state) => state.activeChildId);
  const setActiveChild = useFamilyStore((state) => state.setActiveChild);

  if (children.length === 0) {
    return <Redirect href="/parent-setup" />;
  }

  return (
    <FamilyScreenFrame>
      <Text style={styles.title}>Who's playing?</Text>

      <View style={styles.grid}>
        {children.map((child) => {
          const current = child.id === activeChildId;
          return (
            <Pressable
              key={child.id}
              testID={`whos-playing-${child.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${child.name}${current ? ', playing now' : ''}`}
              onPress={() => {
                setActiveChild(child.id);
                router.replace('/home');
              }}
              style={({ pressed }) => [styles.tile, current && styles.tileCurrent, pressed && styles.pressed]}
            >
              <ChildAvatar emoji={child.avatar} size={84} />
              <Text style={styles.name} numberOfLines={1}>
                {child.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        testID="manage-children-link"
        accessibilityRole="button"
        accessibilityLabel="Grown-ups: add or change children"
        onPress={() => router.replace('/parent-gate?next=/children')}
        style={styles.grownUps}
      >
        <Text style={styles.grownUpsText}>👪 Grown-ups: add or change children</Text>
      </Pressable>
    </FamilyScreenFrame>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    fontSize: 30,
    fontWeight: '900',
    color: theme.colors.text,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  // Two tiles per row at 320pt wide (2 x 136 + 16 gap = 288).
  tile: {
    width: 136,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#111111',
    backgroundColor: theme.colors.surface,
  },
  tileCurrent: {
    backgroundColor: theme.colors.gold,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  name: {
    marginTop: theme.spacing.sm,
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.text,
    maxWidth: '100%',
  },
  grownUps: {
    marginTop: theme.spacing.xl,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  grownUpsText: {
    fontWeight: '700',
    color: theme.colors.muted,
    textDecorationLine: 'underline',
  },
});
