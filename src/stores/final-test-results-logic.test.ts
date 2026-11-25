import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { appendFinalTestResult, buildFinalTestResult, FinalTestResult, MAX_STORED_FINAL_TESTS } from './final-test-results-logic';

const base = { listId: 'l', listName: 'List', passed: true };

describe('final test results', () => {
  it('scores the number of correct words', () => {
    const result = buildFinalTestResult({
      ...base,
      id: 'x',
      takenAt: 1,
      words: [
        { word: 'cat', correct: true },
        { word: 'dog', correct: false },
        { word: 'sun', correct: true },
      ],
    });
    assert.equal(result.score, 2);
  });

  it('puts the newest first and caps the history', () => {
    let results: FinalTestResult[] = [];
    for (let i = 0; i < MAX_STORED_FINAL_TESTS + 5; i += 1) {
      results = appendFinalTestResult(results, buildFinalTestResult({ ...base, id: String(i), takenAt: i, words: [] }));
    }
    assert.equal(results.length, MAX_STORED_FINAL_TESTS);
    assert.equal(results[0].id, String(MAX_STORED_FINAL_TESTS + 4));
  });
});
