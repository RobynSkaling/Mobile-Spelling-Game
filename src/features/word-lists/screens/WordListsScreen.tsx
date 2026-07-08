import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { theme } from '@/shared/lib/theme';
import { useWordListStore } from '@/stores/word-list-store';
import { BUILT_IN_WORD_LISTS } from '@/data/word-lists/built-in-word-lists';
import { MAX_CUSTOM_LISTS } from '@/features/word-lists/types';

export function WordListsScreen() {
  const customLists = useWordListStore((state) => state.customLists);
  const selectedListId = useWordListStore((state) => state.selectedListId);
  const selectList = useWordListStore((state) => state.selectList);
  const deleteList = useWordListStore((state) => state.deleteList);
  const createList = useWordListStore((state) => state.createList);

  const [newListName, setNewListName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const atListCap = customLists.length >= MAX_CUSTOM_LISTS;

  const handleCreate = () => {
    const { list, error } = createList(newListName);
    if (error || !list) {
      setCreateError(error);
      return;
    }
    setNewListName('');
    setCreateError(null);
    router.replace({ pathname: '/list-editor', params: { listId: list.id } });
  };

  const handleDeleteConfirmed = (id: string) => {
    deleteList(id);
    setConfirmDeleteId(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.replace('/home')}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Word Lists</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView testID="word-lists-scroll" contentContainerStyle={styles.scrollContent}>
        <Text testID="built-in-section-label" style={styles.sectionLabel}>Built-in lists</Text>
        {BUILT_IN_WORD_LISTS.map((list) => (
          <ListCard
            key={list.id}
            name={list.name}
            wordCount={list.words.length}
            badge={`Age ${list.ageGroup}`}
            isSelected={list.id === selectedListId}
            onSelect={() => selectList(list.id)}
          />
        ))}

        <Text style={styles.sectionLabel}>Your lists</Text>
        {customLists.length === 0 ? (
          <Text style={styles.emptyText}>No custom lists yet — create one below using words from school homework!</Text>
        ) : null}
        {customLists.map((list) => (
          <ListCard
            key={list.id}
            name={list.name}
            wordCount={list.words.length}
            badge="Custom"
            isSelected={list.id === selectedListId}
            onSelect={() => selectList(list.id)}
            onEdit={() => router.replace({ pathname: '/list-editor', params: { listId: list.id } })}
            onDeleteRequest={() => setConfirmDeleteId(list.id)}
            confirmingDelete={confirmDeleteId === list.id}
            onConfirmDelete={() => handleDeleteConfirmed(list.id)}
            onCancelDelete={() => setConfirmDeleteId(null)}
          />
        ))}

        <View style={styles.createCard}>
          <Text style={styles.createLabel}>
            {atListCap ? `You have the maximum of ${MAX_CUSTOM_LISTS} lists` : 'Create a new list'}
          </Text>
          {!atListCap ? (
            <>
              <TextInput
                value={newListName}
                onChangeText={(value) => {
                  setNewListName(value);
                  setCreateError(null);
                }}
                placeholder="e.g. Miss Smith's Week 4 List"
                style={styles.createInput}
              />
              {createError ? <Text style={styles.errorText}>{createError}</Text> : null}
              <Pressable style={styles.createButton} onPress={handleCreate}>
                <Text style={styles.createButtonText}>+ Create List</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

type ListCardProps = {
  name: string;
  wordCount: number;
  badge: string;
  isSelected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  onDeleteRequest?: () => void;
  confirmingDelete?: boolean;
  onConfirmDelete?: () => void;
  onCancelDelete?: () => void;
};

function ListCard({
  name,
  wordCount,
  badge,
  isSelected,
  onSelect,
  onEdit,
  onDeleteRequest,
  confirmingDelete,
  onConfirmDelete,
  onCancelDelete,
}: ListCardProps) {
  return (
    <Pressable
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onSelect}
      testID={`list-card-${name}`}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
        {isSelected ? (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>✓ Selected</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.cardName}>{name}</Text>
      <Text style={styles.cardWordCount}>{wordCount} word{wordCount === 1 ? '' : 's'}</Text>

      {onEdit || onDeleteRequest ? (
        <View style={styles.cardActionsRow}>
          {onEdit ? (
            <Pressable style={styles.cardActionButton} onPress={onEdit}>
              <Text style={styles.cardActionButtonText}>✏️ Edit</Text>
            </Pressable>
          ) : null}
          {onDeleteRequest && !confirmingDelete ? (
            <Pressable style={styles.cardActionButton} onPress={onDeleteRequest}>
              <Text style={styles.cardActionButtonText}>🗑️ Delete</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {confirmingDelete ? (
        <View style={styles.confirmRow}>
          <Text style={styles.confirmText}>Delete "{name}"?</Text>
          <Pressable style={styles.confirmYesButton} onPress={onConfirmDelete}>
            <Text style={styles.confirmYesText}>Yes, delete</Text>
          </Pressable>
          <Pressable style={styles.confirmNoButton} onPress={onCancelDelete}>
            <Text style={styles.confirmNoText}>Cancel</Text>
          </Pressable>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.sm,
  },
  backButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 3,
    borderColor: '#111111',
  },
  backButtonText: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
  },
  headerSpacer: {
    width: 76,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#111111',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: '#111111',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  cardSelected: {
    backgroundColor: '#FFF0B8',
    borderColor: theme.colors.primary,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.secondary,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#111111',
  },
  badgeText: {
    color: theme.colors.surface,
    fontWeight: '800',
    fontSize: 12,
  },
  selectedBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#111111',
  },
  selectedBadgeText: {
    color: theme.colors.surface,
    fontWeight: '800',
    fontSize: 12,
  },
  cardName: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  cardWordCount: {
    color: theme.colors.muted,
    marginTop: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  cardActionButton: {
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 999,
    backgroundColor: '#FFE38A',
    borderWidth: 2,
    borderColor: '#111111',
  },
  cardActionButtonText: {
    fontWeight: '700',
    color: theme.colors.text,
    fontSize: 13,
  },
  confirmRow: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: 14,
    backgroundColor: '#FFDCDC',
    borderWidth: 2,
    borderColor: '#111111',
  },
  confirmText: {
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  confirmYesButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: '#111111',
    marginBottom: theme.spacing.xs,
  },
  confirmYesText: {
    color: theme.colors.surface,
    fontWeight: '700',
    fontSize: 13,
  },
  confirmNoButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: '#111111',
  },
  confirmNoText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  createCard: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: 20,
    backgroundColor: '#FFE082',
    borderWidth: 4,
    borderColor: '#111111',
  },
  createLabel: {
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  createInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 3,
    borderColor: '#111111',
    borderRadius: 14,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.primary,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  createButton: {
    alignSelf: 'flex-start',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    borderWidth: 3,
    borderColor: '#111111',
  },
  createButtonText: {
    color: theme.colors.surface,
    fontWeight: '800',
  },
});
