import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyFamily } from './family-logic';

// The web build of AsyncStorage reads window.localStorage; back it with a Map so the real stores run
// under node. Must be installed before any store function runs (imports below are hoisted, calls aren't).
const data = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
    key: (i: number) => Array.from(data.keys())[i] ?? null,
    get length() {
      return data.size;
    },
  },
};

import { useFamilyStore } from './family-store';
import { useProgressStore } from './progress-store';
import { useDailyRewardsStore } from './daily-rewards-store';
import { useGameModeStore } from './game-mode-store';
import { useGameSelectionStore } from './game-selection-store';
import { useFinalTestStore } from './final-test-store';
import { useWordListStore } from './word-list-store';
import { loadPerChildStores, migratePerChildData } from './per-child-data';
import { childDataKeys } from './child-data-logic';

const kid = (id: string) => ({ id, name: id, avatar: 'x', birthMonth: null, birthYear: null, createdAt: 0 });
const DAY = Date.UTC(2026, 5, 10, 12);

function seedFamily(ids: string[]) {
  useFamilyStore.setState({ ...createEmptyFamily(), children: ids.map(kid), activeChildId: ids[0], isHydrated: true });
}

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 5));
}

describe('per-child stores', () => {
  beforeEach(async () => {
    data.clear();
    seedFamily(['a', 'b']);
    await loadPerChildStores('a');
  });

  it('playing as child A never changes child B data', async () => {
    useProgressStore.getState().startSession();
    useProgressStore.getState().recordWordCompleted('cat');
    useDailyRewardsStore.getState().recordCompletedPlay(DAY);
    useGameModeStore.getState().setMode('hard');
    useGameSelectionStore.getState().setSelectedGame('bee-line');
    useWordListStore.getState().selectList('some-list');
    useFinalTestStore.getState().recordResult({
      id: 'r',
      takenAt: 1,
      listId: 'l',
      listName: 'L',
      words: [{ word: 'cat', correct: true }],
      passed: true,
      score: 1,
    });
    await flush();

    assert.ok(childDataKeys('b').every((key) => !data.has(key)), 'child B has no stored data');
    assert.ok(childDataKeys('a').some((key) => data.has(key)));

    await loadPerChildStores('b');
    assert.equal(useProgressStore.getState().sessions.length, 0);
    assert.deepEqual(useProgressStore.getState().wordStats, {});
    assert.equal(useDailyRewardsStore.getState().streak.current, 0);
    assert.deepEqual(useDailyRewardsStore.getState().album.earned, {});
    assert.equal(useGameModeStore.getState().mode, 'easy');
    assert.equal(useGameSelectionStore.getState().selectedGame, 'honey-pot-flick');
    assert.notEqual(useWordListStore.getState().selectedListId, 'some-list');
    assert.equal(useFinalTestStore.getState().results.length, 0);

    await loadPerChildStores('a');
    assert.equal(useProgressStore.getState().wordStats.cat.timesCompleted, 1);
    assert.equal(useDailyRewardsStore.getState().streak.current, 1);
    assert.equal(useGameModeStore.getState().mode, 'hard');
    assert.equal(useFinalTestStore.getState().results.length, 1);
  });

  it('a slow load for the previous child cannot overwrite the newer child', async () => {
    useGameModeStore.getState().setMode('hard');
    await flush();
    const slow = useGameModeStore.getState().loadForChild('a');
    await useGameModeStore.getState().loadForChild('b');
    await slow;
    assert.equal(useGameModeStore.getState().loadedChildId, 'b');
    assert.equal(useGameModeStore.getState().mode, 'easy');
  });

  it('removing a child deletes only that child keys', async () => {
    useGameModeStore.getState().setMode('hard');
    await loadPerChildStores('b');
    useGameModeStore.getState().setMode('easy');
    useProgressStore.getState().startSession();
    data.set('word-lists.custom', '[]');
    await flush();
    const aBefore = childDataKeys('a').filter((key) => data.has(key));
    assert.ok(childDataKeys('b').some((key) => data.has(key)));

    useFamilyStore.getState().removeChild('b');
    await flush();

    assert.ok(childDataKeys('b').every((key) => !data.has(key)));
    assert.deepEqual(childDataKeys('a').filter((key) => data.has(key)), aBefore);
    assert.ok(data.has('word-lists.custom'));
  });
});

describe('migratePerChildData', () => {
  beforeEach(() => data.clear());

  it('moves legacy per-device data to the first child, then drops the old keys and the legacy profile', async () => {
    seedFamily(['a', 'b']);
    data.set('progress.sessions', '[{"id":"s"}]');
    data.set('dailyRewards.v1', '{"x":1}');
    data.set('game-mode', 'hard');
    data.set('profile', '{"id":"a"}');
    data.set('family.v1', '{}');

    await migratePerChildData();

    assert.equal(data.get('progress.sessions.child.a'), '[{"id":"s"}]');
    assert.equal(data.get('dailyRewards.v1.profile.a'), '{"x":1}');
    assert.equal(data.get('game-mode.child.a'), 'hard');
    assert.ok(['progress.sessions', 'dailyRewards.v1', 'game-mode', 'profile'].every((key) => !data.has(key)));
    assert.ok(childDataKeys('b').every((key) => !data.has(key)));
    assert.equal(data.get('perChildData.migratedVersion'), '1');

    const snapshot = new Map(data);
    await migratePerChildData();
    assert.deepEqual(data, snapshot);
  });

  it('writes only the marker for a fresh install with no legacy data', async () => {
    seedFamily(['a']);
    await migratePerChildData();
    assert.deepEqual([...data.keys()], ['perChildData.migratedVersion']);
  });
});
