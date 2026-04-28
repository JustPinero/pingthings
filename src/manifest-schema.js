// Pack manifest schema (v1.6.0)
//
// Existing fields (kept): name, description, version, license, credits,
// category, sounds, events.
//
// New fields (1.6.0):
//   - sourceUrl   string    canonical URL to the pack's origin (download / project page)
//   - maxVolume   number    0–100 cap on effective playback volume for this pack;
//                           player takes min(globalVolume, maxVolume). Default 100.
//   - tone        string    one of "peaceful" | "professional" | "playful" |
//                           "aggressive" | "mixed". Used for filtering / browsing.
//
// `validatePackManifest` returns { ok: boolean, errors: string[] }. Soft-validates
// — unknown fields are allowed (forward compat). Required fields enforced;
// types of optional fields enforced if present.

export const VALID_TONES = ['peaceful', 'professional', 'playful', 'aggressive', 'mixed'];

export const KNOWN_LICENSES = [
  'CC0-1.0',
  'CC-BY-4.0',
  'CC-BY-3.0',
  'CC-BY-SA-4.0',
  'CC-BY-SA-3.0',
  'CC-BY-NC-4.0',
  'GPL-2.0',
  'GPL-3.0',
  'MIT',
  'Apache-2.0',
  'Public Domain',
  'Royalty-Free',
  'Custom',
  'Unknown',
];

export function validatePackManifest(manifest) {
  const errors = [];

  if (!manifest || typeof manifest !== 'object') {
    return { ok: false, errors: ['manifest is not an object'] };
  }

  // Required: name (string, non-empty)
  if (typeof manifest.name !== 'string' || manifest.name.trim() === '') {
    errors.push('name: required, non-empty string');
  }

  // Required: sounds (array)
  if (!Array.isArray(manifest.sounds)) {
    errors.push('sounds: required array of file paths');
  }

  // Optional but strongly recommended: license, sourceUrl, credits
  if (manifest.license !== undefined && typeof manifest.license !== 'string') {
    errors.push('license: must be a string if present');
  }
  if (manifest.sourceUrl !== undefined) {
    if (typeof manifest.sourceUrl !== 'string') {
      errors.push('sourceUrl: must be a string if present');
    } else if (!/^https?:\/\//.test(manifest.sourceUrl)) {
      errors.push('sourceUrl: must be an http(s) URL if present');
    }
  }

  // maxVolume (optional, 0–100)
  if (manifest.maxVolume !== undefined) {
    const v = manifest.maxVolume;
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 100) {
      errors.push('maxVolume: must be a number between 0 and 100');
    }
  }

  // tone (optional, enum)
  if (manifest.tone !== undefined) {
    if (!VALID_TONES.includes(manifest.tone)) {
      errors.push(`tone: must be one of ${VALID_TONES.join(', ')}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Compute effective playback volume given the global config volume and a
 * pack's maxVolume cap. Returns an integer 0–100.
 */
export function effectiveVolume(globalVolume, packMaxVolume, outputScale = 1.0) {
  const g = Number.isFinite(globalVolume)
    ? Math.max(0, Math.min(100, globalVolume))
    : 100;
  const p = Number.isFinite(packMaxVolume)
    ? Math.max(0, Math.min(100, packMaxVolume))
    : 100;
  const s = Number.isFinite(outputScale) && outputScale >= 0 ? outputScale : 1.0;
  const capped = Math.min(g, p);
  return Math.max(0, Math.min(100, Math.round(capped * s)));
}
