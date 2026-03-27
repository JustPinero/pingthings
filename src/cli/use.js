import { readConfig, writeConfig } from '../config.js';
import { resolvePack } from '../packs.js';

export default function use(args) {
  const packName = args[0];

  if (!packName) {
    console.error('Usage: pingthings use <pack>');
    console.error('Run "pingthings list" to see available packs.');
    process.exit(1);
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
