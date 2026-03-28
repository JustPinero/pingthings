import { createInterface } from 'node:readline';
import { existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

function showHelp() {
  console.log(`
Usage: pingthings init

Interactive setup wizard that configures Claude Code hooks
in ~/.claude/settings.json automatically.

Options:
  --basic          Set up basic random sounds (no prompts)
  --informational  Set up event-based sounds (no prompts)
  --help, -h       Show this help message
`);
}

const BASIC_HOOKS = {
  Notification: [{
    matcher: '',
    hooks: [{ type: 'command', command: 'pingthings play' }],
  }],
};

const INFORMATIONAL_HOOKS = {
  Notification: [{
    matcher: '',
    hooks: [{ type: 'command', command: 'pingthings play --event permission' }],
  }],
  Stop: [{
    matcher: '',
    hooks: [{ type: 'command', command: 'pingthings play --event complete' }],
  }],
  PostToolUseFailure: [{
    matcher: '',
    hooks: [{ type: 'command', command: 'pingthings play --event error' }],
  }],
  StopFailure: [{
    matcher: '',
    hooks: [{ type: 'command', command: 'pingthings play --event blocked' }],
  }],
};

function getSettingsPath() {
  return join(homedir(), '.claude', 'settings.json');
}

function readSettings() {
  const path = getSettingsPath();
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return {};
  }
}

function writeSettings(settings) {
  const path = getSettingsPath();
  const tmpPath = path + '.tmp';
  writeFileSync(tmpPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
  renameSync(tmpPath, path);
}

function applyHooks(mode) {
  const settings = readSettings();
  const hooks = mode === 'informational' ? INFORMATIONAL_HOOKS : BASIC_HOOKS;
  settings.hooks = { ...settings.hooks, ...hooks };
  writeSettings(settings);

  console.log(`\nClaude Code hooks configured (${mode} mode).`);
  console.log(`Settings written to: ${getSettingsPath()}`);

  if (mode === 'informational') {
    console.log('\nHook mapping:');
    console.log('  Notification     → permission sound');
    console.log('  Stop             → complete sound');
    console.log('  PostToolUseFailure → error sound');
    console.log('  StopFailure      → blocked sound');
  } else {
    console.log('\nA random sound will play on every Claude Code notification.');
  }

  console.log('\nRestart Claude Code for hooks to take effect.');
}

export default async function init(args) {
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  if (args.includes('--basic')) {
    applyHooks('basic');
    return;
  }

  if (args.includes('--informational')) {
    applyHooks('informational');
    return;
  }

  console.log('\npingthings — Claude Code hook setup\n');
  console.log('How would you like sounds to work?\n');
  console.log('  1. Basic — random sound on every notification');
  console.log('  2. Informational — different sounds for different events');
  console.log('     (done, permission, error, blocked)\n');

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  await new Promise((resolve) => {
    rl.question('Choose (1 or 2): ', (answer) => {
      const choice = answer.trim();
      if (choice === '2') {
        applyHooks('informational');
      } else {
        applyHooks('basic');
      }
      rl.close();
      resolve();
    });
  });
}
