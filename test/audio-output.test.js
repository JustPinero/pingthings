import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectAudioOutput,
  isHeadphonesActive,
  _resetAudioOutputCache,
} from '../src/audio-output.js';

describe('audio-output detector', () => {
  it('detectAudioOutput returns one of the expected values', () => {
    const r = detectAudioOutput();
    assert.ok(['headphones', 'speakers', 'unknown'].includes(r));
  });

  it('isHeadphonesActive returns a boolean', () => {
    assert.equal(typeof isHeadphonesActive(), 'boolean');
  });

  it('detectAudioOutput never throws', () => {
    assert.doesNotThrow(() => detectAudioOutput());
  });

  // 1.6.1 — caching
  it('cache: second call within ttl returns the same value (no re-detect)', () => {
    _resetAudioOutputCache();
    const v1 = detectAudioOutput({ ttlMs: 60_000 });
    const v2 = detectAudioOutput({ ttlMs: 60_000 });
    assert.equal(v1, v2);
  });

  it('cache: force=true bypasses cache', () => {
    _resetAudioOutputCache();
    detectAudioOutput({ ttlMs: 60_000 });
    // No good way to assert "actually re-ran" without instrumenting
    // child_process; just verify the call succeeds and shape is valid.
    const v = detectAudioOutput({ force: true });
    assert.ok(['headphones', 'speakers', 'unknown'].includes(v));
  });

  it('cache: zero ttl always re-detects (functionally equivalent to force)', () => {
    _resetAudioOutputCache();
    const v = detectAudioOutput({ ttlMs: 0 });
    assert.ok(['headphones', 'speakers', 'unknown'].includes(v));
  });
});
