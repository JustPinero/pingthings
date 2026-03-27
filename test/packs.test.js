import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { listPacks, resolvePack, getPackSounds, pickRandom } = await import('../src/packs.js');

describe('packs', () => {
  it('discovers built-in 7kaa-soldiers pack', () => {
    const packs = listPacks();
    const soldiers = packs.find(p => p.name === '7kaa-soldiers');
    assert.ok(soldiers, 'Should find 7kaa-soldiers pack');
    assert.ok(soldiers.soundCount > 0, 'Should have sounds');
    assert.equal(soldiers.isBuiltIn, true);
  });

  it('resolves 7kaa-soldiers pack', () => {
    const pack = resolvePack('7kaa-soldiers');
    assert.ok(pack, 'Should resolve pack');
    assert.equal(pack.name, '7kaa-soldiers');
    assert.ok(pack.manifest, 'Should have manifest');
    assert.equal(pack.manifest.license, 'GPL-2.0');
  });

  it('returns null for unknown pack', () => {
    const pack = resolvePack('nonexistent-pack');
    assert.equal(pack, null);
  });

  it('gets sounds from 7kaa-soldiers', () => {
    const sounds = getPackSounds('7kaa-soldiers');
    assert.ok(sounds.length > 50, `Expected 50+ sounds, got ${sounds.length}`);
    assert.ok(sounds[0].endsWith('.wav'));
  });

  it('returns empty array for unknown pack sounds', () => {
    const sounds = getPackSounds('nonexistent');
    assert.deepEqual(sounds, []);
  });

  it('pickRandom returns a sound from the array', () => {
    const sounds = ['a.wav', 'b.wav', 'c.wav'];
    const picked = pickRandom(sounds);
    assert.ok(sounds.includes(picked));
  });

  it('pickRandom returns null for empty array', () => {
    assert.equal(pickRandom([]), null);
  });
});
