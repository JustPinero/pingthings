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
  tmpRoot = mkdtempSync(join(tmpdir(), 'pingthings-doctor-test-'));
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

describe('pingthings doctor — v1.7 surface', () => {
  it('runs to completion without throwing', () => {
    const r = cli(['doctor']);
    assert.equal(r.status, 0);
  });

  it('reports on the v1.6+ feature surface section', () => {
    const r = cli(['doctor']);
    assert.match(r.stdout, /v1\.6\+ feature surfaces/);
  });

  it('reports ffmpeg presence', () => {
    const r = cli(['doctor']);
    assert.match(r.stdout, /ffmpeg available/);
  });

  it('reports audio output detection result', () => {
    const r = cli(['doctor']);
    assert.match(r.stdout, /Audio output detection/);
  });

  it('reports call-detection allowlist', () => {
    const r = cli(['doctor']);
    assert.match(r.stdout, /Call-detection allowlist/);
  });

  it('reports new config knobs (muteOnCall, autoNormalize, headphoneVolumeScale, debounceMs)', () => {
    const r = cli(['doctor']);
    assert.match(r.stdout, /muteOnCall config/);
    assert.match(r.stdout, /autoNormalize config/);
    assert.match(r.stdout, /headphoneVolumeScale/);
    assert.match(r.stdout, /debounceMs/);
  });

  it('reports schedule profiles section', () => {
    const r = cli(['doctor']);
    assert.match(r.stdout, /Schedule profiles/);
  });
});
