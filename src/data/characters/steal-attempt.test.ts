import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  defendStealAttempt,
  getStealTuning,
  resolveStealWindUp,
  SAFE_STEAL_ATTEMPT,
  STEAL_TUNING_BY_TIER,
  StealTuning,
  triggerStealAttempt,
} from './steal-attempt';
import { VillainBehaviorTier } from './villain-behavior';

const TAUNTING_TUNING = STEAL_TUNING_BY_TIER[VillainBehaviorTier.Taunting] as StealTuning;
const INTERFERING_TUNING = STEAL_TUNING_BY_TIER[VillainBehaviorTier.Interfering] as StealTuning;
const RELENTLESS_TUNING = STEAL_TUNING_BY_TIER[VillainBehaviorTier.Relentless] as StealTuning;

describe('getStealTuning', () => {
  it('is null at Passive — no steal machinery is active at that tier', () => {
    assert.equal(getStealTuning(VillainBehaviorTier.Passive), null);
  });

  it('is configured for every other tier', () => {
    assert.ok(getStealTuning(VillainBehaviorTier.Taunting));
    assert.ok(getStealTuning(VillainBehaviorTier.Interfering));
    assert.ok(getStealTuning(VillainBehaviorTier.Relentless));
  });
});

describe('triggerStealAttempt', () => {
  it('opens Safe -> Telegraphing when given a resource', () => {
    const next = triggerStealAttempt(SAFE_STEAL_ATTEMPT, 'pot-1');
    assert.equal(next.status, 'Telegraphing');
    assert.equal(next.resource, 'pot-1');
  });

  it('stays Safe when the resource is null (empty/at-floor larder — host refuses to nominate one)', () => {
    const next = triggerStealAttempt(SAFE_STEAL_ATTEMPT, null);
    assert.deepEqual(next, SAFE_STEAL_ATTEMPT);
  });

  it('no-ops (stays on the existing attempt) when one is already open', () => {
    const opened = triggerStealAttempt(SAFE_STEAL_ATTEMPT, 'pot-1');
    const second = triggerStealAttempt(opened, 'pot-2');
    assert.equal(second, opened);
    assert.equal(second.resource, 'pot-1');
  });
});

describe('defendStealAttempt', () => {
  it('defends an open attempt back to Safe (models both defend-by-flick and defend-by-tap — the ' +
    'host decides which action calls this)', () => {
    const opened = triggerStealAttempt(SAFE_STEAL_ATTEMPT, 'pot-1');
    assert.deepEqual(defendStealAttempt(opened), SAFE_STEAL_ATTEMPT);
  });

  it('no-ops when nothing is open', () => {
    assert.deepEqual(defendStealAttempt(SAFE_STEAL_ATTEMPT), SAFE_STEAL_ATTEMPT);
  });
});

describe('resolveStealWindUp', () => {
  it('completes the steal when the tier allows it (Interfering/Relentless)', () => {
    const opened = triggerStealAttempt(SAFE_STEAL_ATTEMPT, 'pot-1');
    const result = resolveStealWindUp(opened, INTERFERING_TUNING);
    assert.equal(result.outcome, 'Stolen');
    assert.equal(result.resource, 'pot-1');
    assert.deepEqual(result.next, SAFE_STEAL_ATTEMPT);

    const relentless = resolveStealWindUp(triggerStealAttempt(SAFE_STEAL_ATTEMPT, 'pot-2'), RELENTLESS_TUNING);
    assert.equal(relentless.outcome, 'Stolen');
  });

  it('never completes at Taunting — the tutorial tier always retreats', () => {
    const opened = triggerStealAttempt(SAFE_STEAL_ATTEMPT, 'pot-1');
    const result = resolveStealWindUp(opened, TAUNTING_TUNING);
    assert.equal(result.outcome, 'Retreated');
    assert.equal(result.resource, 'pot-1');
    assert.deepEqual(result.next, SAFE_STEAL_ATTEMPT);
  });

  it('is a no-op when nothing is open', () => {
    const result = resolveStealWindUp(SAFE_STEAL_ATTEMPT, INTERFERING_TUNING);
    assert.equal(result.outcome, 'NoOp');
    assert.equal(result.resource, null);
  });
});
