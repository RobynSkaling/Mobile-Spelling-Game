import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTER_ROSTER, getCharacterById, getCharactersByRole } from '@/data/characters/character-roster';
import { checkAnimationBudget, DEFAULT_ANIMATION_BUDGET } from './animation-budget';

describe('checkAnimationBudget', () => {
  it('is within budget when nothing is animating, regardless of count or size', () => {
    const result = checkAnimationBudget([
      { relativeSize: 'large', isAnimating: false },
      { relativeSize: 'medium', isAnimating: false },
      { relativeSize: 'small', isAnimating: false },
      { relativeSize: 'small', isAnimating: false },
    ]);
    assert.equal(result.withinBudget, true);
    assert.equal(result.largeAnimatingCount, 0);
    assert.equal(result.smallAnimatingCount, 0);
  });

  it('counts large and medium characters toward the same "large" bucket', () => {
    const result = checkAnimationBudget([
      { relativeSize: 'large', isAnimating: true },
      { relativeSize: 'medium', isAnimating: true },
    ]);
    assert.equal(result.largeAnimatingCount, 2);
    assert.equal(result.withinBudget, true);
  });

  it('is exceeded once a third large/medium character animates at once', () => {
    const result = checkAnimationBudget([
      { relativeSize: 'large', isAnimating: true },
      { relativeSize: 'medium', isAnimating: true },
      { relativeSize: 'large', isAnimating: true },
    ]);
    assert.equal(result.largeAnimatingCount, 3);
    assert.equal(result.withinBudget, false);
  });

  it('allows up to a couple of small animating villains', () => {
    const result = checkAnimationBudget([
      { relativeSize: 'small', isAnimating: true },
      { relativeSize: 'small', isAnimating: true },
    ]);
    assert.equal(result.smallAnimatingCount, 2);
    assert.equal(result.withinBudget, true);
  });

  it('is exceeded once a third small villain animates at once', () => {
    const result = checkAnimationBudget([
      { relativeSize: 'small', isAnimating: true },
      { relativeSize: 'small', isAnimating: true },
      { relativeSize: 'small', isAnimating: true },
    ]);
    assert.equal(result.withinBudget, false);
  });

  it('respects a custom limits override instead of the default budget', () => {
    const result = checkAnimationBudget([{ relativeSize: 'small', isAnimating: true }], {
      maxLargeAnimating: DEFAULT_ANIMATION_BUDGET.maxLargeAnimating,
      maxSmallVillainsAnimating: 0,
    });
    assert.equal(result.withinBudget, false);
  });
});

describe("PlayScreen's on-screen character set stays within the 25.8 budget", () => {
  it('mama-bear plus any villain from the roster, both actively animating at once, is within budget', () => {
    const mamaBear = getCharacterById('mama-bear');
    assert.ok(mamaBear, 'mama-bear must exist in the roster');

    for (const villain of getCharactersByRole('villain')) {
      const result = checkAnimationBudget([
        { relativeSize: mamaBear.relativeSize, isAnimating: true },
        { relativeSize: villain.relativeSize, isAnimating: true },
      ]);
      assert.equal(
        result.withinBudget,
        true,
        `mama-bear + ${villain.id} both animating should stay within budget`,
      );
    }
  });

  it('the whole roster animating at once would already exceed the budget (sanity check that the check bites)', () => {
    const result = checkAnimationBudget(
      CHARACTER_ROSTER.map((character) => ({ relativeSize: character.relativeSize, isAnimating: true })),
    );
    assert.equal(result.withinBudget, false);
  });
});
