import { Point } from './honey-pot-flick';

/**
 * Bee Line `hard`+'s Snake/Centipede body-follows-head math (roadmap Epic 19 revision, post-
 * playtest rework — see `docs/mama-bears-spelling-bee-roadmap-and-mvp.md`'s Epic 19 revision note).
 * The head (the first collected letter) is steered continuously around the field by the child;
 * every letter collected after it becomes a trailing segment that follows the exact path the head
 * already traveled, the standard technique for a body-follows-head snake — rather than each segment
 * chasing the *previous* segment's live position (which bunches up or cuts corners on sharp turns),
 * every segment sits at a fixed arc-length distance behind the head, found by walking backward
 * along the head's recorded path.
 *
 * Pure and RN/gesture-independent, mirroring `bee-line.ts`/`honey-pot-flick.ts`/
 * `sprite-animation.ts`'s "pure logic gets a sibling `.test.ts`" convention. `BeeLineScreen.tsx`
 * owns *recording* the path (an array that grows every drag frame, kept in a ref) — this module
 * only answers "given that recorded history, where do N trailing segments sit right now."
 */

const ORIGIN: Point = { x: 0, y: 0 };

/**
 * Walks backward from the head (the last point in `path`) along the recorded path until
 * `targetDistance` (px, arc length) has been covered, and returns the point at that distance.
 * If the recorded path is shorter than `targetDistance` (e.g. early in a drag, or a segment
 * further behind the head than the child has moved so far), clamps to the oldest recorded sample
 * rather than extrapolating past it.
 */
function pointAtDistanceBehindHead(path: Point[], targetDistance: number): Point {
  let remaining = targetDistance;

  for (let i = path.length - 1; i > 0; i -= 1) {
    const from = path[i];
    const to = path[i - 1];
    const legLength = Math.hypot(to.x - from.x, to.y - from.y);

    if (legLength >= remaining) {
      const t = legLength === 0 ? 0 : remaining / legLength;
      return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
    }

    remaining -= legLength;
  }

  return path[0];
}

/**
 * Given a recorded head-path history (oldest sample at index 0, current head position last — i.e.
 * `path[path.length - 1]` *is* the head) and a number of trailing segments spaced `spacingPx` apart
 * behind the head, returns each segment's position: segment 0 sits `spacingPx` behind the head,
 * segment 1 sits `2 * spacingPx` behind, and so on.
 *
 * Degenerate inputs are handled without throwing: `segmentCount <= 0` returns `[]`; an empty `path`
 * (nothing recorded yet) returns `segmentCount` copies of the origin rather than crashing, since a
 * caller should not realistically ask for trailing segments before the head has ever been placed,
 * but this keeps the function total rather than partial.
 */
export function resolveTrailSegmentPositions(path: Point[], segmentCount: number, spacingPx: number): Point[] {
  if (segmentCount <= 0) {
    return [];
  }

  if (path.length === 0) {
    return new Array(segmentCount).fill(ORIGIN);
  }

  const positions: Point[] = [];
  for (let segment = 1; segment <= segmentCount; segment += 1) {
    positions.push(pointAtDistanceBehindHead(path, segment * spacingPx));
  }

  return positions;
}

export type AppendTrailPathPointOptions = {
  /** Minimum distance (px) a new sample must be from the last recorded one to be kept. Filters out
   *  near-duplicate points from a finger holding nearly still, which would otherwise make the path
   *  history balloon for no visual benefit. */
  minSpacingPx: number;
  /** Caps the history length so an unusually long/wandering drag doesn't grow the array forever;
   *  the oldest samples are dropped first once the cap is exceeded. */
  maxLength: number;
};

/**
 * Pure "append one sample to the recorded head path" step: dedupes near-identical consecutive
 * points and caps the history length. `BeeLineScreen.tsx` calls this on every `onUpdate` and owns
 * *storing* the result (in a ref, so the path growing every frame doesn't itself force a re-render)
 * — that storage is inherently stateful/RN-ish, but the append rule itself has no RN dependency and
 * is worth testing in isolation.
 */
export function appendTrailPathPoint(path: Point[], point: Point, options: AppendTrailPathPointOptions): Point[] {
  const last = path[path.length - 1];

  if (last && Math.hypot(point.x - last.x, point.y - last.y) < options.minSpacingPx) {
    return path;
  }

  const next = [...path, point];
  return next.length > options.maxLength ? next.slice(next.length - options.maxLength) : next;
}

// ---------------------------------------------------------------------------
// Head steering (Epic 29): the head leads slightly ahead of the finger so the finger never hides it
// ---------------------------------------------------------------------------

export type SteeringState = {
  /** Where the head would be with no lead: it moves by exactly the finger's movement, so grabbing
   *  the head never makes it jump, and it stops at the field walls instead of being dragged past. */
  base: Point;
  lastFinger: Point;
  travelledPx: number;
  /** Smoothed offset from `base` towards the direction of travel. */
  lead: Point;
};

export type SteeringOptions = {
  /** Largest distance the head is drawn ahead of the finger. */
  leadPx: number;
  /** The lead grows from zero over this much finger travel, so a fresh grab doesn't snap ahead. */
  rampPx: number;
  /** Area (same coordinate space as the head) the head's centre must stay inside. */
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  /** 0..1 share of the remaining gap to the target lead closed per update. */
  smoothing?: number;
};

const clampPoint = (point: Point, bounds: SteeringOptions['bounds']): Point => ({
  x: Math.min(Math.max(point.x, bounds.minX), bounds.maxX),
  y: Math.min(Math.max(point.y, bounds.minY), bounds.maxY),
});

export function beginSteering(head: Point, finger: Point): SteeringState {
  return { base: head, lastFinger: finger, travelledPx: 0, lead: { x: 0, y: 0 } };
}

/** Pure per-frame step: moves the head with the finger, leans it ahead in the direction of travel,
 *  and keeps it inside `bounds`. Returns the new state and the head's centre. */
export function stepSteering(
  state: SteeringState,
  finger: Point,
  options: SteeringOptions,
): { state: SteeringState; head: Point } {
  const dx = finger.x - state.lastFinger.x;
  const dy = finger.y - state.lastFinger.y;
  const moved = Math.hypot(dx, dy);
  const smoothing = options.smoothing ?? 0.3;

  const base = clampPoint({ x: state.base.x + dx, y: state.base.y + dy }, options.bounds);
  const travelledPx = state.travelledPx + moved;

  let lead = state.lead;
  if (moved >= 1) {
    const ramp = Math.min(1, travelledPx / Math.max(options.rampPx, 1));
    const targetX = (dx / moved) * options.leadPx * ramp;
    const targetY = (dy / moved) * options.leadPx * ramp;
    lead = { x: lead.x + (targetX - lead.x) * smoothing, y: lead.y + (targetY - lead.y) * smoothing };
  }

  const head = clampPoint({ x: base.x + lead.x, y: base.y + lead.y }, options.bounds);
  return { state: { base, lastFinger: finger, travelledPx, lead }, head };
}
