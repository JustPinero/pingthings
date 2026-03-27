import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = join(__dirname, '..', 'bin', 'pingthings.js');

function run(args, opts = {}) {
  const tmpConfig = mkdtempSync(join(tmpdir(), 'pingthings-cli-'));
  const env = { ...process.env, XDG_CONFIG_HOME: tmpConfig, ...opts.env };
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

describe('CLI', () => {
  it('--version prints version', () => {
    const { stdout } = run(['--version']);
    assert.match(stdout.trim(), /^\d+\.\d+\.\d+$/);
  });

  it('--help shows usage', () => {
    const { stdout } = run(['--help']);
    assert.ok(stdout.includes('Usage:'));
    assert.ok(stdout.includes('play'));
    assert.ok(stdout.includes('list'));
  });

  it('unknown command exits with error', () => {
    const { exitCode, stderr } = run(['bogus']);
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes('Unknown command'));
  });

  it('list shows 7kaa-soldiers', () => {
    const { stdout } = run(['list']);
    assert.ok(stdout.includes('7kaa-soldiers'));
    assert.ok(stdout.includes('sounds'));
  });

  it('play runs without error', () => {
    const { exitCode } = run(['play']);
    assert.equal(exitCode, 0);
  });

  it('play with specific sound works', () => {
    const { exitCode } = run(['play', 'READY']);
    assert.equal(exitCode, 0);
  });

  it('play with nonexistent sound fails', () => {
    const { exitCode } = run(['play', 'ZZZZNOTREAL']);
    assert.equal(exitCode, 1);
  });

  it('use sets active pack', () => {
    const { stdout } = run(['use', '7kaa-soldiers']);
    assert.ok(stdout.includes('Active pack set to'));
  });

  it('use with unknown pack fails', () => {
    const { exitCode } = run(['use', 'fake-pack']);
    assert.equal(exitCode, 1);
  });

  it('config shows defaults', () => {
    const { stdout } = run(['config']);
    const cfg = JSON.parse(stdout);
    assert.equal(cfg.activePack, '7kaa-soldiers');
    assert.equal(cfg.mode, 'random');
  });

  it('config sets a value', () => {
    // This runs in isolated tmp config so we just verify it doesn't crash
    const { exitCode, stdout } = run(['config', 'mode', 'specific']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('mode set to'));
  });

  it('config rejects invalid mode', () => {
    const { exitCode } = run(['config', 'mode', 'bogus']);
    assert.equal(exitCode, 1);
  });

  it('install shows future message', () => {
    const { stdout } = run(['install', 'something']);
    assert.ok(stdout.includes('coming in a future version'));
  });

  it('preview with no pack shows usage', () => {
    const { exitCode } = run(['preview']);
    assert.equal(exitCode, 1);
  });

  it('play --event done works', () => {
    const { exitCode } = run(['play', '--event', 'done']);
    assert.equal(exitCode, 0);
  });

  it('play -e error works', () => {
    const { exitCode } = run(['play', '-e', 'error']);
    assert.equal(exitCode, 0);
  });

  it('play --event with all event types works', () => {
    const events = ['done', 'permission', 'complete', 'error', 'blocked'];
    for (const event of events) {
      const { exitCode } = run(['play', '--event', event]);
      assert.equal(exitCode, 0, `Event "${event}" should play without error`);
    }
  });

  it('play --event with invalid event fails', () => {
    const { exitCode, stderr } = run(['play', '--event', 'bogus']);
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes('Unknown event type'));
  });

  it('play --help shows event documentation', () => {
    const { stdout } = run(['play', '--help']);
    assert.ok(stdout.includes('--event'));
    assert.ok(stdout.includes('done'));
    assert.ok(stdout.includes('informational'));
  });

  it('config accepts informational mode', () => {
    const { exitCode, stdout } = run(['config', 'mode', 'informational']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('mode set to'));
  });

  it('--help shows modes section', () => {
    const { stdout } = run(['--help']);
    assert.ok(stdout.includes('informational'));
    assert.ok(stdout.includes('--event'));
  });
});
