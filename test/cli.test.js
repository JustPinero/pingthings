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

  it('install with nonexistent local path fails', () => {
    const { exitCode } = run(['install', '/tmp/nonexistent-pack-abc123']);
    assert.equal(exitCode, 1);
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

  // New feature tests

  it('--help shows new commands', () => {
    const { stdout } = run(['--help']);
    assert.ok(stdout.includes('select'));
    assert.ok(stdout.includes('test-events'));
    assert.ok(stdout.includes('theme'));
    assert.ok(stdout.includes('init'));
    assert.ok(stdout.includes('create'));
  });

  it('theme with no args shows available themes', () => {
    const { stdout } = run(['theme']);
    assert.ok(stdout.includes('retro'));
    assert.ok(stdout.includes('sci-fi'));
    assert.ok(stdout.includes('arena'));
    assert.ok(stdout.includes('fantasy'));
  });

  it('theme sci-fi applies correctly', () => {
    const { exitCode, stdout } = run(['theme', 'sci-fi']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('Theme applied: sci-fi'));
    assert.ok(stdout.includes('warzone2100-command'));
  });

  it('theme reset works', () => {
    const { exitCode, stdout } = run(['theme', 'reset']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('reset'));
  });

  it('theme with invalid name fails', () => {
    const { exitCode } = run(['theme', 'nonexistent']);
    assert.equal(exitCode, 1);
  });

  it('config volume sets and reads', () => {
    const { exitCode, stdout } = run(['config', 'volume', '50']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('50'));
  });

  it('config volume rejects invalid values', () => {
    const { exitCode } = run(['config', 'volume', 'abc']);
    assert.equal(exitCode, 1);
  });

  it('config volume rejects out of range', () => {
    const { exitCode } = run(['config', 'volume', '150']);
    assert.equal(exitCode, 1);
  });

  it('config eventPacks.error sets per-event pack', () => {
    const { exitCode, stdout } = run(['config', 'eventPacks.error', 'freedoom-arsenal']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('error'));
  });

  it('config eventPacks.bogus rejects invalid event', () => {
    const { exitCode } = run(['config', 'eventPacks.bogus', 'some-pack']);
    assert.equal(exitCode, 1);
  });

  it('init --help shows usage', () => {
    const { stdout } = run(['init', '--help']);
    assert.ok(stdout.includes('Claude Code'));
    assert.ok(stdout.includes('--basic'));
    assert.ok(stdout.includes('--informational'));
  });

  it('create --help shows usage', () => {
    const { stdout } = run(['create', '--help']);
    assert.ok(stdout.includes('source-dir'));
    assert.ok(stdout.includes('manifest'));
  });

  it('install --help shows usage', () => {
    const { stdout } = run(['install', '--help']);
    assert.ok(stdout.includes('GitHub'));
    assert.ok(stdout.includes('source'));
  });

  it('list --help shows usage', () => {
    const { stdout } = run(['list', '--help']);
    assert.ok(stdout.includes('available'));
  });

  it('use --help shows usage', () => {
    const { stdout } = run(['use', '--help']);
    assert.ok(stdout.includes('pack'));
  });

  it('preview --help shows usage', () => {
    const { stdout } = run(['preview', '--help']);
    assert.ok(stdout.includes('preview'));
  });

  it('test-events --help shows usage', () => {
    const { stdout } = run(['test-events', '--help']);
    assert.ok(stdout.includes('event'));
  });

  it('uninstall --help shows usage', () => {
    const { stdout } = run(['uninstall', '--help']);
    assert.ok(stdout.includes('Remove'));
  });

  it('uninstall nonexistent pack fails', () => {
    const { exitCode } = run(['uninstall', 'fake-pack-xyz']);
    assert.equal(exitCode, 1);
  });

  it('--help shows uninstall command', () => {
    const { stdout } = run(['--help']);
    assert.ok(stdout.includes('uninstall'));
  });
});
