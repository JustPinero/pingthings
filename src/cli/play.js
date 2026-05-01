import { readConfig, VALID_EVENTS, getLastPlayed, setLastPlayed, isMuteActive, resolveActivePack } from '../config.js';
import { getPackSounds, getEventSounds, pickRandom, resolvePack } from '../packs.js';
import { playSound } from '../player.js';
import { sendNotification } from '../notify.js';
import { recordPlay } from './stats.js';
import { effectiveVolume } from '../manifest-schema.js';
import { isOnCall } from '../call-detector.js';
import { isHeadphonesActive } from '../audio-output.js';
import { basename } from 'node:path';

function parseArgs(args) {
  const result = { sound: null, event: null, notify: false, silent: false };

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--event' || args[i] === '-e') && args[i + 1]) {
      result.event = args[i + 1];
      i++;
    } else if (args[i] === '--notify' || args[i] === '-n') {
      result.notify = true;
    } else if (args[i] === '--silent' || args[i] === '-s') {
      result.silent = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      showHelp();
      process.exit(0);
    } else if (!args[i].startsWith('-')) {
      // Bare event name (e.g. `pingthings play permission`) — accepted as
      // a shorthand for `--event permission`. Lets older hook installs that
      // pre-date the `--event` flag keep working.
      if (!result.event && VALID_EVENTS.includes(args[i])) {
        result.event = args[i];
      } else {
        result.sound = args[i];
      }
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
  // Per-project / scheduled / global pack resolution lives in
  // resolveActivePack so play.js stays focused on playback flow.
  const packName = resolveActivePack(config, process.cwd(), new Date());
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

  if (!soundFile) {
    console.error(`No sounds available in pack: ${packName}`);
    process.exit(1);
  }

  // --silent flag, manual mute (`pingthings mute`), or active call →
  // skip playback. Stats still recorded so usage data isn't skewed by
  // silent intervals.
  if (
    parsed.silent ||
    isMuteActive() ||
    (config.muteOnCall && isOnCall())
  ) {
    recordPlay(packName, parsed.event);
    return;
  }

  // Cooldown: avoid playing the same sound twice in a row
  if (config.cooldown && !parsed.sound) {
    const lastPlayed = getLastPlayed();
    if (soundFile === lastPlayed) {
      const pool = parsed.event
        ? getEventSounds(config.eventPacks?.[parsed.event] || packName, parsed.event)
        : getPackSounds(packName);
      if (pool.length > 1) {
        const alternatives = pool.filter(s => s !== lastPlayed);
        soundFile = pickRandom(alternatives);
      }
    }
  }

  setLastPlayed(soundFile);
  // Apply per-pack volume cap from manifest, plus an output-device
  // scale when headphones are detected and the user has configured
  // a non-1.0 scale.
  const packMaxVolume = pack.manifest?.maxVolume;
  const headphoneScale = Number(config.headphoneVolumeScale ?? 1.0);
  const outputScale =
    headphoneScale !== 1.0 && isHeadphonesActive() ? headphoneScale : 1.0;
  const finalVolume = effectiveVolume(config.volume, packMaxVolume, outputScale);
  playSound(soundFile, finalVolume);
  recordPlay(packName, parsed.event);

  // Desktop notification
  if (parsed.notify || config.notifications) {
    const event = parsed.event || 'notification';
    sendNotification('pingthings', `${event}: ${basename(soundFile)}`);
  }
}
