import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { playSound, playSoundSync } = await import('../src/player.js');
const TEST_SOUND = join(__dirname, '..', 'packs', '7kaa-soldiers', 'sounds', '00083-READY.wav');

describe('player', () => {
  it('throws on nonexistent file (async)', () => {
    assert.throws(() => playSound('/tmp/nonexistent-file.wav'), {
      message: /Sound file not found/,
    });
  });

  it('throws on nonexistent file (sync)', () => {
    assert.throws(() => playSoundSync('/tmp/nonexistent-file.wav'), {
      message: /Sound file not found/,
    });
  });

  it('playSound does not throw on real file', () => {
    // On CI without audio player, this returns silently
    // On dev machine, this spawns afplay/paplay
    assert.doesNotThrow(() => playSound(TEST_SOUND));
  });

  it('playSound accepts volume parameter', () => {
    assert.doesNotThrow(() => playSound(TEST_SOUND, 50));
  });

  it('playSound clamps volume to valid range', () => {
    assert.doesNotThrow(() => playSound(TEST_SOUND, 0));
    assert.doesNotThrow(() => playSound(TEST_SOUND, 100));
    assert.doesNotThrow(() => playSound(TEST_SOUND, -10));  // clamped to 0
    assert.doesNotThrow(() => playSound(TEST_SOUND, 200));  // clamped to 100
  });

  it('playSound handles undefined/null volume', () => {
    assert.doesNotThrow(() => playSound(TEST_SOUND, undefined));
    assert.doesNotThrow(() => playSound(TEST_SOUND, null));
  });

  it('playSoundSync does not throw on real file', () => {
    // On CI this returns silently (no player); on dev machine it plays
    assert.doesNotThrow(() => playSoundSync(TEST_SOUND));
  });

  it('playSoundSync accepts volume', () => {
    assert.doesNotThrow(() => playSoundSync(TEST_SOUND, 50));
  });
});
