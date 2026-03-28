import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Set XDG_CONFIG_HOME before importing config module
const tmpDir = mkdtempSync(join(tmpdir(), 'pingthings-test-'));
process.env.XDG_CONFIG_HOME = tmpDir;

const { readConfig, writeConfig, getConfigDir, getDefaults, VALID_MODES, VALID_EVENTS } = await import('../src/config.js');

describe('config', () => {
  beforeEach(() => {
    // Clean config between tests
    try { rmSync(join(getConfigDir(), 'config.json')); } catch {}
  });

  afterEach(() => {
    try { rmSync(join(getConfigDir(), 'config.json')); } catch {}
  });

  it('returns defaults when no config file exists', () => {
    const config = readConfig();
    assert.deepEqual(config, getDefaults());
    assert.equal(config.activePack, '7kaa-soldiers');
    assert.equal(config.mode, 'random');
    assert.equal(config.specificSound, null);
  });

  it('writes and reads config', () => {
    const custom = { activePack: 'test-pack', mode: 'specific', specificSound: 'beep', volume: 80, eventPacks: { error: 'freedoom-arsenal' } };
    writeConfig(custom);
    const read = readConfig();
    assert.equal(read.activePack, 'test-pack');
    assert.equal(read.mode, 'specific');
    assert.equal(read.specificSound, 'beep');
    assert.equal(read.volume, 80);
    assert.equal(read.eventPacks.error, 'freedoom-arsenal');
  });

  it('merges defaults with partial config', () => {
    writeConfig({ activePack: 'custom' });
    const config = readConfig();
    assert.equal(config.activePack, 'custom');
    assert.equal(config.mode, 'random');
  });

  it('handles corrupt JSON gracefully', async () => {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(join(getConfigDir(), 'config.json'), 'not json!!!');
    const config = readConfig();
    assert.deepEqual(config, getDefaults());
  });

  it('uses XDG_CONFIG_HOME', () => {
    const dir = getConfigDir();
    assert.ok(dir.startsWith(tmpDir));
  });

  it('has valid modes defined', () => {
    assert.ok(VALID_MODES.includes('random'));
    assert.ok(VALID_MODES.includes('specific'));
    assert.ok(VALID_MODES.includes('informational'));
    assert.equal(VALID_MODES.length, 3);
  });

  it('has valid events defined', () => {
    assert.ok(VALID_EVENTS.includes('done'));
    assert.ok(VALID_EVENTS.includes('permission'));
    assert.ok(VALID_EVENTS.includes('complete'));
    assert.ok(VALID_EVENTS.includes('error'));
    assert.ok(VALID_EVENTS.includes('blocked'));
    assert.equal(VALID_EVENTS.length, 5);
  });
});
