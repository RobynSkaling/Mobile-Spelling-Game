export type Point = { x: number; y: number };
export type Bounds = { x: number; y: number; width: number; height: number };

// Below this release speed (px/s), it's a nudge, not a flick — nothing launches.
export const FLICK_MIN_SPEED = 300;
// How far a successfully-flicked letter travels before its throw is resolved.
export const THROW_DISTANCE = 420;
// Generous hit circle around the pot's center — the flick's path just needs to pass through this.
export const POT_HIT_RADIUS = 56;
export const POT_SIZE = 84;

export function shuffleLetters(items: string[]): string[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export function buildLetterBundle(word: string): string[] {
  return shuffleLetters(word.split(''));
}

export function getNextWord(words: string[], currentWord: string | null): string {
  if (!currentWord) {
    return words[0];
  }

  const currentIndex = words.indexOf(currentWord);
  const nextIndex = (currentIndex + 1) % words.length;
  return words[nextIndex];
}

export function toContainerRelative(point: Point, containerOrigin: Bounds | null): Point {
  if (!containerOrigin) {
    return point;
  }

  return { x: point.x - containerOrigin.x, y: point.y - containerOrigin.y };
}

export function randomPotPosition(field: Bounds, potSize: number = POT_SIZE): Point {
  const margin = potSize / 2 + 8;
  const minX = field.x + margin;
  const maxX = field.x + Math.max(field.width - margin * 2, 0);
  const minY = field.y + margin;
  const maxY = field.y + Math.max(field.height - margin * 2, 0);

  return {
    x: minX + Math.random() * Math.max(maxX - minX, 0),
    y: minY + Math.random() * Math.max(maxY - minY, 0),
  };
}

/** Projects a straight-line throw from `origin` along the release velocity. Returns null if the flick was too weak to count. */
export function computeThrow(origin: Point, velocity: Point): Point | null {
  const speed = Math.hypot(velocity.x, velocity.y);

  if (speed < FLICK_MIN_SPEED) {
    return null;
  }

  const dirX = velocity.x / speed;
  const dirY = velocity.y / speed;

  return {
    x: origin.x + dirX * THROW_DISTANCE,
    y: origin.y + dirY * THROW_DISTANCE,
  };
}

export function distancePointToSegment(point: Point, a: Point, b: Point): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = point.x - a.x;
  const apy = point.y - a.y;
  const abLenSq = abx * abx + aby * aby;
  const t = abLenSq === 0 ? 0 : Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));
  const closestX = a.x + t * abx;
  const closestY = a.y + t * aby;

  return Math.hypot(point.x - closestX, point.y - closestY);
}

export function isFlickOnTarget(potCenter: Point, throwStart: Point, throwEnd: Point): boolean {
  return distancePointToSegment(potCenter, throwStart, throwEnd) <= POT_HIT_RADIUS;
}
