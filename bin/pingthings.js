#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

const command = process.argv[2];
const args = process.argv.slice(3);

const commands = {
  play: () => import('../src/cli/play.js'),
  list: () => import('../src/cli/list.js'),
  use: () => import('../src/cli/use.js'),
  select: () => import('../src/cli/select.js'),
  browse: () => import('../src/cli/browse.js'),
  search: () => import('../src/cli/search.js'),
  sounds: () => import('../src/cli/sounds.js'),
  preview: () => import('../src/cli/preview.js'),
  config: () => import('../src/cli/config.js'),
  install: () => import('../src/cli/install.js'),
  uninstall: () => import('../src/cli/uninstall.js'),
  init: () => import('../src/cli/init.js'),
  setup: () => import('../src/cli/setup.js'),
  demo: () => import('../src/cli/demo.js'),
  stats: () => import('../src/cli/stats.js'),
  create: () => import('../src/cli/create.js'),
  theme: () => import('../src/cli/theme.js'),
  'test-events': () => import('../src/cli/test-events.js'),
  'random-pack': () => import('../src/cli/random-pack.js'),
  doctor: () => import('../src/cli/doctor.js'),
  update: () => import('../src/cli/update.js'),
  cesp: () => import('../src/cli/cesp.js'),
  completions: () => import('../src/cli/completions.js'),
};

function showHelp() {
  console.log(`
pingthings v${pkg.version} — ${pkg.description}

Usage: pingthings <command> [options]

Commands:
  play [sound]       Play a sound from the active pack (random by default)
  list               Show available sound packs
  select             Interactive pack selector
  browse [category]  Browse packs by category
  search <term>      Search packs and sounds
  sounds [pack]      List individual sounds in a pack
  use <pack>         Set the active sound pack
  preview <pack>     Preview a random sound from a pack
  test-events [pack] Play all event sounds to hear what each one sounds like
  theme [name]       Apply a sound theme (maps events across packs)
  config [key] [val] Show or update configuration
  demo               Play one sound from every pack — showroom tour
  stats              Show usage statistics
  init               Set up Claude Code hooks automatically
  setup <ide>        Configure hooks for any IDE (cursor, copilot, codex, etc.)
  random-pack        Switch to a random pack
  create <dir>       Create a new pack from a folder of audio files
  install <source>   Install a pack from GitHub or URL
  uninstall <pack>   Remove a user-installed pack
  doctor             Diagnose audio setup and configuration
  update             Check for new versions
  completions <shell> Generate shell completions (bash/zsh/fish)

Options:
  --help, -h         Show this help message
  --version, -v      Show version number

Modes:
  random             Play any random sound (default)
  specific           Always play the same configured sound
  informational      Play sounds mapped to event types

Examples:
  pingthings play                  Play a random sound
  pingthings play 00083-READY     Play a specific sound
  pingthings play --event done    Play a "task done" sound
  pingthings play -e error        Play an "error" sound
  pingthings select               Choose a pack interactively
  pingthings test-events           Hear all event sounds
  pingthings theme retro           Apply the retro theme
  pingthings init                  Set up Claude Code hooks
  pingthings config volume 50     Set volume to 50%
`);
}

if (!command || command === '--help' || command === '-h') {
  showHelp();
  process.exit(0);
}

if (command === '--version' || command === '-v') {
  console.log(pkg.version);
  process.exit(0);
}

if (!commands[command]) {
  console.error(`Unknown command: ${command}`);
  console.error('Run "pingthings --help" for usage.');
  process.exit(1);
}

// First-run setup — only on interactive TTY, not hooks/scripts/tests
if (process.stdin.isTTY && command !== 'play' && command !== 'completions' && command !== 'doctor') {
  const { isFirstRun } = await import('../src/config.js');
  if (isFirstRun()) {
    const { runFirstTimeSetup } = await import('../src/cli/first-run.js');
    await runFirstTimeSetup();
  }
}

try {
  const mod = await commands[command]();
  await mod.default(args);
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
