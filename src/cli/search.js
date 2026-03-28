import { readConfig } from '../config.js';
import { listPacks, getPackSounds } from '../packs.js';
import { basename } from 'node:path';

function showHelp() {
  console.log(`
Usage: pingthings search <term>

Search across all packs by name, description, category, or sound filename.

Arguments:
  term    Text to search for (case-insensitive)

Examples:
  pingthings search sword         Find packs/sounds with "sword"
  pingthings search military      Find military category packs
  pingthings search explosion     Find explosion sounds
  pingthings search coin          Find coin/pickup sounds
`);
}

export default function search(args) {
  const term = args[0];

  if (!term || term === '--help' || term === '-h') {
    showHelp();
    if (!term) process.exit(1);
    return;
  }

  const query = term.toLowerCase();
  const config = readConfig();
  const packs = listPacks();
  const results = { packs: [], sounds: [] };

  for (const pack of packs) {
    // Check pack-level matches
    const packMatch =
      pack.name.toLowerCase().includes(query) ||
      pack.description.toLowerCase().includes(query) ||
      (pack.category || '').toLowerCase().includes(query);

    if (packMatch) {
      results.packs.push(pack);
    }

    // Check individual sounds
    const sounds = getPackSounds(pack.name);
    for (const sound of sounds) {
      const name = basename(sound).toLowerCase();
      if (name.includes(query)) {
        results.sounds.push({ pack: pack.name, sound: basename(sound), path: sound });
      }
    }
  }

  if (results.packs.length === 0 && results.sounds.length === 0) {
    console.log(`No results for "${term}".`);
    return;
  }

  if (results.packs.length > 0) {
    console.log(`\nPacks matching "${term}":\n`);
    for (const pack of results.packs) {
      const active = pack.name === config.activePack ? ' *' : '  ';
      console.log(`${active} ${pack.name}  (${pack.category}, ${pack.soundCount} sounds)`);
      if (pack.description) {
        console.log(`     ${pack.description}`);
      }
    }
  }

  if (results.sounds.length > 0) {
    console.log(`\nSounds matching "${term}":\n`);
    for (const s of results.sounds) {
      console.log(`   ${s.pack} / ${s.sound}`);
    }
  }

  console.log('');
}
