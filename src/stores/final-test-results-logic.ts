/** Pure logic for the per-child Final Test history (Epic 31; Epic 32 reads it for reports). */

export type FinalTestResult = {
  id: string;
  /** Epoch ms when the test finished. */
  takenAt: number;
  listId: string;
  listName: string;
  words: { word: string; correct: boolean }[];
  passed: boolean;
  /** Number of correct words. */
  score: number;
};

export const MAX_STORED_FINAL_TESTS = 100;

/** Newest first, capped so storage can't grow without bound. */
export function appendFinalTestResult(results: FinalTestResult[], result: FinalTestResult): FinalTestResult[] {
  return [result, ...results].slice(0, MAX_STORED_FINAL_TESTS);
}

export function buildFinalTestResult(args: {
  id: string;
  takenAt: number;
  listId: string;
  listName: string;
  words: { word: string; correct: boolean }[];
  passed: boolean;
}): FinalTestResult {
  return { ...args, score: args.words.filter((entry) => entry.correct).length };
}
