import React from 'react';
import { Redirect } from 'expo-router';
import { useFamilyStore } from '@/stores/family-store';

type RequireParentProps = {
  /** Where the gate should return to after the PIN is entered, e.g. "/children". */
  next: string;
  children: React.ReactNode;
};

/** Wraps a parent-only screen (Epic 30): shows it only while the parent area is unlocked, otherwise
 *  sends the user through the PIN gate first. Home re-locks the parent area on every visit. */
export function RequireParent({ next, children }: RequireParentProps) {
  const parentUnlocked = useFamilyStore((state) => state.parentUnlocked);

  if (!parentUnlocked) {
    return <Redirect href={`/parent-gate?next=${encodeURIComponent(next)}`} />;
  }
  return <>{children}</>;
}
