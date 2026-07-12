import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveSpriteAnimationDurationMs,
  resolveSpriteFrameIndex,
  resolveSpriteFrameOffsetX,
} from './sprite-animation';

describe('resolveSpriteFrameIndex', () => {
  it('starts at frame 0', () => {
    assert.equal(resolveSpriteFrameIndex(0, 6, true), 0);
  });

  it('advances one frame at a time as framesElapsed increases', () => {
    assert.equal(resolveSpriteFrameIndex(2.9, 6, true), 2);
    assert.equal(resolveSpriteFrameIndex(3, 6, true), 3);
  });

  it('wraps back to 0 past the last frame when looping', () => {
    assert.equal(resolveSpriteFrameIndex(6, 6, true), 0);
    assert.equal(resolveSpriteFrameIndex(7, 6, true), 1);
    assert.equal(resolveSpriteFrameIndex(13, 6, true), 1);
  });

  it('holds on the last frame past the end when not looping', () => {
    assert.equal(resolveSpriteFrameIndex(5, 6, false), 5);
    assert.equal(resolveSpriteFrameIndex(6, 6, false), 5);
    assert.equal(resolveSpriteFrameIndex(100, 6, false), 5);
  });

  it('returns 0 for degenerate inputs instead of throwing or going negative', () => {
    assert.equal(resolveSpriteFrameIndex(5, 0, true), 0);
    assert.equal(resolveSpriteFrameIndex(-1, 6, true), 0);
  });
});

describe('resolveSpriteFrameOffsetX', () => {
  it('is frameIndex * frameWidth for a horizontal-strip sheet', () => {
    assert.equal(resolveSpriteFrameOffsetX(0, 128), 0);
    assert.equal(resolveSpriteFrameOffsetX(3, 128), 384);
  });

  it('clamps a negative frame index to 0 rather than offsetting the wrong way', () => {
    assert.equal(resolveSpriteFrameOffsetX(-2, 128), 0);
  });
});

describe('resolveSpriteAnimationDurationMs', () => {
  it('computes total playback duration from frame count and fps', () => {
    assert.equal(resolveSpriteAnimationDurationMs(12, 12), 1000);
    assert.equal(resolveSpriteAnimationDurationMs(6, 12), 500);
  });

  it('returns 0 for degenerate inputs instead of NaN or Infinity', () => {
    assert.equal(resolveSpriteAnimationDurationMs(0, 12), 0);
    assert.equal(resolveSpriteAnimationDurationMs(12, 0), 0);
  });
});
