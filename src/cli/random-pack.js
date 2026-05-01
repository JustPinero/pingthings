import { readConfig, writeConfig, getFavorites } from '../config.js';
import { listPacks, getPackSounds, pickRandom } from '../packs.js';
import { playSound } from '../player.js';
import { basename } from 'node:path';

function showHelp() {
  console.log(`
Usage: pingthings random-pack

Switch to a random pack for variety. Plays a preview sound from the new pack.
If you have favorites set (\`pingthings fav add <pack>\`), the random pick is
drawn from your favorites instead of the full catalog.
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

  // Narrow to favorites when set — the user has told us they like these,
  // so respect that over surprise variety. Fall back to the full catalog
  // if favorites is empty or every favorite is the current active pack.
  const favorites = new Set(getFavorites(config));
  const favoritePacks = favorites.size > 0
    ? packs.filter(p => favorites.has(p.name))
    : [];
  const candidatePool = favoritePacks.length > 0 ? favoritePacks : packs;

  // Pick a different pack than the current one
  let others = candidatePool.filter(p => p.name !== config.activePack);
  // Edge case: only one favorite, and it's already active. Fall back to
  // the full catalog so the user still gets variety.
  if (others.length === 0) {
    others = packs.filter(p => p.name !== config.activePack);
  }
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
