import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePackManifest,
  effectiveVolume,
  VALID_TONES,
  KNOWN_LICENSES,
} from '../src/manifest-schema.js';

describe('validatePackManifest', () => {
  it('accepts a minimal valid manifest', () => {
    const r = validatePackManifest({
      name: 'sample',
      sounds: ['sounds/a.ogg'],
    });
    assert.equal(r.ok, true);
    assert.deepEqual(r.errors, []);
  });

  it('rejects when name is missing', () => {
    const r = validatePackManifest({ sounds: [] });
    assert.equal(r.ok, false);
    assert.match(r.errors[0], /name/);
  });

  it('rejects when sounds is not an array', () => {
    const r = validatePackManifest({ name: 'x' });
    assert.equal(r.ok, false);
    assert.ok(r.errors.some(e => /sounds/.test(e)));
  });

  it('rejects sourceUrl that is not http(s)', () => {
    const r = validatePackManifest({
      name: 'x',
      sounds: [],
      sourceUrl: 'ftp://example.com',
    });
    assert.equal(r.ok, false);
    assert.ok(r.errors.some(e => /sourceUrl/.test(e)));
  });

  it('rejects maxVolume out of range', () => {
    const r = validatePackManifest({ name: 'x', sounds: [], maxVolume: 150 });
    assert.equal(r.ok, false);
    assert.ok(r.errors.some(e => /maxVolume/.test(e)));
  });

  it('rejects unknown tone', () => {
    const r = validatePackManifest({ name: 'x', sounds: [], tone: 'spicy' });
    assert.equal(r.ok, false);
    assert.ok(r.errors.some(e => /tone/.test(e)));
  });

  it('accepts every VALID_TONES value', () => {
    for (const t of VALID_TONES) {
      const r = validatePackManifest({ name: 'x', sounds: [], tone: t });
      assert.equal(r.ok, true, `tone ${t} should validate`);
    }
  });

  it('exports KNOWN_LICENSES with CC0-1.0 and Public Domain', () => {
    assert.ok(KNOWN_LICENSES.includes('CC0-1.0'));
    assert.ok(KNOWN_LICENSES.includes('Public Domain'));
  });
});

describe('effectiveVolume', () => {
  it('takes the min of global and pack max', () => {
    assert.equal(effectiveVolume(80, 60), 60);
    assert.equal(effectiveVolume(40, 80), 40);
  });

  it('treats undefined packMax as 100 (no cap)', () => {
    assert.equal(effectiveVolume(75, undefined), 75);
  });

  it('clamps both inputs to [0, 100]', () => {
    assert.equal(effectiveVolume(150, 200), 100);
    assert.equal(effectiveVolume(-10, 50), 0);
  });

  // 1.6.1 — output scale (headphone-aware volume)
  it('applies output scale (e.g. 0.7 for headphones)', () => {
    assert.equal(effectiveVolume(100, 100, 0.7), 70);
    assert.equal(effectiveVolume(80, 80, 0.5), 40);
  });

  it('default output scale is 1.0 (backwards compatible)', () => {
    assert.equal(effectiveVolume(80, 100), 80);
  });

  it('rejects invalid scale and falls back to 1.0', () => {
    assert.equal(effectiveVolume(80, 100, NaN), 80);
    assert.equal(effectiveVolume(80, 100, -1), 80);
  });

  it('combines pack cap + scale (cap first, then scale)', () => {
    // global 100, pack max 60, scale 0.5 → min(100,60)*0.5 = 30
    assert.equal(effectiveVolume(100, 60, 0.5), 30);
  });

  it('clamps scaled result to [0, 100]', () => {
    // scale > 1 with high cap should still clamp at 100
    assert.equal(effectiveVolume(100, 100, 2.0), 100);
  });
});
