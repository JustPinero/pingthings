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
  preview: () => import('../src/cli/preview.js'),
  config: () => import('../src/cli/config.js'),
  install: () => import('../src/cli/install.js'),
};

function showHelp() {
  console.log(`
pingthings v${pkg.version} — ${pkg.description}

Usage: pingthings <command> [options]

Commands:
  play [sound]       Play a sound from the active pack (random by default)
  list               Show available sound packs
  use <pack>         Set the active sound pack
  preview <pack>     Preview a random sound from a pack
  config [key] [val] Show or update configuration
  install <pack>     Install a sound pack (coming soon)

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
  pingthings list                  List all available packs
  pingthings use 7kaa-soldiers    Switch to a pack
  pingthings config mode informational   Enable event-based sounds
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
