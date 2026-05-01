import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = join(__dirname, '..', 'bin', 'pingthings.js');

let tmpRoot;
let originalXdg;

before(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'pingthings-fav-test-'));
  originalXdg = process.env.XDG_CONFIG_HOME;
  process.env.XDG_CONFIG_HOME = tmpRoot;
});

after(() => {
  if (originalXdg === undefined) delete process.env.XDG_CONFIG_HOME;
  else process.env.XDG_CONFIG_HOME = originalXdg;
  rmSync(tmpRoot, { recursive: true, force: true });
});

function cli(args) {
  return spawnSync('node', [CLI, ...args], {
    encoding: 'utf8',
    env: { ...process.env, XDG_CONFIG_HOME: tmpRoot },
  });
}

function readConfigFile() {
  return JSON.parse(readFileSync(join(tmpRoot, 'pingthings', 'config.json'), 'utf8'));
}

describe('pingthings fav', () => {
  it('list is empty by default', () => {
    const r = cli(['fav']);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /No favorites yet/);
  });

  it('add marks a pack as favorite', () => {
    const r = cli(['fav', 'add', 'office-classic']);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /Added: office-classic/);
    assert.deepEqual(readConfigFile().favorites, ['office-classic']);
  });

  it('add is idempotent', () => {
    const r = cli(['fav', 'add', 'office-classic']);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /Already a favorite/);
    assert.deepEqual(readConfigFile().favorites, ['office-classic']);
  });

  it('add rejects unknown pack', () => {
    const r = cli(['fav', 'add', 'not-a-real-pack']);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /Pack not found/);
  });

  it('add without pack name fails', () => {
    const r = cli(['fav', 'add']);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /Usage: pingthings fav add/);
  });

  it('list shows favorites with star', () => {
    cli(['fav', 'add', '7kaa-soldiers']);
    const r = cli(['fav']);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /★/);
    assert.match(r.stdout, /office-classic/);
    assert.match(r.stdout, /7kaa-soldiers/);
  });

  it('pingthings list shows ★ for favorites', () => {
    const r = cli(['list']);
    assert.equal(r.status, 0);
    // office-classic is a favorite from the previous test (shared tmpRoot).
    const officeLine = r.stdout
      .split('\n')
      .find(l => l.includes('office-classic'));
    assert.ok(officeLine, 'expected to find office-classic line');
    assert.match(officeLine, /★/);
  });

  it('pingthings browse shows ★ for favorites', () => {
    const r = cli(['browse']);
    assert.equal(r.status, 0);
    const line = r.stdout
      .split('\n')
      .find(l => l.includes('office-classic'));
    assert.ok(line);
    assert.match(line, /★/);
  });

  it('remove unmarks a pack', () => {
    const r = cli(['fav', 'remove', '7kaa-soldiers']);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /Removed: 7kaa-soldiers/);
    assert.ok(!readConfigFile().favorites.includes('7kaa-soldiers'));
  });

  it('remove of non-favorite fails', () => {
    const r = cli(['fav', 'remove', '7kaa-soldiers']);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /Not a favorite/);
  });

  it('unknown subcommand fails', () => {
    const r = cli(['fav', 'wat']);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /Unknown subcommand/);
  });
});

describe('random-pack honors favorites', () => {
  let favRoot;
  let savedXdg;

  before(() => {
    // Fresh isolated config so the previous suite's favorites don't leak.
    favRoot = mkdtempSync(join(tmpdir(), 'pingthings-fav-rp-'));
    savedXdg = process.env.XDG_CONFIG_HOME;
    process.env.XDG_CONFIG_HOME = favRoot;
  });

  after(() => {
    if (savedXdg === undefined) delete process.env.XDG_CONFIG_HOME;
    else process.env.XDG_CONFIG_HOME = savedXdg;
    rmSync(favRoot, { recursive: true, force: true });
  });

  function rpCli(args) {
    return spawnSync('node', [CLI, ...args], {
      encoding: 'utf8',
      env: { ...process.env, XDG_CONFIG_HOME: favRoot },
    });
  }

  it('picks only from favorites when set', () => {
    // Seed two favorites that are NOT the default activePack
    // (default is 7kaa-soldiers).
    rpCli(['fav', 'add', 'office-classic']);
    rpCli(['fav', 'add', 'office-digital']);

    // Run random-pack several times — every chosen pack must be a favorite.
    // (random-pack avoids the *current* active pack, so with 2 favorites
    // and one of them active, the other is forced. That's still valid:
    // every pick must come from {office-classic, office-digital}.)
    const allowed = new Set(['office-classic', 'office-digital']);
    for (let i = 0; i < 8; i++) {
      const r = rpCli(['random-pack']);
      assert.equal(r.status, 0);
      const config = JSON.parse(
        readFileSync(join(favRoot, 'pingthings', 'config.json'), 'utf8'),
      );
      assert.ok(
        allowed.has(config.activePack),
        `Expected favorite, got: ${config.activePack}`,
      );
    }
  });
});
