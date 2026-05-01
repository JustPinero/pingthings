import { readConfig, getFavorites } from '../config.js';
import { listPacks } from '../packs.js';

function showHelp() {
  console.log(`
Usage: pingthings list

Show all available sound packs with their sound count and source.
The active pack is marked with *. Favorites are marked with ★.
`);
}

export default function list(args) {
  if (args?.includes('--help') || args?.includes('-h')) {
    showHelp();
    return;
  }

  const config = readConfig();
  const favorites = new Set(getFavorites(config));
  const packs = listPacks();

  if (packs.length === 0) {
    console.log('No sound packs found.');
    return;
  }

  console.log('\nAvailable sound packs:\n');

  for (const pack of packs) {
    const active = pack.name === config.activePack ? ' *' : '  ';
    const star = favorites.has(pack.name) ? ' ★' : '';
    const source = pack.isBuiltIn ? 'built-in' : 'user';
    console.log(`${active} ${pack.name}${star}  (${pack.soundCount} sounds, ${source})`);
    if (pack.description) {
      console.log(`     ${pack.description}`);
    }
  }

  console.log('\n  * = active pack    ★ = favorite\n');
}
