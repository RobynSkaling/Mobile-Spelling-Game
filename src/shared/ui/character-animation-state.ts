import { CharacterAnimationState } from '@/data/characters/character-roster';

/**
 * How long (ms) a triggered reaction holds before `useCharacterAnimationState` automatically
 * returns the character to `Idle`, unless the caller overrides it with an explicit duration (used
 * when a reaction needs to stay in sync with another animation's own duration, e.g. a celebration
 * that should hold exactly as long as the confetti overlay it's paired with).
 *
 * `Idle` and `BeingNaughty` are loop states that gameplay code doesn't trigger through this timed
 * path in practice, but every `CharacterAnimationState` gets an entry so the lookup never falls
 * through silently.
 */
const CHARACTER_ANIMATION_HOLD_MS: Record<CharacterAnimationState, number> = {
  Idle: 0,
  Talking: 1200,
  Poked: 900,
  Celebrating: 1600,
  Defeated: 1600,
  BeingNaughty: 0,
  Challenging: 1200,
};

/** Returns 0 for a state that should hold indefinitely (i.e. never auto-return to Idle). */
export function resolveAnimationHoldMs(state: CharacterAnimationState): number {
  return CHARACTER_ANIMATION_HOLD_MS[state] ?? 0;
}
