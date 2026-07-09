/**
 * Picks a random index into a phrase pool, guaranteed not to match `lastIndex` (unless the pool
 * only has one phrase, in which case there's no choice). Rejection sampling rather than a fixed
 * "+1 on collision" shift so the remaining phrases stay uniformly likely.
 */
export function pickNextPraiseIndex(
  poolSize: number,
  lastIndex: number | null,
  randomFn: () => number = Math.random,
): number {
  if (poolSize <= 1) {
    return 0;
  }

  let index = Math.floor(randomFn() * poolSize);
  while (index === lastIndex) {
    index = Math.floor(randomFn() * poolSize);
  }

  return index;
}
