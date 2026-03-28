import { readConfig } from '../config.js';
import { getPackSounds, pickRandom, resolvePack } from '../packs.js';
import { playSound } from '../player.js';
import { basename } from 'node:path';

function showHelp() {
  console.log(`
Usage: pingthings preview <pack>

Play a random sound from a pack to hear what it sounds like.

Arguments:
  pack    Name of the pack to preview
`);
}

export default function preview(args) {
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

  const sounds = getPackSounds(packName);
  if (sounds.length === 0) {
    console.error(`No sounds found in pack: ${packName}`);
    process.exit(1);
  }

  const config = readConfig();
  const sound = pickRandom(sounds);
  console.log(`Playing: ${basename(sound)} from "${packName}"`);
  playSound(sound, config.volume);
}
