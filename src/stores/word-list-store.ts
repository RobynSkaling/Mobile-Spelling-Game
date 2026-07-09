import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BUILT_IN_WORD_LISTS } from '@/data/word-lists/built-in-word-lists';
import { MAX_CUSTOM_LISTS, MAX_WORDS_PER_LIST, WordList } from '@/features/word-lists/types';

const CUSTOM_LISTS_KEY = 'word-lists.custom';
const SELECTED_LIST_KEY = 'word-lists.selectedId';

type ActionResult = { success: boolean; error: string | null };

function generateId(): string {
  return `list-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function normalizeWord(raw: string): string {
  return raw.trim();
}

function randomBuiltInId(): string {
  const index = Math.floor(Math.random() * BUILT_IN_WORD_LISTS.length);
  return BUILT_IN_WORD_LISTS[index].id;
}

function persist(customLists: WordList[], selectedListId: string | null) {
  AsyncStorage.setItem(CUSTOM_LISTS_KEY, JSON.stringify(customLists));
  AsyncStorage.setItem(SELECTED_LIST_KEY, selectedListId ?? '');
}

interface WordListState {
  customLists: WordList[];
  selectedListId: string | null;
  isHydrated: boolean;
  loadLists: () => Promise<void>;
  getListById: (id: string) => WordList | undefined;
  getSelectedList: () => WordList | undefined;
  selectList: (id: string) => void;
  createList: (name: string) => { list: WordList | null; error: string | null };
  createListWithWords: (name: string, words: string[]) => { list: WordList | null; error: string | null };
  renameList: (id: string, name: string) => void;
  deleteList: (id: string) => void;
  addWord: (listId: string, word: string) => ActionResult;
  editWord: (listId: string, index: number, word: string) => ActionResult;
  deleteWord: (listId: string, index: number) => void;
}

export const useWordListStore = create<WordListState>((set, get) => ({
  customLists: [],
  selectedListId: null,
  isHydrated: false,

  loadLists: async () => {
    const [storedLists, storedSelected] = await Promise.all([
      AsyncStorage.getItem(CUSTOM_LISTS_KEY),
      AsyncStorage.getItem(SELECTED_LIST_KEY),
    ]);

    const customLists: WordList[] = storedLists ? JSON.parse(storedLists) : [];
    const allIds = new Set([...BUILT_IN_WORD_LISTS.map((list) => list.id), ...customLists.map((list) => list.id)]);

    let selectedListId = storedSelected || null;
    if (!selectedListId || !allIds.has(selectedListId)) {
      selectedListId = randomBuiltInId();
      AsyncStorage.setItem(SELECTED_LIST_KEY, selectedListId);
    }

    set({ customLists, selectedListId, isHydrated: true });
  },

  getListById: (id) => {
    return BUILT_IN_WORD_LISTS.find((list) => list.id === id) ?? get().customLists.find((list) => list.id === id);
  },

  getSelectedList: () => {
    const { selectedListId } = get();
    return selectedListId ? get().getListById(selectedListId) : undefined;
  },

  selectList: (id) => {
    set({ selectedListId: id });
    AsyncStorage.setItem(SELECTED_LIST_KEY, id);
  },

  createList: (name) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { list: null, error: 'Give the list a name first.' };
    }

    const { customLists } = get();
    if (customLists.length >= MAX_CUSTOM_LISTS) {
      return { list: null, error: `You already have the maximum of ${MAX_CUSTOM_LISTS} lists.` };
    }

    const now = Date.now();
    const newList: WordList = {
      id: generateId(),
      name: trimmedName,
      words: [],
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
    };

    const nextLists = [...customLists, newList];
    set({ customLists: nextLists });
    persist(nextLists, get().selectedListId);
    return { list: newList, error: null };
  },

  createListWithWords: (name, words) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { list: null, error: 'Give the list a name first.' };
    }

    const { customLists } = get();
    if (customLists.length >= MAX_CUSTOM_LISTS) {
      return { list: null, error: `You already have the maximum of ${MAX_CUSTOM_LISTS} lists.` };
    }

    const seenKeys = new Set<string>();
    const dedupedWords: string[] = [];
    for (const raw of words) {
      const normalized = normalizeWord(raw);
      if (!normalized) {
        continue;
      }
      const key = normalized.toLowerCase();
      if (seenKeys.has(key)) {
        continue;
      }
      seenKeys.add(key);
      dedupedWords.push(normalized);
      if (dedupedWords.length >= MAX_WORDS_PER_LIST) {
        break;
      }
    }

    const now = Date.now();
    const newList: WordList = {
      id: generateId(),
      name: trimmedName,
      words: dedupedWords,
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
    };

    const nextLists = [...customLists, newList];
    set({ customLists: nextLists });
    persist(nextLists, get().selectedListId);
    return { list: newList, error: null };
  },

  renameList: (id, name) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    const nextLists = get().customLists.map((list) =>
      list.id === id ? { ...list, name: trimmedName, updatedAt: Date.now() } : list,
    );
    set({ customLists: nextLists });
    persist(nextLists, get().selectedListId);
  },

  deleteList: (id) => {
    const { customLists, selectedListId } = get();
    const nextLists = customLists.filter((list) => list.id !== id);
    const nextSelectedId = selectedListId === id ? randomBuiltInId() : selectedListId;

    set({ customLists: nextLists, selectedListId: nextSelectedId });
    persist(nextLists, nextSelectedId);
  },

  addWord: (listId, word) => {
    const normalized = normalizeWord(word);
    if (!normalized) {
      return { success: false, error: 'Type a word first.' };
    }

    const { customLists } = get();
    const list = customLists.find((l) => l.id === listId);
    if (!list) {
      return { success: false, error: 'List not found.' };
    }
    if (list.words.length >= MAX_WORDS_PER_LIST) {
      return { success: false, error: `This list already has the maximum of ${MAX_WORDS_PER_LIST} words.` };
    }
    if (list.words.some((existing) => existing.toLowerCase() === normalized.toLowerCase())) {
      return { success: false, error: 'That word is already in this list.' };
    }

    const nextLists = customLists.map((l) =>
      l.id === listId ? { ...l, words: [...l.words, normalized], updatedAt: Date.now() } : l,
    );
    set({ customLists: nextLists });
    persist(nextLists, get().selectedListId);
    return { success: true, error: null };
  },

  editWord: (listId, index, word) => {
    const normalized = normalizeWord(word);
    if (!normalized) {
      return { success: false, error: 'Type a word first.' };
    }

    const { customLists } = get();
    const list = customLists.find((l) => l.id === listId);
    if (!list) {
      return { success: false, error: 'List not found.' };
    }
    if (list.words.some((existing, i) => i !== index && existing.toLowerCase() === normalized.toLowerCase())) {
      return { success: false, error: 'That word is already in this list.' };
    }

    const nextLists = customLists.map((l) =>
      l.id === listId
        ? { ...l, words: l.words.map((w, i) => (i === index ? normalized : w)), updatedAt: Date.now() }
        : l,
    );
    set({ customLists: nextLists });
    persist(nextLists, get().selectedListId);
    return { success: true, error: null };
  },

  deleteWord: (listId, index) => {
    const nextLists = get().customLists.map((l) =>
      l.id === listId ? { ...l, words: l.words.filter((_, i) => i !== index), updatedAt: Date.now() } : l,
    );
    set({ customLists: nextLists });
    persist(nextLists, get().selectedListId);
  },
}));
