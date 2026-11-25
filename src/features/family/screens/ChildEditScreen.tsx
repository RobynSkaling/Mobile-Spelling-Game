import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { theme } from '@/shared/lib/theme';
import { suggestAvatar } from '@/stores/family-logic';
import { useFamilyStore } from '@/stores/family-store';
import { AVATARS } from '../components/ChildAvatar';
import { ChildForm } from '../components/ChildForm';
import { FamilyScreenFrame } from '../components/FamilyScreenFrame';
import { RequireParent } from '../components/RequireParent';

/** Parent-only add/edit child form (Epic 30). `?id=` edits that child; no id adds a new one. */
export function ChildEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return (
    <RequireParent next={id ? `/child-edit?id=${encodeURIComponent(id)}` : '/child-edit'}>
      <ChildEdit id={id} />
    </RequireParent>
  );
}

function ChildEdit({ id }: { id?: string }) {
  const siblings = useFamilyStore((state) => state.children);
  const child = siblings.find((candidate) => candidate.id === id) ?? null;
  const addChild = useFamilyStore((state) => state.addChild);
  const updateChild = useFamilyStore((state) => state.updateChild);
  const backToList = () => router.replace('/children');

  // An edit link for a child that no longer exists falls back to adding a new one.
  const editing = child !== null;

  return (
    <FamilyScreenFrame onBack={backToList} backLabel="← Children">
      <Text style={styles.title}>{editing ? `Edit ${child.name}` : 'Add a child'}</Text>
      <ChildForm
        // Remount when switching child so the form picks up the right starting values.
        key={child?.id ?? 'new'}
        initial={
          child
            ? {
                name: child.name,
                avatar: child.avatar,
                birthMonth: child.birthMonth ?? undefined,
                birthYear: child.birthYear ?? undefined,
              }
            : { avatar: suggestAvatar(siblings, AVATARS.map((option) => option.emoji)) }
        }
        submitLabel={editing ? 'Save' : 'Add child'}
        onCancel={backToList}
        onSubmit={(input) => {
          const { error } = editing ? updateChild(child.id, input) : addChild(input);
          if (!error) {
            backToList();
          }
          return error;
        }}
      />
    </FamilyScreenFrame>
  );
}

const styles = StyleSheet.create({
  title: {
    alignSelf: 'flex-start',
    fontSize: 26,
    fontWeight: '900',
    color: theme.colors.text,
  },
});
