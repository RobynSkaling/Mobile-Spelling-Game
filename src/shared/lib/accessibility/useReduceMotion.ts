import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Tracks the OS-level "reduce motion" accessibility setting (architecture 25.1 criterion 9 /
 * 25.8), so any screen or component can gate motion-heavy visuals behind one shared source of
 * truth instead of each wiring its own `AccessibilityInfo` listener.
 *
 * Reads the initial value via `AccessibilityInfo.isReduceMotionEnabled()` and stays current via
 * the `'reduceMotionChanged'` event, so a setting change mid-session (a parent adjusting it while
 * the app is open) takes effect immediately. Both calls are optional-chained since this surface
 * isn't guaranteed on every platform (notably web) — defaults to `false` (full motion) until the
 * initial async check resolves, or forever on a platform that doesn't support it, matching the
 * fallback discipline used everywhere else in the character system.
 */
export function useReduceMotion(): boolean {
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((enabled) => {
        if (isMounted) {
          setReduceMotionEnabled(enabled);
        }
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotionEnabled);

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

  return reduceMotionEnabled;
}
