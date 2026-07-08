import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { theme } from '@/shared/lib/theme';
import { useWordListStore } from '@/stores/word-list-store';
import { MAX_WORDS_PER_LIST } from '@/features/word-lists/types';

export function ListEditorScreen() {
  const { listId } = useLocalSearchParams<{ listId?: string }>();
  const customLists = useWordListStore((state) => state.customLists);
  const renameList = useWordListStore((state) => state.renameList);
  const addWord = useWordListStore((state) => state.addWord);
  const editWord = useWordListStore((state) => state.editWord);
  const deleteWord = useWordListStore((state) => state.deleteWord);
  const deleteList = useWordListStore((state) => state.deleteList);

  const list = customLists.find((l) => l.id === listId);

  const [name, setName] = useState(list?.name ?? '');
  const [newWord, setNewWord] = useState('');
  const [wordError, setWordError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [confirmingDeleteList, setConfirmingDeleteList] = useState(false);

  if (!list) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>List not found</Text>
        <Text style={styles.message}>This list may have been deleted.</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.replace('/lists')}>
          <Text style={styles.primaryButtonText}>Back to Word Lists</Text>
        </Pressable>
      </View>
    );
  }

  const handleNameBlur = () => {
    if (name.trim() && name.trim() !== list.name) {
      renameList(list.id, name);
    }
  };

  const handleAddWord = () => {
    const result = addWord(list.id, newWord);
    if (!result.success) {
      setWordError(result.error);
      return;
    }
    setNewWord('');
    setWordError(null);
  };

  const startEditing = (index: number, currentValue: string) => {
    setEditingIndex(index);
    setEditingValue(currentValue);
  };

  const confirmEdit = () => {
    if (editingIndex === null) {
      return;
    }
    const result = editWord(list.id, editingIndex, editingValue);
    if (result.success) {
      setEditingIndex(null);
      setEditingValue('');
    }
  };

  const handleDeleteListConfirmed = () => {
    deleteList(list.id);
    router.replace('/lists');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.replace('/lists')}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Edit List</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>List name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          onBlur={handleNameBlur}
          style={styles.nameInput}
          placeholder="List name"
        />

        <Text style={styles.label}>
          Words ({list.words.length} / {MAX_WORDS_PER_LIST})
        </Text>

        {list.words.length === 0 ? (
          <Text style={styles.emptyText}>No words yet — add the first one below.</Text>
        ) : null}

        {list.words.map((word, index) => (
          <View key={`${word}-${index}`} testID={`word-row-${index}`} style={styles.wordRow}>
            {editingIndex === index ? (
              <>
                <TextInput
                  testID={`word-edit-input-${index}`}
                  value={editingValue}
                  onChangeText={setEditingValue}
                  style={styles.wordEditInput}
                  autoFocus
                />
                <Pressable testID={`word-edit-save-${index}`} style={styles.wordActionButton} onPress={confirmEdit}>
                  <Text style={styles.wordActionButtonText}>✓ Save</Text>
                </Pressable>
                <Pressable style={styles.wordActionButton} onPress={() => setEditingIndex(null)}>
                  <Text style={styles.wordActionButtonText}>✕</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text testID={`word-text-${index}`} style={styles.wordText}>{word}</Text>
                <Pressable testID={`word-edit-${index}`} style={styles.wordActionButton} onPress={() => startEditing(index, word)}>
                  <Text style={styles.wordActionButtonText}>✏️</Text>
                </Pressable>
                <Pressable testID={`word-delete-${index}`} style={styles.wordActionButton} onPress={() => deleteWord(list.id, index)}>
                  <Text style={styles.wordActionButtonText}>🗑️</Text>
                </Pressable>
              </>
            )}
          </View>
        ))}

        <View style={styles.addWordCard}>
          <TextInput
            value={newWord}
            onChangeText={(value) => {
              setNewWord(value);
              setWordError(null);
            }}
            onSubmitEditing={handleAddWord}
            placeholder="Type a spelling word"
            style={styles.addWordInput}
          />
          {wordError ? <Text style={styles.errorText}>{wordError}</Text> : null}
          <Pressable style={styles.addWordButton} onPress={handleAddWord}>
            <Text style={styles.addWordButtonText}>+ Add Word</Text>
          </Pressable>
        </View>

        <View style={styles.dangerZone}>
          {!confirmingDeleteList ? (
            <Pressable style={styles.deleteListButton} onPress={() => setConfirmingDeleteList(true)}>
              <Text style={styles.deleteListButtonText}>🗑️ Delete This List</Text>
            </Pressable>
          ) : (
            <View style={styles.confirmRow}>
              <Text style={styles.confirmText}>Delete "{list.name}" and all its words?</Text>
              <Pressable style={styles.confirmYesButton} onPress={handleDeleteListConfirmed}>
                <Text style={styles.confirmYesText}>Yes, delete list</Text>
              </Pressable>
              <Pressable style={styles.confirmNoButton} onPress={() => setConfirmingDeleteList(false)}>
                <Text style={styles.confirmNoText}>Cancel</Text>
              </Pressable>
            </View>
          )}
        </View>

        <Pressable style={styles.primaryButton} onPress={() => router.replace('/lists')}>
          <Text style={styles.primaryButtonText}>Done</Text>
        </Pressable>
      </ScrollView>
    </View>
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
    fontSize: 22,
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
  message: {
    color: theme.colors.muted,
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  nameInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 4,
    borderColor: '#111111',
    borderRadius: 16,
    padding: theme.spacing.sm,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#111111',
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  wordText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  wordEditInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#111111',
    borderRadius: 10,
    padding: 6,
    backgroundColor: '#EAF6FF',
  },
  wordActionButton: {
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 999,
    backgroundColor: '#E4D4FF',
    borderWidth: 2,
    borderColor: '#111111',
  },
  wordActionButtonText: {
    fontWeight: '700',
    color: theme.colors.text,
    fontSize: 13,
  },
  addWordCard: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: 20,
    backgroundColor: '#CFEFFF',
    borderWidth: 4,
    borderColor: '#111111',
  },
  addWordInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 3,
    borderColor: '#111111',
    borderRadius: 14,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  addWordButton: {
    alignSelf: 'flex-start',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 999,
    backgroundColor: theme.colors.secondary,
    borderWidth: 3,
    borderColor: '#111111',
  },
  addWordButtonText: {
    color: theme.colors.surface,
    fontWeight: '800',
  },
  errorText: {
    color: theme.colors.primary,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  dangerZone: {
    marginTop: theme.spacing.lg,
  },
  deleteListButton: {
    alignSelf: 'flex-start',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 999,
    backgroundColor: '#FFD6EC',
    borderWidth: 3,
    borderColor: '#111111',
  },
  deleteListButtonText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  confirmRow: {
    padding: theme.spacing.sm,
    borderRadius: 14,
    backgroundColor: '#FFD6EC',
    borderWidth: 3,
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
  primaryButton: {
    marginTop: theme.spacing.lg,
    alignSelf: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    borderWidth: 4,
    borderColor: '#111111',
  },
  primaryButtonText: {
    color: theme.colors.surface,
    fontWeight: '800',
    fontSize: 16,
  },
});
