export type WordList = {
  id: string;
  name: string;
  words: string[];
  isBuiltIn: boolean;
  ageGroup?: number;
  createdAt: number;
  updatedAt: number;
};

export const MAX_CUSTOM_LISTS = 52;
export const MAX_WORDS_PER_LIST = 50;
export const BUILT_IN_WORDS_PER_LIST = 20;
