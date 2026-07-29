import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AcceleratingMusicCue } from '@/features/play/logic/bee-line';
import { resolvePlaybackRateAtElapsedMs } from './playback-rate-ramp';

const CUE: AcceleratingMusicCue = {
  trackId: 'test-track',
  loop: true,
  startRate: 1,
  endRate: 2,
  rampMs: 1000,
};

describe('resolvePlaybackRateAtElapsedMs', () => {
  it('is startRate at elapsedMs = 0', () => {
    assert.equal(resolvePlaybackRateAtElapsedMs(CUE, 0), 1);
  });

  it('interpolates linearly at a midpoint', () => {
    assert.equal(resolvePlaybackRateAtElapsedMs(CUE, 500), 1.5);
    assert.equal(resolvePlaybackRateAtElapsedMs(CUE, 250), 1.25);
  });

  it('clamps to endRate at exactly rampMs', () => {
    assert.equal(resolvePlaybackRateAtElapsedMs(CUE, 1000), 2);
  });

  it('clamps to endRate past rampMs, never overshooting or wrapping', () => {
    assert.equal(resolvePlaybackRateAtElapsedMs(CUE, 5000), 2);
  });

  it('clamps to startRate for a negative elapsedMs', () => {
    assert.equal(resolvePlaybackRateAtElapsedMs(CUE, -50), 1);
  });

  it('treats rampMs <= 0 as an instant jump to endRate, never NaN or a divide-by-zero', () => {
    assert.equal(resolvePlaybackRateAtElapsedMs({ ...CUE, rampMs: 0 }, 0), 2);
    assert.equal(resolvePlaybackRateAtElapsedMs({ ...CUE, rampMs: -100 }, 10), 2);
  });
});
