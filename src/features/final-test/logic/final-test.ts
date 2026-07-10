export const FINAL_TEST_MIN_WORDS = 3;
export const FINAL_TEST_MAX_WORDS = 5;
// A "pass" allows this many wrong answers — forgiving enough for a 5-10 year old, while still
// meaning something more than casual practice.
export const MAX_MISTAKES_TO_PASS = 1;

function shuffle<T>(items: T[], randomFn: () => number): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(randomFn() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

/** Picks up to FINAL_TEST_MAX_WORDS words at random from the list, in a random order. */
export function pickTestWords(words: string[], randomFn: () => number = Math.random): string[] {
  return shuffle(words, randomFn).slice(0, FINAL_TEST_MAX_WORDS);
}

/** A pass allows at most MAX_MISTAKES_TO_PASS wrong answers. */
export function hasPassed(correctCount: number, totalCount: number): boolean {
  if (totalCount === 0) {
    return false;
  }

  return correctCount >= totalCount - MAX_MISTAKES_TO_PASS;
}
