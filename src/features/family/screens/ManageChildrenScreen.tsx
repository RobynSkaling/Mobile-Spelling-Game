import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { theme } from '@/shared/lib/theme';
import { ChildProfile, getAge, MAX_CHILDREN, verifyPin } from '@/stores/family-logic';
import { useFamilyStore } from '@/stores/family-store';
import { ChildAvatar } from '../components/ChildAvatar';
import { FamilyScreenFrame } from '../components/FamilyScreenFrame';
import { PinPad } from '../components/PinPad';
import { RequireParent } from '../components/RequireParent';

function describeAge(child: ChildProfile): string {
  const now = new Date();
  const age = getAge(child.birthMonth, child.birthYear, { year: now.getFullYear(), month: now.getMonth() + 1 });
  return age === null ? 'Age not set yet: tap Edit to add it' : `Age ${age}`;
}

/** Parent-only list of children (Epic 30): add, edit, and remove. Removing asks for the PIN again,
 *  warns what will be lost, and can be cancelled. */
export function ManageChildrenScreen() {
  return (
    <RequireParent next="/children">
      <ManageChildren />
    </RequireParent>
  );
}

function ManageChildren() {
  const children = useFamilyStore((state) => state.children);
  const parent = useFamilyStore((state) => state.parent);
  const removeChild = useFamilyStore((state) => state.removeChild);

  const [removing, setRemoving] = useState<ChildProfile | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const atLimit = children.length >= MAX_CHILDREN;

  if (removing) {
    const cancelRemove = () => {
      setPinError(null);
      setRemoving(null);
    };
    return (
      // Cancel is offered at the top as well as under the keypad, so it's reachable without
      // scrolling on a small phone.
      <FamilyScreenFrame onBack={cancelRemove} backLabel="← Cancel">

        <View style={styles.card}>
          <Text style={styles.warningTitle}>Remove {removing.name}?</Text>
          <Text style={styles.warningBody}>
            This deletes {removing.name}'s progress, streak, and stickers. It can't be undone.
          </Text>
          <PinPad
            testID="remove-child-pin"
            title="Enter the parent PIN to remove"
            error={pinError}
            onComplete={(pin) => {
              if (!verifyPin(parent, pin)) {
                setPinError("That's not the right PIN.");
                return;
              }
              const { error } = removeChild(removing.id);
              setNotice(error ?? `${removing.name} was removed.`);
              setPinError(null);
              setRemoving(null);
            }}
          />
          <Pressable
            testID="cancel-remove"
            accessibilityRole="button"
            onPress={cancelRemove}
            style={[styles.button, styles.cancelButton, styles.cancelRemove]}
          >
            <Text style={styles.buttonText}>Cancel, keep {removing.name}</Text>
          </Pressable>
        </View>
      </FamilyScreenFrame>
    );
  }

  return (
    <FamilyScreenFrame onBack={() => router.replace('/parent')} backLabel="← Parent View">
      <Text style={styles.title}>Children</Text>
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <View style={styles.list}>
        {children.map((child) => (
          <View key={child.id} testID={`child-row-${child.id}`} style={styles.row}>
            <ChildAvatar emoji={child.avatar} size={52} />
            <View style={styles.rowText}>
              <Text style={styles.rowName} numberOfLines={1}>
                {child.name}
              </Text>
              <Text style={styles.rowAge}>{describeAge(child)}</Text>
            </View>
            <View style={styles.rowActions}>
              <Pressable
                testID={`edit-child-${child.id}`}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${child.name}`}
                onPress={() => router.replace(`/child-edit?id=${encodeURIComponent(child.id)}`)}
                style={[styles.smallButton, styles.editButton]}
              >
                <Text style={styles.smallButtonText}>Edit</Text>
              </Pressable>
              <Pressable
                testID={`remove-child-${child.id}`}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${child.name}`}
                onPress={() => {
                  setNotice(null);
                  if (children.length === 1) {
                    setNotice('A family needs at least one child. Add another child before removing this one.');
                    return;
                  }
                  setRemoving(child);
                }}
                style={[styles.smallButton, styles.removeButton]}
              >
                <Text style={styles.smallButtonText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <Pressable
        testID="add-child-button"
        accessibilityRole="button"
        disabled={atLimit}
        onPress={() => router.replace('/child-edit')}
        style={[styles.button, styles.addButton, atLimit && styles.disabled]}
      >
        <Text style={[styles.buttonText, styles.addText]}>＋ Add a child</Text>
      </Pressable>
      <Text style={styles.limit}>
        {atLimit ? `That's the most children a family can have (${MAX_CHILDREN}).` : `Up to ${MAX_CHILDREN} children.`}
      </Text>
    </FamilyScreenFrame>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  notice: {
    alignSelf: 'stretch',
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#111111',
    backgroundColor: theme.colors.surface,
    fontWeight: '700',
    color: theme.colors.text,
  },
  list: {
    alignSelf: 'stretch',
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#111111',
    backgroundColor: theme.colors.surface,
  },
  rowText: {
    flex: 1,
  },
  rowName: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.text,
  },
  rowAge: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.muted,
  },
  rowActions: {
    gap: 6,
  },
  smallButton: {
    minWidth: 76,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#111111',
  },
  editButton: {
    backgroundColor: theme.colors.gold,
  },
  // Deliberately not `primary` Tomato: that colour means "wrong answer" to the children.
  removeButton: {
    backgroundColor: theme.colors.surface,
  },
  smallButtonText: {
    fontWeight: '800',
    color: theme.colors.text,
  },
  button: {
    alignSelf: 'stretch',
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#111111',
  },
  addButton: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.success,
  },
  addText: {
    color: theme.colors.surface,
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
  },
  cancelRemove: {
    marginTop: theme.spacing.md,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
  },
  disabled: {
    opacity: 0.45,
  },
  limit: {
    marginTop: theme.spacing.xs,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.muted,
  },
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#111111',
    backgroundColor: theme.colors.surface,
  },
  warningTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.text,
    textAlign: 'center',
  },
  warningBody: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
});
