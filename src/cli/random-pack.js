import { readConfig, writeConfig } from '../config.js';
import { listPacks, getPackSounds, pickRandom } from '../packs.js';
import { playSound } from '../player.js';
import { basename } from 'node:path';

function showHelp() {
  console.log(`
Usage: pingthings random-pack

Switch to a random pack for variety. Plays a preview sound from the new pack.
`);
}

export default function randomPack(args) {
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const config = readConfig();
  const packs = listPacks();

  if (packs.length <= 1) {
    console.log('Only one pack available.');
    return;
  }

  // Pick a different pack than the current one
  const others = packs.filter(p => p.name !== config.activePack);
  const chosen = others[Math.floor(Math.random() * others.length)];

  config.activePack = chosen.name;
  writeConfig(config);

  const sounds = getPackSounds(chosen.name);
  if (sounds.length > 0) {
    const sample = pickRandom(sounds);
    console.log(`Switched to: ${chosen.name} (${chosen.category})`);
    console.log(`Preview: ${basename(sample)}`);
    playSound(sample, config.volume);
  } else {
    console.log(`Switched to: ${chosen.name}`);
  }
}
