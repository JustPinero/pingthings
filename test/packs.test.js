import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const { listPacks, resolvePack, getPackSounds, getEventSounds, getPackEvents, pickRandom } = await import('../src/packs.js');

const ALL_PACKS = [
  '0ad-civilizations', '7kaa-soldiers', 'droid-announcer', 'fighting-announcer', 'freedoom-arsenal',
  'kenney-digital', 'kenney-fighter', 'kenney-impacts', 'kenney-interface', 'kenney-rpg',
  'kenney-scifi', 'kenney-voiceover', 'mduel-retro', 'nature-animals', 'nature-forest',
  'nature-night', 'nature-ocean', 'nature-weather', 'office-classic', 'office-digital',
  'office-mechanical', 'office-minimal', 'openarena-announcer', 'retro-8bit', 'retro-movement',
  'retro-weapons', 'serene-bells', 'serene-tones', 'serene-water', 'serene-wind',
  'warzone2100-command', 'wesnoth-combat', 'xonotic-announcer',
];

describe('packs', () => {
  it('discovers all built-in packs', () => {
    const packs = listPacks();
    for (const name of ALL_PACKS) {
      const found = packs.find(p => p.name === name);
      assert.ok(found, `Should find pack: ${name}`);
      assert.ok(found.soundCount > 0, `${name} should have sounds`);
      assert.equal(found.isBuiltIn, true);
    }
  });

  it('each pack has a category', () => {
    const packs = listPacks();
    for (const pack of packs) {
      assert.ok(pack.category, `${pack.name} should have a category`);
      assert.notEqual(pack.category, 'other', `${pack.name} should have a real category`);
    }
  });

  it('each pack has a version', () => {
    const packs = listPacks();
    for (const pack of packs) {
      assert.ok(pack.version, `${pack.name} should have a version`);
    }
  });

  it('resolves each pack', () => {
    for (const name of ALL_PACKS) {
      const pack = resolvePack(name);
      assert.ok(pack, `Should resolve: ${name}`);
      assert.ok(pack.manifest, `${name} should have a manifest`);
      assert.ok(pack.manifest.license, `${name} should have a license`);
      assert.ok(pack.manifest.credits, `${name} should have credits`);
    }
  });

  it('returns null for unknown pack', () => {
    assert.equal(resolvePack('nonexistent-pack'), null);
  });

  it('gets sounds from each pack', () => {
    for (const name of ALL_PACKS) {
      const sounds = getPackSounds(name);
      assert.ok(sounds.length > 0, `${name} should have sounds`);
      assert.ok(sounds[0].endsWith('.ogg') || sounds[0].endsWith('.wav'), `${name} sounds should be OGG or WAV`);
    }
  });

  it('returns empty array for unknown pack sounds', () => {
    assert.deepEqual(getPackSounds('nonexistent'), []);
  });

  it('all packs have 5 event mappings', () => {
    for (const name of ALL_PACKS) {
      const events = getPackEvents(name);
      assert.equal(events.length, 5, `${name} should have 5 event types, got ${events.length}`);
      assert.ok(events.includes('done'), `${name} missing done event`);
      assert.ok(events.includes('permission'), `${name} missing permission event`);
      assert.ok(events.includes('complete'), `${name} missing complete event`);
      assert.ok(events.includes('error'), `${name} missing error event`);
      assert.ok(events.includes('blocked'), `${name} missing blocked event`);
    }
  });

  it('each event mapping has at least one sound', () => {
    for (const name of ALL_PACKS) {
      for (const event of ['done', 'permission', 'complete', 'error', 'blocked']) {
        const sounds = getEventSounds(name, event);
        assert.ok(sounds.length > 0, `${name}/${event} should have at least one sound`);
      }
    }
  });

  it('event sounds are valid file paths', async () => {
    const { existsSync } = await import('node:fs');
    for (const name of ALL_PACKS) {
      for (const event of ['done', 'error']) {
        const sounds = getEventSounds(name, event);
        for (const s of sounds) {
          assert.ok(existsSync(s), `${name}/${event}: file should exist: ${s}`);
        }
      }
    }
  });

  it('returns empty array for unknown event', () => {
    assert.deepEqual(getEventSounds('7kaa-soldiers', 'nonexistent'), []);
  });

  it('returns empty array for event on unknown pack', () => {
    assert.deepEqual(getEventSounds('fake-pack', 'done'), []);
  });

  it('pickRandom returns an element from the array', () => {
    const items = ['a.wav', 'b.wav', 'c.wav'];
    const picked = pickRandom(items);
    assert.ok(items.includes(picked));
  });

  it('pickRandom returns null for empty array', () => {
    assert.equal(pickRandom([]), null);
  });
});
