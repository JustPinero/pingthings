import { readConfig, getFavorites } from '../config.js';
import { listPacks } from '../packs.js';

function showHelp() {
  console.log(`
Usage: pingthings browse [category]

Browse packs by category.

With no arguments, shows all categories with pack counts.
With a category, shows packs in that category.

Gaming: military, arena, fantasy, sci-fi, fps, retro, ui
Serene: bells, water, tones
Office: minimal, digital, classic, mechanical
Nature: animals, ocean, night, weather, forest

Examples:
  pingthings browse              List all categories
  pingthings browse military     Show military packs
  pingthings browse sci-fi       Show sci-fi packs
`);
}

export default function browse(args) {
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const config = readConfig();
  const favorites = new Set(getFavorites(config));
  const packs = listPacks();
  const category = args[0];

  if (!category) {
    // Show all categories with counts
    const categories = {};
    for (const pack of packs) {
      const cat = pack.category || 'other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(pack);
    }

    console.log('\nCategories:\n');
    for (const [cat, catPacks] of Object.entries(categories).sort()) {
      const totalSounds = catPacks.reduce((sum, p) => sum + p.soundCount, 0);
      console.log(`  ${cat.padEnd(14)} ${catPacks.length} pack${catPacks.length === 1 ? '' : 's'}, ${totalSounds} sounds`);
      for (const p of catPacks) {
        const active = p.name === config.activePack ? ' *' : '  ';
        const star = favorites.has(p.name) ? ' ★' : '';
        console.log(`  ${active} └ ${p.name}${star}`);
      }
    }
    console.log('\n  * = active pack    ★ = favorite');
    console.log('  Run "pingthings browse <category>" to see details.\n');
    return;
  }

  // Show packs in a specific category
  const filtered = packs.filter(p => (p.category || 'other') === category);

  if (filtered.length === 0) {
    console.error(`No packs found in category: ${category}`);
    const allCats = [...new Set(packs.map(p => p.category || 'other'))].sort();
    console.error(`Available categories: ${allCats.join(', ')}`);
    process.exit(1);
  }

  console.log(`\n${category} packs:\n`);
  for (const pack of filtered) {
    const active = pack.name === config.activePack ? ' *' : '  ';
    const star = favorites.has(pack.name) ? ' ★' : '';
    console.log(`${active} ${pack.name}${star}  (${pack.soundCount} sounds)`);
    if (pack.description) {
      console.log(`     ${pack.description}`);
    }
    console.log(`     License: ${pack.license}`);
  }
  console.log('\n  * = active pack    ★ = favorite\n');
}
