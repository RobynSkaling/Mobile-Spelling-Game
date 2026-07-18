import { CharacterRelativeSize } from '@/data/characters/character-roster';

/**
 * Pure animation-budget accounting — no react-native import, following the same "pure logic in a
 * sibling file" split as sprite-animation.ts and character-animation-state.ts. Describes one
 * on-screen character slot with only the two facts architecture 25.8's budget cares about: how
 * big it renders (`relativeSize`, from character-roster.ts) and whether it's actively playing a
 * sprite-sheet animation right now. A character sitting on its static pose (no sprite sheet
 * registered for its current state, or reduce-motion is forcing the static-pose fallback per
 * Character.tsx) isn't spending any animation budget, regardless of size.
 */
export type AnimationBudgetEntry = {
  relativeSize: CharacterRelativeSize;
  isAnimating: boolean;
};

export type AnimationBudgetLimits = {
  maxLargeAnimating: number;
  maxSmallVillainsAnimating: number;
};

/**
 * Architecture 25.8's literal budget: "no more than one or two large actively-animating
 * characters plus at most a couple of small looping villains at once." The roster's
 * `CharacterRelativeSize` only has three tiers, and 25.8's text only names two buckets ("large"
 * and "small") — `'medium'` is folded into the "large" bucket here rather than treated as a third
 * bucket, since a medium-scale character (e.g. Professor Owl, or the Silly Goose villain) is
 * still a prominent on-screen actor in the sense 25.8 is budgeting against, not the small
 * background-villain case the "couple of small looping villains" language describes.
 */
export const DEFAULT_ANIMATION_BUDGET: AnimationBudgetLimits = {
  maxLargeAnimating: 2,
  maxSmallVillainsAnimating: 2,
};

export type AnimationBudgetResult = {
  withinBudget: boolean;
  largeAnimatingCount: number;
  smallAnimatingCount: number;
};

/**
 * Checks whether a given set of on-screen characters respects the 25.8 on-screen animation
 * budget. Only entries with `isAnimating: true` count against either bucket — idle/static
 * characters are free, per 25.8's "idle characters ... should not be animating" guidance (which
 * this function doesn't enforce on its own; it just doesn't penalize a caller for including them).
 */
export function checkAnimationBudget(
  entries: AnimationBudgetEntry[],
  limits: AnimationBudgetLimits = DEFAULT_ANIMATION_BUDGET,
): AnimationBudgetResult {
  const animating = entries.filter((entry) => entry.isAnimating);
  const largeAnimatingCount = animating.filter((entry) => entry.relativeSize !== 'small').length;
  const smallAnimatingCount = animating.filter((entry) => entry.relativeSize === 'small').length;

  return {
    largeAnimatingCount,
    smallAnimatingCount,
    withinBudget:
      largeAnimatingCount <= limits.maxLargeAnimating && smallAnimatingCount <= limits.maxSmallVillainsAnimating,
  };
}
