import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  childDataKeys,
  childKey,
  FAMILY_BLOB_KEY,
  LEGACY_PROFILE_KEY,
  MIGRATION_MARKER_KEY,
  PER_CHILD_DATA_VERSION,
  planPerChildMigration,
} from './child-data-logic';

const LEGACY = {
  'progress.sessions': '[{"id":"s1"}]',
  'progress.wordStats': '{"cat":{}}',
  'dailyRewards.v1': '{"streak":{}}',
  'game-mode': 'hard',
  'selected-game': 'bee-line',
  'word-lists.selectedId': 'list-1',
  profile: '{"id":"a"}',
};

describe('key scoping', () => {
  it('scopes a base key by child id', () => {
    assert.equal(childKey('game-mode', 'a'), 'game-mode.child.a');
  });

  it('gives different children disjoint key sets', () => {
    const a = new Set(childDataKeys('a'));
    assert.ok(childDataKeys('b').every((key) => !a.has(key)));
  });

  it('never includes shared or legacy keys, so removing a child cannot touch them', () => {
    const keys = childDataKeys('a');
    for (const shared of ['word-lists.custom', FAMILY_BLOB_KEY, LEGACY_PROFILE_KEY, 'progress.sessions', 'dailyRewards.v1']) {
      assert.ok(!keys.includes(shared), shared);
    }
  });
});

describe('planPerChildMigration', () => {
  it('moves every per-device key to the first child, writes before marker before deletes', () => {
    const plan = planPerChildMigration({ childIds: ['a', 'b'], markerVersion: null, stored: LEGACY, familyBlobStored: true });
    assert.deepEqual(
      plan.writes.map((write) => write.key).sort(),
      [
        'dailyRewards.v1.profile.a',
        'game-mode.child.a',
        'progress.sessions.child.a',
        'progress.wordStats.child.a',
        'selected-game.child.a',
        'word-lists.selectedId.child.a',
      ],
    );
    assert.equal(plan.writes.find((write) => write.key === 'game-mode.child.a')?.value, 'hard');
    assert.deepEqual(plan.marker, { key: MIGRATION_MARKER_KEY, value: String(PER_CHILD_DATA_VERSION) });
    assert.deepEqual(plan.deletes.sort(), [...Object.keys(LEGACY)].sort());
  });

  it('keeps the legacy profile until the family blob is really stored', () => {
    const plan = planPerChildMigration({ childIds: ['a'], markerVersion: null, stored: LEGACY, familyBlobStored: false });
    assert.ok(!plan.deletes.includes(LEGACY_PROFILE_KEY));
    assert.ok(plan.deletes.includes('progress.sessions'));
  });

  it('writes only the marker for a fresh install with no data', () => {
    const plan = planPerChildMigration({ childIds: ['a'], markerVersion: null, stored: {}, familyBlobStored: true });
    assert.deepEqual(plan.writes, []);
    assert.deepEqual(plan.deletes, []);
    assert.ok(plan.marker);
  });

  it('does nothing while there are no children yet', () => {
    const plan = planPerChildMigration({ childIds: [], markerVersion: null, stored: LEGACY, familyBlobStored: false });
    assert.deepEqual(plan, { writes: [], marker: null, deletes: [] });
  });

  it('does not overwrite a per-child key that already exists (re-run after a kill)', () => {
    const plan = planPerChildMigration({
      childIds: ['a'],
      markerVersion: null,
      stored: { ...LEGACY, 'game-mode.child.a': 'easy' },
      familyBlobStored: true,
    });
    assert.ok(!plan.writes.some((write) => write.key === 'game-mode.child.a'));
  });

  it('is idempotent: after the plan is applied, planning again is empty', () => {
    const stored: Record<string, string | null> = { ...LEGACY };
    const plan = planPerChildMigration({ childIds: ['a'], markerVersion: null, stored, familyBlobStored: true });
    const after = { ...stored };
    for (const write of plan.writes) after[write.key] = write.value;
    for (const key of plan.deletes) delete after[key];
    const second = planPerChildMigration({
      childIds: ['a'],
      markerVersion: PER_CHILD_DATA_VERSION,
      stored: after,
      familyBlobStored: true,
    });
    assert.deepEqual(second, { writes: [], marker: null, deletes: [] });
  });

  it('after the marker is set, leftover legacy keys are only deleted, never copied again', () => {
    // Killed during cleanup, and the first child has since been removed: must not resurrect their data.
    const plan = planPerChildMigration({
      childIds: ['b'],
      markerVersion: PER_CHILD_DATA_VERSION,
      stored: { 'progress.sessions': '[]' },
      familyBlobStored: true,
    });
    assert.deepEqual(plan.writes, []);
    assert.equal(plan.marker, null);
    assert.deepEqual(plan.deletes, ['progress.sessions']);
  });
});
