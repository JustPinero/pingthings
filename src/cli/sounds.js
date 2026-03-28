import { readConfig } from '../config.js';
import { getPackSounds, resolvePack, getPackEvents, getEventSounds } from '../packs.js';
import { basename } from 'node:path';

function showHelp() {
  console.log(`
Usage: pingthings sounds [pack]

List all individual sounds in a pack.

Arguments:
  pack    Pack to list sounds from (defaults to active pack)

Options:
  --events    Show sounds grouped by event mapping

Examples:
  pingthings sounds                      List sounds in active pack
  pingthings sounds openarena-announcer  List sounds in a specific pack
  pingthings sounds --events             Show event mappings
`);
}

export default function sounds(args) {
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const showEvents = args.includes('--events');
  const packName = args.find(a => !a.startsWith('-')) || readConfig().activePack;

  const pack = resolvePack(packName);
  if (!pack) {
    console.error(`Pack not found: ${packName}`);
    console.error('Run "pingthings list" to see available packs.');
    process.exit(1);
  }

  const allSounds = getPackSounds(packName);

  if (showEvents) {
    const events = getPackEvents(packName);
    console.log(`\n${packName} — sounds by event:\n`);

    for (const event of events) {
      const eventSounds = getEventSounds(packName, event);
      console.log(`  ${event}:`);
      for (const s of eventSounds) {
        console.log(`    ${basename(s)}`);
      }
    }

    // Show unmapped sounds
    const mappedPaths = new Set();
    for (const event of events) {
      for (const s of getEventSounds(packName, event)) {
        mappedPaths.add(s);
      }
    }
    const unmapped = allSounds.filter(s => !mappedPaths.has(s));
    if (unmapped.length > 0) {
      console.log('  (unmapped):');
      for (const s of unmapped) {
        console.log(`    ${basename(s)}`);
      }
    }
  } else {
    console.log(`\n${packName} — ${allSounds.length} sounds:\n`);
    for (const s of allSounds) {
      console.log(`  ${basename(s)}`);
    }
  }

  console.log('');
}
