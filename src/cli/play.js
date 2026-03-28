import { readConfig, VALID_EVENTS } from '../config.js';
import { getPackSounds, getEventSounds, pickRandom, resolvePack } from '../packs.js';
import { playSound } from '../player.js';
import { basename } from 'node:path';

function parseArgs(args) {
  const result = { sound: null, event: null };

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--event' || args[i] === '-e') && args[i + 1]) {
      result.event = args[i + 1];
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      showHelp();
      process.exit(0);
    } else if (!args[i].startsWith('-')) {
      result.sound = args[i];
    }
  }

  return result;
}

function showHelp() {
  console.log(`
Usage: pingthings play [sound] [options]

Play a sound from the active pack.

Arguments:
  sound              Play a specific sound by name (partial match)

Options:
  --event, -e <type> Play a sound mapped to an event type
  --help, -h         Show this help message

Event types:
  done               Task/step finished, awaiting next instruction
  permission         Needs user approval to continue
  complete           Whole project or major milestone finished
  error              Something went wrong
  blocked            Can't proceed, user action needed

Modes (set via "pingthings config mode <mode>"):
  random             Play any random sound from the pack (default)
  specific           Always play the same configured sound
  informational      Use event mappings — requires --event flag

Examples:
  pingthings play                     Random sound
  pingthings play READY               Play sound matching "READY"
  pingthings play --event done        Play a "done" sound
  pingthings play -e error            Play an "error" sound
`);
}

export default function play(args) {
  const config = readConfig();
  const packName = config.activePack;
  const pack = resolvePack(packName);

  if (!pack) {
    console.error(`Pack not found: ${packName}`);
    console.error('Run "pingthings list" to see available packs.');
    process.exit(1);
  }

  const parsed = parseArgs(args);

  // Validate event if provided
  if (parsed.event && !VALID_EVENTS.includes(parsed.event)) {
    console.error(`Unknown event type: ${parsed.event}`);
    console.error(`Valid events: ${VALID_EVENTS.join(', ')}`);
    process.exit(1);
  }

  let soundFile;

  // If --event flag is provided, use event mapping
  if (parsed.event) {
    // Pack mixing: check if there's a per-event pack override
    const eventPackName = config.eventPacks?.[parsed.event] || packName;
    const eventPack = resolvePack(eventPackName);
    const resolvedPack = eventPack ? eventPackName : packName;

    const eventSounds = getEventSounds(resolvedPack, parsed.event);
    if (eventSounds.length === 0) {
      // Fall back to random if pack has no mapping for this event
      const allSounds = getPackSounds(resolvedPack);
      soundFile = pickRandom(allSounds);
    } else {
      soundFile = pickRandom(eventSounds);
    }
  }
  // If a specific sound name is provided, find it
  else if (parsed.sound) {
    const sounds = getPackSounds(packName);
    const query = parsed.sound.toLowerCase();
    soundFile = sounds.find(s => basename(s).toLowerCase().includes(query));
    if (!soundFile) {
      console.error(`Sound "${parsed.sound}" not found in pack "${packName}".`);
      process.exit(1);
    }
  }
  // Informational mode: requires --event (show help if missing)
  else if (config.mode === 'informational') {
    console.error('Informational mode requires an event type.');
    console.error('Usage: pingthings play --event <done|permission|complete|error|blocked>');
    console.error('Or switch mode: pingthings config mode random');
    process.exit(1);
  }
  // Specific mode: always play the configured sound
  else if (config.mode === 'specific' && config.specificSound) {
    const sounds = getPackSounds(packName);
    const query = config.specificSound.toLowerCase();
    soundFile = sounds.find(s => basename(s).toLowerCase().includes(query));
    if (!soundFile) {
      soundFile = pickRandom(sounds);
    }
  }
  // Random mode (default)
  else {
    const sounds = getPackSounds(packName);
    if (sounds.length === 0) {
      console.error(`No sounds found in pack: ${packName}`);
      process.exit(1);
    }
    soundFile = pickRandom(sounds);
  }

  playSound(soundFile, config.volume);
}
