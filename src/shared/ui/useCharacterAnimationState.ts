import { useCallback, useEffect, useRef, useState } from 'react';
import { CharacterAnimationState } from '@/data/characters/character-roster';
import { resolveAnimationHoldMs } from './character-animation-state';

export type TriggerCharacterAnimation = (state: CharacterAnimationState, holdMs?: number) => void;

/**
 * Owns one character's current `CharacterAnimationState` plus the "hold for a bit, then return to
 * Idle" timer, so gameplay screens can call `trigger('Celebrating')` and move on instead of
 * hand-rolling `setTimeout`s alongside their own gameplay timers.
 *
 * Calling `trigger` again before a pending return-to-Idle fires cancels it, so the most recent
 * reaction always wins (e.g. a per-letter 'Talking' cheer immediately superseded by 'Celebrating'
 * when that same letter finishes the word).
 */
export function useCharacterAnimationState(initialState: CharacterAnimationState = 'Idle') {
  const [animationState, setAnimationState] = useState<CharacterAnimationState>(initialState);
  const returnToIdleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingReturn = useCallback(() => {
    if (returnToIdleTimeoutRef.current) {
      clearTimeout(returnToIdleTimeoutRef.current);
      returnToIdleTimeoutRef.current = null;
    }
  }, []);

  /** Switches to `state` immediately. If `holdMs` isn't given, uses the state's default hold
   *  duration; pass an explicit `holdMs` to keep a reaction in sync with another animation's own
   *  duration (e.g. holding 'Celebrating' exactly as long as a paired confetti burst). */
  const trigger = useCallback<TriggerCharacterAnimation>(
    (state, holdMs) => {
      clearPendingReturn();
      setAnimationState(state);

      const resolvedHoldMs = holdMs ?? resolveAnimationHoldMs(state);
      if (resolvedHoldMs > 0) {
        returnToIdleTimeoutRef.current = setTimeout(() => {
          setAnimationState('Idle');
          returnToIdleTimeoutRef.current = null;
        }, resolvedHoldMs);
      }
    },
    [clearPendingReturn],
  );

  useEffect(() => clearPendingReturn, [clearPendingReturn]);

  return { animationState, trigger };
}
