import { readConfig } from '../config.js';
import { getPackSounds, pickRandom, resolvePack } from '../packs.js';
import { playSound } from '../player.js';
import { basename } from 'node:path';

export default function play(args) {
  const config = readConfig();
  const packName = config.activePack;
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

  let soundFile;

  if (args[0]) {
    // Play a specific sound by name (partial match)
    const query = args[0].toLowerCase();
    soundFile = sounds.find(s => basename(s).toLowerCase().includes(query));
    if (!soundFile) {
      console.error(`Sound "${args[0]}" not found in pack "${packName}".`);
      process.exit(1);
    }
  } else if (config.mode === 'specific' && config.specificSound) {
    const query = config.specificSound.toLowerCase();
    soundFile = sounds.find(s => basename(s).toLowerCase().includes(query));
    if (!soundFile) {
      soundFile = pickRandom(sounds);
    }
  } else {
    soundFile = pickRandom(sounds);
  }

  playSound(soundFile);
}
