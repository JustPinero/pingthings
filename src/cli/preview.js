import { getPackSounds, pickRandom, resolvePack } from '../packs.js';
import { playSound } from '../player.js';
import { basename } from 'node:path';

export default function preview(args) {
  const packName = args[0];

  if (!packName) {
    console.error('Usage: pingthings preview <pack>');
    console.error('Run "pingthings list" to see available packs.');
    process.exit(1);
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

  const sound = pickRandom(sounds);
  console.log(`Playing: ${basename(sound)} from "${packName}"`);
  playSound(sound);
}
