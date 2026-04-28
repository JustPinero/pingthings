import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = join(__dirname, '..', 'bin', 'pingthings.js');

let tmpRoot;
let originalXdg;

before(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'pingthings-mute-test-'));
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

describe('pingthings mute', () => {
  it('shows "Not muted." when no mute is active', () => {
    cli(['unmute']);
    const r = cli(['mute']);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /Not muted/);
  });

  it('accepts numeric minutes', () => {
    const r = cli(['mute', '15']);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /Muted for/);
    cli(['unmute']);
  });

  it('accepts duration suffix forms (s/m/h)', () => {
    const r1 = cli(['mute', '90s']);
    assert.equal(r1.status, 0);
    cli(['unmute']);

    const r2 = cli(['mute', '2h']);
    assert.equal(r2.status, 0);
    cli(['unmute']);
  });

  it('rejects invalid duration', () => {
    const r = cli(['mute', 'banana']);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /Invalid duration/);
  });

  it('mute off cancels active mute', () => {
    cli(['mute', '10']);
    const off = cli(['mute', 'off']);
    assert.equal(off.status, 0);
    assert.match(off.stdout, /cancelled/i);
  });

  it('unmute alias works (dispatcher prepends "off")', () => {
    cli(['mute', '10']);
    const r = cli(['unmute']);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /cancelled/i);
  });
});
