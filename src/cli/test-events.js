import { readConfig, VALID_EVENTS } from '../config.js';
import { getEventSounds, getPackSounds, pickRandom, resolvePack } from '../packs.js';
import { playSound } from '../player.js';
import { basename } from 'node:path';

function showHelp() {
  console.log(`
Usage: pingthings test-events [pack]

Play one sound for each event type from a pack so you can hear
what each event sounds like. Defaults to the active pack.

Arguments:
  pack    Pack to test (optional, defaults to active pack)

Events played: done, permission, complete, error, blocked
`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function testEvents(args) {
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const config = readConfig();
  const packName = args[0] || config.activePack;
  const pack = resolvePack(packName);

  if (!pack) {
    console.error(`Pack not found: ${packName}`);
    console.error('Run "pingthings list" to see available packs.');
    process.exit(1);
  }

  console.log(`\nTesting events for: ${packName}\n`);

  for (const event of VALID_EVENTS) {
    const sounds = getEventSounds(packName, event);
    if (sounds.length === 0) {
      console.log(`  ${event.padEnd(12)} (no sounds mapped)`);
      continue;
    }

    const sound = pickRandom(sounds);
    console.log(`  ${event.padEnd(12)} ${basename(sound)}`);
    playSound(sound);

    // Wait between sounds so they don't overlap
    await sleep(1500);
  }

  console.log('\nDone.\n');
}
