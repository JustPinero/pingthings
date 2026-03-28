import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = join(__dirname, '..', 'bin', 'pingthings.js');
const tmpDirs = [];

function run(args, opts = {}) {
  const tmpConfig = mkdtempSync(join(tmpdir(), 'pingthings-cli-'));
  tmpDirs.push(tmpConfig);
  const env = { ...process.env, XDG_CONFIG_HOME: tmpConfig, ...opts.env };
  try {
    const stdout = execFileSync('node', [CLI, ...args], {
      encoding: 'utf8',
      env,
      timeout: 5000,
    });
    return { stdout, exitCode: 0, tmpConfig };
  } catch (err) {
    return { stdout: err.stdout || '', stderr: err.stderr || '', exitCode: err.status, tmpConfig };
  }
}

// Shared tmpConfig for cross-command tests
function runWith(tmpConfig, args) {
  const env = { ...process.env, XDG_CONFIG_HOME: tmpConfig };
  try {
    const stdout = execFileSync('node', [CLI, ...args], {
      encoding: 'utf8',
      env,
      timeout: 5000,
    });
    return { stdout, exitCode: 0 };
  } catch (err) {
    return { stdout: err.stdout || '', stderr: err.stderr || '', exitCode: err.status };
  }
}

after(() => {
  for (const dir of tmpDirs) {
    try { rmSync(dir, { recursive: true }); } catch {}
  }
});

describe('CLI core', () => {
  it('--version prints semver', () => {
    const { stdout } = run(['--version']);
    assert.match(stdout.trim(), /^\d+\.\d+\.\d+$/);
  });

  it('--help shows all commands', () => {
    const { stdout } = run(['--help']);
    const expected = ['play', 'list', 'select', 'browse', 'search', 'sounds',
      'use', 'preview', 'test-events', 'theme', 'config', 'init',
      'create', 'install', 'uninstall'];
    for (const cmd of expected) {
      assert.ok(stdout.includes(cmd), `--help should mention "${cmd}"`);
    }
  });

  it('unknown command exits 1 with message', () => {
    const { exitCode, stderr } = run(['bogus']);
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes('Unknown command: bogus'));
  });
});

describe('play', () => {
  it('plays random sound without error', () => {
    const { exitCode } = run(['play']);
    assert.equal(exitCode, 0);
  });

  it('plays specific sound by name', () => {
    const { exitCode } = run(['play', 'READY']);
    assert.equal(exitCode, 0);
  });

  it('fails on nonexistent sound', () => {
    const { exitCode, stderr } = run(['play', 'ZZZZNOTREAL']);
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes('not found'));
  });

  it('--event plays each event type', () => {
    for (const event of ['done', 'permission', 'complete', 'error', 'blocked']) {
      const { exitCode } = run(['play', '--event', event]);
      assert.equal(exitCode, 0, `Event "${event}" should work`);
    }
  });

  it('-e shorthand works', () => {
    const { exitCode } = run(['play', '-e', 'done']);
    assert.equal(exitCode, 0);
  });

  it('rejects invalid event', () => {
    const { exitCode, stderr } = run(['play', '--event', 'bogus']);
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes('Unknown event type'));
  });

  it('--help shows event docs', () => {
    const { stdout } = run(['play', '--help']);
    assert.ok(stdout.includes('--event'));
    assert.ok(stdout.includes('done'));
    assert.ok(stdout.includes('informational'));
  });

  it('informational mode without --event shows error', () => {
    const { tmpConfig } = run(['config', 'mode', 'informational']);
    const { exitCode, stderr } = runWith(tmpConfig, ['play']);
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes('Informational mode requires'));
  });

  it('specific mode with specificSound works', () => {
    const { tmpConfig } = run(['config', 'mode', 'specific']);
    runWith(tmpConfig, ['config', 'specificSound', 'READY']);
    const { exitCode } = runWith(tmpConfig, ['play']);
    assert.equal(exitCode, 0);
  });
});

describe('list', () => {
  it('shows all built-in packs', () => {
    const { stdout } = run(['list']);
    assert.ok(stdout.includes('7kaa-soldiers'));
    assert.ok(stdout.includes('retro-8bit'));
    assert.ok(stdout.includes('kenney-interface'));
    assert.ok(stdout.includes('kenney-scifi'));
  });

  it('marks active pack', () => {
    const { stdout } = run(['list']);
    assert.ok(stdout.includes('*'));
  });

  it('--help shows usage', () => {
    const { stdout } = run(['list', '--help']);
    assert.ok(stdout.includes('available'));
  });
});

describe('use', () => {
  it('sets active pack', () => {
    const { stdout } = run(['use', '7kaa-soldiers']);
    assert.ok(stdout.includes('Active pack set to'));
  });

  it('persists across commands', () => {
    const { tmpConfig } = run(['use', 'wesnoth-combat']);
    const { stdout } = runWith(tmpConfig, ['config', 'activePack']);
    assert.ok(stdout.includes('wesnoth-combat'));
  });

  it('rejects unknown pack', () => {
    const { exitCode, stderr } = run(['use', 'fake-pack']);
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes('Pack not found'));
  });

  it('--help shows usage', () => {
    const { stdout } = run(['use', '--help']);
    assert.ok(stdout.includes('pack'));
  });
});

describe('preview', () => {
  it('previews a named pack', () => {
    const { exitCode, stdout } = run(['preview', '7kaa-soldiers']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('Playing:'));
  });

  it('fails without pack name', () => {
    const { exitCode } = run(['preview']);
    assert.equal(exitCode, 1);
  });

  it('fails with unknown pack', () => {
    const { exitCode } = run(['preview', 'nonexistent']);
    assert.equal(exitCode, 1);
  });

  it('--help shows usage', () => {
    const { stdout } = run(['preview', '--help']);
    assert.ok(stdout.includes('preview'));
  });
});

describe('browse', () => {
  it('shows all categories', () => {
    const { exitCode, stdout } = run(['browse']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('military'));
    assert.ok(stdout.includes('arena'));
    assert.ok(stdout.includes('fantasy'));
    assert.ok(stdout.includes('fps'));
    assert.ok(stdout.includes('retro'));
    assert.ok(stdout.includes('sci-fi'));
    assert.ok(stdout.includes('ui'));
  });

  it('shows packs in a specific category', () => {
    const { exitCode, stdout } = run(['browse', 'military']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('7kaa-soldiers'));
    assert.ok(stdout.includes('warzone2100-command'));
    assert.ok(stdout.includes('0ad-civilizations'));
  });

  it('fails on unknown category', () => {
    const { exitCode, stderr } = run(['browse', 'nonexistent-category']);
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes('No packs found'));
  });

  it('--help shows usage', () => {
    const { stdout } = run(['browse', '--help']);
    assert.ok(stdout.includes('category'));
  });
});

describe('search', () => {
  it('finds packs by name', () => {
    const { exitCode, stdout } = run(['search', 'soldiers']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('7kaa-soldiers'));
  });

  it('finds packs by category', () => {
    const { exitCode, stdout } = run(['search', 'military']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('7kaa-soldiers'));
    assert.ok(stdout.includes('warzone2100-command'));
  });

  it('finds sounds by filename', () => {
    const { exitCode, stdout } = run(['search', 'sword']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('wesnoth-combat'));
    assert.ok(stdout.includes('sword-1.wav'));
  });

  it('shows no results message for unknown term', () => {
    const { exitCode, stdout } = run(['search', 'zzzznonexistent']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('No results'));
  });

  it('fails without a search term', () => {
    const { exitCode } = run(['search']);
    assert.equal(exitCode, 1);
  });

  it('--help shows usage', () => {
    const { stdout } = run(['search', '--help']);
    assert.ok(stdout.includes('Search'));
  });
});

describe('sounds', () => {
  it('lists sounds in active pack', () => {
    const { exitCode, stdout } = run(['sounds']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('sounds'));
  });

  it('lists sounds in named pack', () => {
    const { exitCode, stdout } = run(['sounds', 'openarena-announcer']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('excellent.wav'));
    assert.ok(stdout.includes('fight.wav'));
  });

  it('shows event grouping with --events', () => {
    const { exitCode, stdout } = run(['sounds', 'openarena-announcer', '--events']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('done:'));
    assert.ok(stdout.includes('error:'));
    assert.ok(stdout.includes('complete:'));
  });

  it('shows unmapped sounds with --events', () => {
    const { exitCode, stdout } = run(['sounds', 'openarena-announcer', '--events']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('(unmapped)'));
  });

  it('fails on unknown pack', () => {
    const { exitCode, stderr } = run(['sounds', 'nonexistent']);
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes('Pack not found'));
  });

  it('--help shows usage', () => {
    const { stdout } = run(['sounds', '--help']);
    assert.ok(stdout.includes('--events'));
  });
});

describe('theme', () => {
  it('lists themes with no args', () => {
    const { stdout } = run(['theme']);
    const themes = ['retro', 'sci-fi', 'arena', 'fantasy', 'ancient', 'professional', '8bit', 'space', 'chaos'];
    for (const t of themes) {
      assert.ok(stdout.includes(t), `Should list theme "${t}"`);
    }
  });

  it('applies sci-fi theme and sets config', () => {
    const { exitCode, stdout, tmpConfig } = run(['theme', 'sci-fi']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('Theme applied: sci-fi'));
    // Verify config was actually written
    const { stdout: cfgOut } = runWith(tmpConfig, ['config']);
    const cfg = JSON.parse(cfgOut);
    assert.equal(cfg.mode, 'informational');
    assert.equal(cfg.activePack, 'warzone2100-command');
    assert.equal(cfg.eventPacks.done, 'warzone2100-command');
  });

  it('reset clears eventPacks and sets random mode', () => {
    const { tmpConfig } = run(['theme', 'arena']);
    runWith(tmpConfig, ['theme', 'reset']);
    const { stdout } = runWith(tmpConfig, ['config']);
    const cfg = JSON.parse(stdout);
    assert.equal(cfg.mode, 'random');
    assert.deepEqual(cfg.eventPacks, {});
  });

  it('rejects unknown theme', () => {
    const { exitCode, stderr } = run(['theme', 'nonexistent']);
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes('Unknown theme'));
  });

  it('--help shows usage', () => {
    const { stdout } = run(['theme', '--help']);
    assert.ok(stdout.includes('theme'));
  });
});

describe('config', () => {
  it('shows defaults', () => {
    const { stdout } = run(['config']);
    const cfg = JSON.parse(stdout);
    assert.equal(cfg.activePack, '7kaa-soldiers');
    assert.equal(cfg.mode, 'random');
    assert.equal(cfg.volume, 100);
    assert.deepEqual(cfg.eventPacks, {});
  });

  it('reads a single key', () => {
    const { stdout } = run(['config', 'mode']);
    assert.equal(stdout.trim(), 'random');
  });

  it('sets and reads activePack', () => {
    const { tmpConfig } = run(['config', 'activePack', 'wesnoth-combat']);
    const { stdout } = runWith(tmpConfig, ['config', 'activePack']);
    assert.equal(stdout.trim(), 'wesnoth-combat');
  });

  it('sets and reads specificSound', () => {
    const { tmpConfig } = run(['config', 'specificSound', 'READY']);
    const { stdout } = runWith(tmpConfig, ['config', 'specificSound']);
    assert.equal(stdout.trim(), 'READY');
  });

  it('sets mode to informational', () => {
    const { exitCode, stdout } = run(['config', 'mode', 'informational']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('mode set to'));
  });

  it('rejects invalid mode', () => {
    const { exitCode } = run(['config', 'mode', 'bogus']);
    assert.equal(exitCode, 1);
  });

  it('rejects unknown key', () => {
    const { exitCode, stderr } = run(['config', 'unknownKey', 'value']);
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes('Unknown config key'));
  });

  it('sets volume', () => {
    const { exitCode, stdout } = run(['config', 'volume', '50']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('50'));
  });

  it('sets volume to 0', () => {
    const { exitCode } = run(['config', 'volume', '0']);
    assert.equal(exitCode, 0);
  });

  it('rejects non-numeric volume', () => {
    const { exitCode } = run(['config', 'volume', 'abc']);
    assert.equal(exitCode, 1);
  });

  it('rejects volume over 100', () => {
    const { exitCode } = run(['config', 'volume', '150']);
    assert.equal(exitCode, 1);
  });

  it('sets eventPacks per-event', () => {
    const { tmpConfig } = run(['config', 'eventPacks.error', 'freedoom-arsenal']);
    const { stdout } = runWith(tmpConfig, ['config', 'eventPacks.error']);
    assert.equal(stdout.trim(), 'freedoom-arsenal');
  });

  it('resets eventPacks with null', () => {
    const { tmpConfig } = run(['config', 'eventPacks.error', 'freedoom-arsenal']);
    runWith(tmpConfig, ['config', 'eventPacks.error', 'reset']);
    const { stdout } = runWith(tmpConfig, ['config', 'eventPacks.error']);
    assert.ok(stdout.includes('(not set'));
  });

  it('rejects invalid eventPacks event', () => {
    const { exitCode } = run(['config', 'eventPacks.bogus', 'some-pack']);
    assert.equal(exitCode, 1);
  });

  it('shows eventPacks as JSON object', () => {
    const { tmpConfig } = run(['config', 'eventPacks.done', 'retro-8bit']);
    const { stdout } = runWith(tmpConfig, ['config', 'eventPacks']);
    const parsed = JSON.parse(stdout);
    assert.equal(parsed.done, 'retro-8bit');
  });
});

describe('create', () => {
  it('creates a pack from audio files', () => {
    // Set up a temp dir with fake WAV files
    const tmpSrc = mkdtempSync(join(tmpdir(), 'pingthings-create-src-'));
    tmpDirs.push(tmpSrc);
    writeFileSync(join(tmpSrc, 'beep.wav'), 'fake-wav-data');
    writeFileSync(join(tmpSrc, 'boop.wav'), 'fake-wav-data');
    writeFileSync(join(tmpSrc, 'not-audio.txt'), 'ignore me');

    const { exitCode, stdout, tmpConfig } = run(['create', tmpSrc, 'test-pack']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('Creating pack "test-pack"'));
    assert.ok(stdout.includes('beep.wav'));
    assert.ok(stdout.includes('boop.wav'));
    assert.ok(!stdout.includes('not-audio.txt'));

    // Verify manifest was created
    const manifestPath = join(tmpConfig, 'pingthings', 'packs', 'test-pack', 'manifest.json');
    assert.ok(existsSync(manifestPath));
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    assert.equal(manifest.name, 'test-pack');
    assert.equal(manifest.sounds.length, 2);
    assert.ok(manifest.sounds.includes('sounds/beep.wav'));
  });

  it('fails on nonexistent source dir', () => {
    const { exitCode, stderr } = run(['create', '/tmp/nonexistent-dir-xyz']);
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes('Directory not found'));
  });

  it('fails on dir with no audio files', () => {
    const tmpSrc = mkdtempSync(join(tmpdir(), 'pingthings-create-empty-'));
    tmpDirs.push(tmpSrc);
    writeFileSync(join(tmpSrc, 'readme.txt'), 'no audio here');

    const { exitCode, stderr } = run(['create', tmpSrc]);
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes('No audio files'));
  });

  it('fails if pack already exists', () => {
    const tmpSrc = mkdtempSync(join(tmpdir(), 'pingthings-create-dup-'));
    tmpDirs.push(tmpSrc);
    writeFileSync(join(tmpSrc, 'test.wav'), 'fake');

    const { tmpConfig } = run(['create', tmpSrc, 'dup-pack']);
    const { exitCode, stderr } = runWith(tmpConfig, ['create', tmpSrc, 'dup-pack']);
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes('already exists'));
  });

  it('--help shows usage', () => {
    const { stdout } = run(['create', '--help']);
    assert.ok(stdout.includes('source-dir'));
  });
});

describe('install', () => {
  it('installs from local path', () => {
    // Create a local pack to install
    const tmpSrc = mkdtempSync(join(tmpdir(), 'pingthings-install-src-'));
    tmpDirs.push(tmpSrc);
    const packDir = join(tmpSrc, 'my-local-pack');
    mkdirSync(join(packDir, 'sounds'), { recursive: true });
    writeFileSync(join(packDir, 'manifest.json'), JSON.stringify({ name: 'my-local-pack', description: 'test' }));
    writeFileSync(join(packDir, 'sounds', 'beep.wav'), 'fake');

    const { exitCode, stdout } = run(['install', packDir]);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('Installed: my-local-pack'));
  });

  it('fails on nonexistent path', () => {
    const { exitCode, stderr } = run(['install', '/tmp/nonexistent-pack-xyz']);
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes('not found'));
  });

  it('fails on path without manifest', () => {
    const tmpSrc = mkdtempSync(join(tmpdir(), 'pingthings-install-noman-'));
    tmpDirs.push(tmpSrc);

    const { exitCode, stderr } = run(['install', tmpSrc]);
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes('manifest'));
  });

  it('--help shows usage', () => {
    const { stdout } = run(['install', '--help']);
    assert.ok(stdout.includes('GitHub'));
  });
});

describe('uninstall', () => {
  it('uninstalls a user pack', () => {
    // First install a pack, then uninstall it
    const tmpSrc = mkdtempSync(join(tmpdir(), 'pingthings-uninst-'));
    tmpDirs.push(tmpSrc);
    const packDir = join(tmpSrc, 'removable-pack');
    mkdirSync(join(packDir, 'sounds'), { recursive: true });
    writeFileSync(join(packDir, 'manifest.json'), JSON.stringify({ name: 'removable-pack' }));
    writeFileSync(join(packDir, 'sounds', 'x.wav'), 'fake');

    const { tmpConfig } = run(['install', packDir]);
    const { exitCode, stdout } = runWith(tmpConfig, ['uninstall', 'removable-pack']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('Uninstalled'));
  });

  it('resets active pack when uninstalling active', () => {
    const tmpSrc = mkdtempSync(join(tmpdir(), 'pingthings-uninst-active-'));
    tmpDirs.push(tmpSrc);
    const packDir = join(tmpSrc, 'active-rm');
    mkdirSync(join(packDir, 'sounds'), { recursive: true });
    writeFileSync(join(packDir, 'manifest.json'), JSON.stringify({ name: 'active-rm' }));
    writeFileSync(join(packDir, 'sounds', 'x.wav'), 'fake');

    const { tmpConfig } = run(['install', packDir]);
    runWith(tmpConfig, ['use', 'active-rm']);
    const { stdout } = runWith(tmpConfig, ['uninstall', 'active-rm']);
    assert.ok(stdout.includes('Active pack reset'));
  });

  it('fails on nonexistent user pack', () => {
    const { exitCode, stderr } = run(['uninstall', 'fake-pack-xyz']);
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes('Pack not found'));
  });

  it('--help shows usage', () => {
    const { stdout } = run(['uninstall', '--help']);
    assert.ok(stdout.includes('Remove'));
  });
});

describe('test-events', () => {
  it('--help shows usage', () => {
    const { stdout } = run(['test-events', '--help']);
    assert.ok(stdout.includes('event'));
  });

  it('fails on unknown pack', () => {
    const { exitCode, stderr } = run(['test-events', 'nonexistent']);
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes('Pack not found'));
  });
});

describe('init', () => {
  it('--help shows usage', () => {
    const { stdout } = run(['init', '--help']);
    assert.ok(stdout.includes('Claude Code'));
    assert.ok(stdout.includes('--basic'));
    assert.ok(stdout.includes('--informational'));
  });
});
