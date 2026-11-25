import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/shared/lib/theme';
import { ChildAvatar } from '@/features/family/components/ChildAvatar';
import type { ChildProfile } from '@/stores/family-logic';

type ChildSwitcherProps = {
  childProfiles: ChildProfile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/**
 * Chooses which child the Parent View shows. It only picks what is being looked at; it never
 * changes who is playing.
 */
export function ChildSwitcher({ childProfiles, selectedId, onSelect }: ChildSwitcherProps) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {childProfiles.map((child) => {
        const selected = child.id === selectedId;
        return (
          <Pressable
            key={child.id}
            testID={`report-child-${child.id}`}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`Show ${child.name}`}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => onSelect(child.id)}
          >
            <ChildAvatar emoji={child.avatar} size={28} />
            <Text style={styles.name} numberOfLines={1}>
              {child.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    maxWidth: '100%',
    paddingVertical: 4,
    paddingLeft: 6,
    paddingRight: theme.spacing.sm,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#111111',
    backgroundColor: theme.colors.surface,
  },
  chipSelected: {
    backgroundColor: theme.colors.gold,
  },
  name: {
    flexShrink: 1,
    fontWeight: '800',
    color: theme.colors.text,
  },
});
