import { addFavorite, removeFavorite, getFavorites, readConfig } from '../config.js';
import { listPacks } from '../packs.js';

function showHelp() {
  console.log(`
Usage: pingthings fav [add|remove|list] [pack]

Manage your favorite sound packs. Favorites are marked with a star
in \`pingthings list\` and \`pingthings browse\`, and \`pingthings random-pack\`
picks from your favorites when the list is non-empty.

Subcommands:
  list             Show your favorite packs (default).
  add <pack>       Mark a pack as a favorite.
  remove <pack>    Unmark a pack.

Examples:
  pingthings fav                       Show favorites
  pingthings fav add office-classic    Mark office-classic
  pingthings fav remove 7kaa-soldiers  Unmark 7kaa-soldiers
`);
}

function packExists(name) {
  return listPacks().some(p => p.name === name);
}

export default function fav(args) {
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const sub = args[0] ?? 'list';

  if (sub === 'list') {
    const favs = getFavorites(readConfig());
    if (favs.length === 0) {
      console.log('No favorites yet. Add one with: pingthings fav add <pack>');
      return;
    }
    console.log('\nFavorite packs:\n');
    for (const name of favs) {
      const exists = packExists(name);
      const marker = exists ? '  ★' : '  ?';
      const note = exists ? '' : '   (not installed)';
      console.log(`${marker} ${name}${note}`);
    }
    console.log('');
    return;
  }

  if (sub === 'add') {
    const pack = args[1];
    if (!pack) {
      console.error('Usage: pingthings fav add <pack>');
      process.exit(1);
    }
    if (!packExists(pack)) {
      console.error(`Pack not found: ${pack}`);
      console.error('Run "pingthings list" to see available packs.');
      process.exit(1);
    }
    const added = addFavorite(pack);
    console.log(added ? `Added: ${pack}` : `Already a favorite: ${pack}`);
    return;
  }

  if (sub === 'remove') {
    const pack = args[1];
    if (!pack) {
      console.error('Usage: pingthings fav remove <pack>');
      process.exit(1);
    }
    const removed = removeFavorite(pack);
    if (!removed) {
      console.error(`Not a favorite: ${pack}`);
      process.exit(1);
    }
    console.log(`Removed: ${pack}`);
    return;
  }

  console.error(`Unknown subcommand: ${sub}`);
  console.error('Run "pingthings fav --help" for usage.');
  process.exit(1);
}
