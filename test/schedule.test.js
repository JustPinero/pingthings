import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = join(__dirname, '..', 'bin', 'pingthings.js');

let tmpRoot;
let originalXdg;

before(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'pingthings-sched-test-'));
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

function readCfg() {
  return JSON.parse(
    readFileSync(join(tmpRoot, 'pingthings', 'config.json'), 'utf8'),
  );
}

describe('pingthings schedule', () => {
  it('list shows "no profiles" when none are configured', () => {
    const r = cli(['schedule', 'list']);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /No schedule profiles/);
  });

  it('add inserts a window→pack mapping', () => {
    const r = cli(['schedule', 'add', '9-17', 'office-minimal']);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /Added: 9-17/);
    const cfg = readCfg();
    assert.equal(cfg.timeProfiles['9-17'], 'office-minimal');
  });

  it('add accepts wrap-around windows (overnight)', () => {
    const r = cli(['schedule', 'add', '22-7', 'serene-bells']);
    assert.equal(r.status, 0);
    const cfg = readCfg();
    assert.equal(cfg.timeProfiles['22-7'], 'serene-bells');
  });

  it('add rejects malformed windows', () => {
    const r = cli(['schedule', 'add', 'banana', 'office-minimal']);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /Invalid window/);
  });

  it('list shows configured windows', () => {
    const r = cli(['schedule', 'list']);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /9-17/);
    assert.match(r.stdout, /office-minimal/);
    assert.match(r.stdout, /22-7/);
    assert.match(r.stdout, /serene-bells/);
  });

  it('current returns the active pack or "(no schedule active)"', () => {
    const r = cli(['schedule', 'current']);
    assert.equal(r.status, 0);
    // Output is one line — either a pack name or the "no schedule" notice.
    assert.ok(r.stdout.trim().length > 0);
  });

  it('remove drops a window', () => {
    const r = cli(['schedule', 'remove', '9-17']);
    assert.equal(r.status, 0);
    const cfg = readCfg();
    assert.equal(cfg.timeProfiles['9-17'], undefined);
    assert.equal(cfg.timeProfiles['22-7'], 'serene-bells');
  });

  it('remove on missing window errors cleanly', () => {
    const r = cli(['schedule', 'remove', '0-1']);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /No profile/);
  });

  it('clear removes all profiles', () => {
    cli(['schedule', 'add', '8-12', 'office-minimal']);
    const r = cli(['schedule', 'clear']);
    assert.equal(r.status, 0);
    const cfg = readCfg();
    assert.deepEqual(cfg.timeProfiles, {});
  });

  it('rejects unknown subcommand', () => {
    const r = cli(['schedule', 'foo']);
    assert.notEqual(r.status, 0);
  });
});
