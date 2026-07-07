import { WordList } from '@/features/word-lists/types';

function buildBuiltInList(ageGroup: number, words: string[]): WordList {
  return {
    id: `built-in-age-${ageGroup}`,
    name: `Age ${ageGroup} Words`,
    words,
    isBuiltIn: true,
    ageGroup,
    createdAt: 0,
    updatedAt: 0,
  };
}

export const BUILT_IN_WORD_LISTS: WordList[] = [
  buildBuiltInList(5, [
    'cat', 'dog', 'sun', 'hat', 'pig', 'run', 'big', 'red', 'top', 'box',
    'cup', 'bed', 'fan', 'hen', 'jam', 'log', 'mud', 'net', 'pot', 'wag',
  ]),
  buildBuiltInList(6, [
    'frog', 'milk', 'book', 'tree', 'fish', 'star', 'moon', 'cake', 'rain', 'snow',
    'blue', 'green', 'happy', 'jump', 'swim', 'camp', 'desk', 'lamp', 'nest', 'wind',
  ]),
  buildBuiltInList(7, [
    'shark', 'whale', 'cloud', 'storm', 'plant', 'bridge', 'castle', 'dragon', 'forest', 'garden',
    'island', 'jungle', 'kitten', 'ladder', 'magnet', 'number', 'pencil', 'planet', 'purple', 'rocket',
  ]),
  buildBuiltInList(8, [
    'birthday', 'calendar', 'chocolate', 'dinosaur', 'elephant', 'favorite', 'hospital', 'mountain', 'neighbor', 'adventure',
    'breakfast', 'butterfly', 'chemistry', 'dangerous', 'difficult', 'furniture', 'telephone', 'umbrella', 'vacation', 'vegetable',
  ]),
  buildBuiltInList(9, [
    'achievement', 'atmosphere', 'beautiful', 'celebrate', 'communicate', 'curiosity', 'definitely', 'embarrass', 'enormous', 'environment',
    'especially', 'government', 'guarantee', 'imagination', 'knowledge', 'mysterious', 'opportunity', 'particular', 'restaurant', 'temperature',
  ]),
  buildBuiltInList(10, [
    'accommodate', 'appreciate', 'catastrophe', 'conscience', 'embarrassed', 'exaggerate', 'immediately', 'independent', 'mischievous', 'necessary',
    'occasionally', 'parliament', 'perseverance', 'questionnaire', 'rhythm', 'separate', 'sincerely', 'subtle', 'unnecessary', 'vacuum',
  ]),
];
