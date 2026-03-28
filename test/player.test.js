import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Import the module to test internal behavior
const { playSound, playSoundSync } = await import('../src/player.js');

describe('player', () => {
  it('throws on nonexistent file', () => {
    assert.throws(() => playSound('/tmp/nonexistent-file.wav'), {
      message: /Sound file not found/,
    });
  });

  it('throws on nonexistent file (sync)', () => {
    assert.throws(() => playSoundSync('/tmp/nonexistent-file.wav'), {
      message: /Sound file not found/,
    });
  });

  it('plays a real sound file without error', () => {
    // Find a real WAV file from the built-in packs
    const testSound = join(__dirname, '..', 'packs', '7kaa-soldiers', 'sounds', '00083-READY.wav');
    assert.doesNotThrow(() => playSound(testSound));
  });

  it('plays with volume parameter', () => {
    const testSound = join(__dirname, '..', 'packs', '7kaa-soldiers', 'sounds', '00083-READY.wav');
    assert.doesNotThrow(() => playSound(testSound, 50));
  });

  it('handles volume edge cases', () => {
    const testSound = join(__dirname, '..', 'packs', '7kaa-soldiers', 'sounds', '00083-READY.wav');
    assert.doesNotThrow(() => playSound(testSound, 0));
    assert.doesNotThrow(() => playSound(testSound, 100));
    assert.doesNotThrow(() => playSound(testSound, -10)); // clamped to 0
    assert.doesNotThrow(() => playSound(testSound, 200)); // clamped to 100
  });

  it('handles undefined volume gracefully', () => {
    const testSound = join(__dirname, '..', 'packs', '7kaa-soldiers', 'sounds', '00083-READY.wav');
    assert.doesNotThrow(() => playSound(testSound, undefined));
    assert.doesNotThrow(() => playSound(testSound, null));
  });
});
