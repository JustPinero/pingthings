import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { listPacks, resolvePack, getPackSounds, getEventSounds, getPackEvents, pickRandom } = await import('../src/packs.js');

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

  it('gets event sounds for 7kaa-soldiers done event', () => {
    const sounds = getEventSounds('7kaa-soldiers', 'done');
    assert.ok(sounds.length > 0, 'Should have done event sounds');
    assert.ok(sounds[0].endsWith('.wav'));
  });

  it('gets event sounds for all event types', () => {
    const events = ['done', 'permission', 'complete', 'error', 'blocked'];
    for (const event of events) {
      const sounds = getEventSounds('7kaa-soldiers', event);
      assert.ok(sounds.length > 0, `Should have ${event} event sounds`);
    }
  });

  it('returns empty array for unknown event', () => {
    const sounds = getEventSounds('7kaa-soldiers', 'nonexistent');
    assert.deepEqual(sounds, []);
  });

  it('returns empty array for event on unknown pack', () => {
    const sounds = getEventSounds('fake-pack', 'done');
    assert.deepEqual(sounds, []);
  });

  it('lists available events for a pack', () => {
    const events = getPackEvents('7kaa-soldiers');
    assert.ok(events.includes('done'));
    assert.ok(events.includes('error'));
    assert.ok(events.includes('complete'));
    assert.ok(events.includes('permission'));
    assert.ok(events.includes('blocked'));
  });

  it('all 6 packs have event mappings', () => {
    const packs = ['7kaa-soldiers', 'wesnoth-combat', 'openarena-announcer', 'freedoom-arsenal', 'warzone2100-command', '0ad-civilizations'];
    for (const packName of packs) {
      const events = getPackEvents(packName);
      assert.ok(events.length === 5, `${packName} should have 5 event types, got ${events.length}`);
    }
  });
});
