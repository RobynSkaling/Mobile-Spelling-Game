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

const DECOY_LETTER_POOL = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'm', 'n', 'q', 'r', 'v', 'w', 'x', 'y', 'z'];

/** Builds the shuffled tray of letters for a round: the word's own letters plus `decoyCount` red herrings. */
export function buildLetterBundle(word: string, decoyCount = 0): string[] {
  const wordLetters = word.split('');
  const availableDecoys = DECOY_LETTER_POOL.filter((letter) => !wordLetters.includes(letter));
  const decoys = shuffleLetters(availableDecoys).slice(0, decoyCount);

  return shuffleLetters([...wordLetters, ...decoys]);
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

/**
 * Picks the next leg of a slow wander for a pot centered at `center`, staying within `rangePx`
 * of its current spot while never drifting outside the field bounds.
 */
export function randomDriftOffset(center: Point, field: Bounds, rangePx: number, potSize: number = POT_SIZE): Point {
  const margin = potSize / 2 + 8;
  const minDx = Math.max(-rangePx, field.x + margin - center.x);
  const maxDx = Math.min(rangePx, field.x + field.width - margin - center.x);
  const minDy = Math.max(-rangePx, field.y + margin - center.y);
  const maxDy = Math.min(rangePx, field.y + field.height - margin - center.y);

  return {
    x: minDx + Math.random() * Math.max(maxDx - minDx, 0),
    y: minDy + Math.random() * Math.max(maxDy - minDy, 0),
  };
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/** How far along a drift's "escalation" (0 = just placed, 1 = fully escalated) `elapsedMs` represents. */
export function driftEscalationProgress(elapsedMs: number, escalationMs: number): number {
  if (escalationMs <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, elapsedMs / escalationMs));
}

export type DriftLegParams = {
  rangePx: number;
  legMs: number;
};

/**
 * Interpolates wander speed/range from their starting values toward the fully-escalated ones as
 * `elapsedMs` (time since the pot last landed somewhere) grows, then applies a bit of timing
 * jitter — scaled by how escalated things are — so the pace feels erratic rather than a smooth,
 * predictable ramp.
 */
export function escalatedDriftLeg(
  elapsedMs: number,
  config: {
    potDriftRangePx: number;
    potDriftLegMs: number;
    potDriftMaxRangePx: number;
    potDriftMinLegMs: number;
    potDriftEscalationMs: number;
  },
  jitterRandom: number = Math.random(),
): DriftLegParams {
  const t = driftEscalationProgress(elapsedMs, config.potDriftEscalationMs);
  const rangePx = lerp(config.potDriftRangePx, config.potDriftMaxRangePx, t);
  const baseLegMs = lerp(config.potDriftLegMs, config.potDriftMinLegMs, t);
  // Jitter grows with escalation: +/-40% of the base leg duration at full escalation, none at the start.
  const jitter = 1 + (jitterRandom - 0.5) * 0.8 * t;

  return { rangePx, legMs: Math.max(150, baseLegMs * jitter) };
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
