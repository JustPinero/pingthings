import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Override the config dir to a tmp location so this test is isolated
// from the user's real config.
let tmpRoot;
let originalXdg;

before(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'pingthings-test-'));
  originalXdg = process.env.XDG_CONFIG_HOME;
  process.env.XDG_CONFIG_HOME = tmpRoot;
});

after(() => {
  if (originalXdg === undefined) delete process.env.XDG_CONFIG_HOME;
  else process.env.XDG_CONFIG_HOME = originalXdg;
  rmSync(tmpRoot, { recursive: true, force: true });
});

const cfgImport = await import('../src/config.js');
const {
  setMuteUntilMs,
  clearMute,
  isMuteActive,
  findScheduleProfile,
  resolveActivePack,
} = cfgImport;

describe('manual mute (sentinel)', () => {
  it('isMuteActive false when no sentinel', () => {
    clearMute();
    assert.equal(isMuteActive(), false);
  });

  it('isMuteActive true when sentinel is in the future', () => {
    setMuteUntilMs(Date.now() + 60000);
    assert.equal(isMuteActive(), true);
  });

  it('isMuteActive false when sentinel is in the past', () => {
    setMuteUntilMs(Date.now() - 1000);
    assert.equal(isMuteActive(), false);
  });

  it('clearMute removes the sentinel', () => {
    setMuteUntilMs(Date.now() + 60000);
    assert.equal(isMuteActive(), true);
    clearMute();
    assert.equal(isMuteActive(), false);
  });
});

describe('findScheduleProfile', () => {
  it('returns null on empty profiles', () => {
    assert.equal(findScheduleProfile({}, 14), null);
  });

  it('matches a daytime window', () => {
    const profiles = { '9-17': 'office-minimal' };
    assert.equal(findScheduleProfile(profiles, 13), 'office-minimal');
    assert.equal(findScheduleProfile(profiles, 8), null);
    assert.equal(findScheduleProfile(profiles, 17), null);
  });

  it('matches a wrap-around (overnight) window', () => {
    const profiles = { '22-7': 'serene-bells' };
    assert.equal(findScheduleProfile(profiles, 23), 'serene-bells');
    assert.equal(findScheduleProfile(profiles, 5), 'serene-bells');
    assert.equal(findScheduleProfile(profiles, 10), null);
  });

  it('first match wins when multiple windows overlap', () => {
    const profiles = { '9-17': 'office-minimal', '14-15': 'serene-bells' };
    assert.equal(findScheduleProfile(profiles, 14), 'office-minimal');
  });

  it('skips malformed window keys', () => {
    const profiles = { 'foo-bar': 'x', '10-12': 'serene-bells' };
    assert.equal(findScheduleProfile(profiles, 11), 'serene-bells');
  });
});

describe('resolveActivePack', () => {
  it('falls back to config.activePack when nothing else applies', () => {
    delete process.env.PINGTHINGS_PACK;
    const pack = resolveActivePack(
      { activePack: 'serene-bells', timeProfiles: {} },
      '/nowhere',
      new Date(2026, 0, 1, 14),
    );
    assert.equal(pack, 'serene-bells');
  });

  it('respects PINGTHINGS_PACK env override', () => {
    process.env.PINGTHINGS_PACK = 'office-minimal';
    const pack = resolveActivePack(
      { activePack: 'serene-bells', timeProfiles: {} },
      '/nowhere',
      new Date(2026, 0, 1, 14),
    );
    assert.equal(pack, 'office-minimal');
    delete process.env.PINGTHINGS_PACK;
  });

  it('respects per-project .claude/settings.json override', () => {
    delete process.env.PINGTHINGS_PACK;
    const projectDir = join(tmpRoot, 'proj');
    mkdirSync(join(projectDir, '.claude'), { recursive: true });
    writeFileSync(
      join(projectDir, '.claude', 'settings.json'),
      JSON.stringify({ pingthings: { activePack: 'kenney-interface' } }),
    );
    const pack = resolveActivePack(
      { activePack: 'serene-bells', timeProfiles: {} },
      projectDir,
      new Date(2026, 0, 1, 14),
    );
    assert.equal(pack, 'kenney-interface');
  });

  it('falls back to schedule when no env / project override', () => {
    delete process.env.PINGTHINGS_PACK;
    const pack = resolveActivePack(
      { activePack: 'default', timeProfiles: { '9-17': 'office-minimal' } },
      '/nowhere',
      new Date(2026, 0, 1, 13),
    );
    assert.equal(pack, 'office-minimal');
  });

  it('priority: env > project > schedule > default', () => {
    process.env.PINGTHINGS_PACK = 'env-wins';
    const projectDir = join(tmpRoot, 'priority');
    mkdirSync(join(projectDir, '.claude'), { recursive: true });
    writeFileSync(
      join(projectDir, '.claude', 'settings.json'),
      JSON.stringify({ pingthings: { activePack: 'project-wins' } }),
    );
    const pack = resolveActivePack(
      { activePack: 'default-wins', timeProfiles: { '0-23': 'schedule-wins' } },
      projectDir,
      new Date(2026, 0, 1, 14),
    );
    assert.equal(pack, 'env-wins');
    delete process.env.PINGTHINGS_PACK;
  });
});
