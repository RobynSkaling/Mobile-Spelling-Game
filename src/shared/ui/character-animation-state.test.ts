import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveAnimationHoldMs } from './character-animation-state';

describe('resolveAnimationHoldMs', () => {
  it('returns 0 for loop states that should hold indefinitely', () => {
    assert.equal(resolveAnimationHoldMs('Idle'), 0);
    assert.equal(resolveAnimationHoldMs('BeingNaughty'), 0);
  });

  it('returns a positive hold duration for one-shot reaction states', () => {
    for (const state of ['Talking', 'Poked', 'Celebrating', 'Defeated', 'Challenging'] as const) {
      assert.ok(resolveAnimationHoldMs(state) > 0, `${state} should have a positive hold duration`);
    }
  });
});
