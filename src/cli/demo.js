import { readConfig } from '../config.js';
import { listPacks, getPackSounds, pickRandom } from '../packs.js';
import { playSoundSync } from '../player.js';
import { basename } from 'node:path';

function showHelp() {
  console.log(`
Usage: pingthings demo

Play one sound from every pack — a showroom tour of all your notification sounds.
`);
}

export default function demo(args) {
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const config = readConfig();
  const packs = listPacks();

  console.log(`\n  PINGTHINGS DEMO — ${packs.length} packs\n`);

  for (const pack of packs) {
    const sounds = getPackSounds(pack.name);
    if (sounds.length === 0) continue;

    const sound = pickRandom(sounds);
    const active = pack.name === config.activePack ? ' *' : '  ';
    console.log(`${active} ${pack.name.padEnd(22)} ${basename(sound)}`);
    playSoundSync(sound, config.volume);
  }

  console.log(`\n  * = active pack\n`);
}
