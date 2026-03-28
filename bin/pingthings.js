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
  preview: () => import('../src/cli/preview.js'),
  config: () => import('../src/cli/config.js'),
  install: () => import('../src/cli/install.js'),
  uninstall: () => import('../src/cli/uninstall.js'),
  init: () => import('../src/cli/init.js'),
  create: () => import('../src/cli/create.js'),
  theme: () => import('../src/cli/theme.js'),
  'test-events': () => import('../src/cli/test-events.js'),
};

function showHelp() {
  console.log(`
pingthings v${pkg.version} — ${pkg.description}

Usage: pingthings <command> [options]

Commands:
  play [sound]       Play a sound from the active pack (random by default)
  list               Show available sound packs
  select             Interactive pack selector
  use <pack>         Set the active sound pack
  preview <pack>     Preview a random sound from a pack
  test-events [pack] Play all event sounds to hear what each one sounds like
  theme [name]       Apply a sound theme (maps events across packs)
  config [key] [val] Show or update configuration
  init               Set up Claude Code hooks automatically
  create <dir>       Create a new pack from a folder of audio files
  install <source>   Install a pack from GitHub or URL
  uninstall <pack>   Remove a user-installed pack

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

try {
  const mod = await commands[command]();
  await mod.default(args);
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
