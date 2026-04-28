import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectAudioOutput,
  isHeadphonesActive,
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
});
