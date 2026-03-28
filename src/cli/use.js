import { readConfig, writeConfig } from '../config.js';
import { resolvePack } from '../packs.js';

function showHelp() {
  console.log(`
Usage: pingthings use <pack>

Set the active sound pack.

Arguments:
  pack    Name of the pack to activate

Run "pingthings list" to see available packs.
Run "pingthings select" for an interactive picker.
`);
}

export default function use(args) {
  const packName = args[0];

  if (!packName || packName === '--help' || packName === '-h') {
    showHelp();
    if (!packName) process.exit(1);
    return;
  }

  const pack = resolvePack(packName);
  if (!pack) {
    console.error(`Pack not found: ${packName}`);
    console.error('Run "pingthings list" to see available packs.');
    process.exit(1);
  }

  const config = readConfig();
  config.activePack = packName;
  writeConfig(config);

  console.log(`Active pack set to: ${packName}`);
}
