import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { appendTrailPathPoint, beginSteering, resolveTrailSegmentPositions, stepSteering } from './snake-trail';

describe('resolveTrailSegmentPositions', () => {
  it('returns an empty array for zero or negative segment counts', () => {
    assert.deepEqual(resolveTrailSegmentPositions([{ x: 0, y: 0 }], 0, 40), []);
    assert.deepEqual(resolveTrailSegmentPositions([{ x: 0, y: 0 }], -2, 40), []);
  });

  it('returns segmentCount copies of the origin for an empty path rather than throwing', () => {
    const result = resolveTrailSegmentPositions([], 3, 40);
    assert.deepEqual(result, [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ]);
  });

  it('clamps every segment to the single recorded point when the head has not moved yet', () => {
    const head = { x: 12, y: 34 };
    const result = resolveTrailSegmentPositions([head], 3, 40);
    assert.deepEqual(result, [head, head, head]);
  });

  it('places segments at the correct arc-length distance behind the head on a straight line', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];
    const result = resolveTrailSegmentPositions(path, 2, 30);
    assert.deepEqual(result, [
      { x: 70, y: 0 },
      { x: 40, y: 0 },
    ]);
  });

  it('walks backward through a corner in the recorded path rather than cutting across it', () => {
    // Head moved from (0,0) to (50,0) to (50,50) — an L-shaped path.
    const path = [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 50 },
    ];

    // 30px behind the head stays within the most recent (vertical) leg.
    const near = resolveTrailSegmentPositions(path, 1, 30)[0];
    assert.equal(near.x, 50);
    assert.ok(Math.abs(near.y - 20) < 1e-9);

    // 70px behind the head spills over into the earlier (horizontal) leg: 50px used up on the
    // vertical leg, 20px remaining walked back along the horizontal one.
    const far = resolveTrailSegmentPositions(path, 1, 70)[0];
    assert.ok(Math.abs(far.x - 30) < 1e-9);
    assert.equal(far.y, 0);
  });

  it('clamps to the oldest recorded sample when the requested distance exceeds the path length', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ];
    const result = resolveTrailSegmentPositions(path, 1, 1000);
    assert.deepEqual(result, [{ x: 0, y: 0 }]);
  });

  it('every trailing segment sits exactly on the head when spacingPx is 0', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 40 },
    ];
    const result = resolveTrailSegmentPositions(path, 3, 0);
    assert.deepEqual(result, [
      { x: 40, y: 40 },
      { x: 40, y: 40 },
      { x: 40, y: 40 },
    ]);
  });

  it('is pure — the same inputs always produce the same outputs', () => {
    const path = [
      { x: 5, y: 5 },
      { x: 20, y: 5 },
      { x: 20, y: 45 },
      { x: 60, y: 45 },
    ];
    const first = resolveTrailSegmentPositions(path, 4, 25);
    const second = resolveTrailSegmentPositions(path, 4, 25);
    assert.deepEqual(first, second);
  });
});

describe('appendTrailPathPoint', () => {
  it('always appends the first point regardless of distance', () => {
    const result = appendTrailPathPoint([], { x: 0, y: 0 }, { minSpacingPx: 100, maxLength: 10 });
    assert.deepEqual(result, [{ x: 0, y: 0 }]);
  });

  it('appends a new point once it clears minSpacingPx from the last recorded one', () => {
    const path = [{ x: 0, y: 0 }];
    const result = appendTrailPathPoint(path, { x: 10, y: 0 }, { minSpacingPx: 4, maxLength: 100 });
    assert.deepEqual(result, [{ x: 0, y: 0 }, { x: 10, y: 0 }]);
  });

  it('drops a near-duplicate point (finger holding nearly still) rather than appending it', () => {
    const path = [{ x: 0, y: 0 }];
    const result = appendTrailPathPoint(path, { x: 1, y: 1 }, { minSpacingPx: 10, maxLength: 100 });
    assert.deepEqual(result, path);
  });

  it('caps the history length, dropping the oldest sample first', () => {
    let path: { x: number; y: number }[] = [];
    for (let i = 0; i < 5; i += 1) {
      path = appendTrailPathPoint(path, { x: i * 10, y: 0 }, { minSpacingPx: 1, maxLength: 3 });
    }
    assert.deepEqual(path, [
      { x: 20, y: 0 },
      { x: 30, y: 0 },
      { x: 40, y: 0 },
    ]);
  });
});

describe('head steering', () => {
  const bounds = { minX: 0, maxX: 300, minY: 0, maxY: 300 };
  const options = { leadPx: 40, rampPx: 20, bounds };

  it('does not move the head when the finger first grabs it', () => {
    const state = beginSteering({ x: 100, y: 100 }, { x: 110, y: 112 });
    const { head } = stepSteering(state, { x: 110, y: 112 }, options);
    assert.deepEqual(head, { x: 100, y: 100 });
  });

  it('moves the head by the finger movement and leads ahead of it in the travel direction', () => {
    let state = beginSteering({ x: 100, y: 100 }, { x: 0, y: 0 });
    let head = { x: 100, y: 100 };
    for (let x = 10; x <= 200; x += 10) {
      ({ state, head } = stepSteering(state, { x, y: 0 }, options));
    }
    // The finger travelled 200px right; the head is its base (300 clamps at the wall) plus a lead.
    assert.ok(head.x > state.base.x - 1e-9 || head.x === bounds.maxX);
    assert.ok(state.lead.x > 30 && state.lead.x <= 40);
    assert.ok(Math.abs(state.lead.y) < 1e-6);
  });

  it('ramps the lead in rather than snapping it on at the start of a drag', () => {
    const state = beginSteering({ x: 100, y: 100 }, { x: 0, y: 0 });
    const { head } = stepSteering(state, { x: 5, y: 0 }, options);
    assert.ok(head.x - 105 < 40 * 0.3);
  });

  it('keeps the head inside the bounds even when the finger keeps going', () => {
    let state = beginSteering({ x: 290, y: 290 }, { x: 0, y: 0 });
    let head = { x: 290, y: 290 };
    for (let i = 1; i <= 50; i += 1) {
      ({ state, head } = stepSteering(state, { x: i * 10, y: i * 10 }, options));
    }
    assert.ok(head.x <= bounds.maxX && head.y <= bounds.maxY);
    // And it comes straight back when the finger reverses, rather than staying stuck at the wall.
    ({ head } = stepSteering(state, { x: 490, y: 490 }, options));
    assert.ok(head.x < bounds.maxX + 1e-9);
  });
});
