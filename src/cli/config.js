import { readConfig, writeConfig, VALID_MODES, VALID_EVENTS } from '../config.js';

const VALID_KEYS = ['activePack', 'mode', 'specificSound', 'volume', 'eventPacks', 'cooldown', 'quietHours', 'notifications'];

function showHelp() {
  console.log(`
Usage: pingthings config [key] [value]

Show or update configuration.

With no arguments, shows the full config.
With one argument, shows that key's value.
With two arguments, sets the key to the value.

Keys:
  activePack      Which sound pack to use
  mode            random, specific, or informational
  specificSound   Sound name for specific mode
  volume          Playback volume (0-100)
  cooldown        Avoid repeating the same sound (true/false)
  quietHours      Mute during hours, e.g. "22-7" (10pm-7am)
  eventPacks      Per-event pack overrides (use "pingthings config eventPacks.<event> <pack>")

Examples:
  pingthings config                          Show full config
  pingthings config volume 50               Set volume to 50%
  pingthings config cooldown false          Disable cooldown
  pingthings config quietHours 22-7         Mute 10pm to 7am
  pingthings config quietHours null         Disable quiet hours
  pingthings config eventPacks.error openarena-announcer
`);
}

export default function config(args) {
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const [key, ...rest] = args;
  const value = rest.join(' ') || undefined;

  // No args: show full config
  if (!key) {
    const cfg = readConfig();
    console.log(JSON.stringify(cfg, null, 2));
    return;
  }

  // Handle eventPacks.event syntax
  if (key.startsWith('eventPacks.')) {
    const event = key.split('.')[1];
    if (!VALID_EVENTS.includes(event)) {
      console.error(`Unknown event: ${event}`);
      console.error(`Valid events: ${VALID_EVENTS.join(', ')}`);
      process.exit(1);
    }
    if (value === undefined) {
      const cfg = readConfig();
      console.log(cfg.eventPacks?.[event] ?? '(not set — uses active pack)');
      return;
    }
    const cfg = readConfig();
    if (!cfg.eventPacks) cfg.eventPacks = {};
    if (value === 'null' || value === 'reset') {
      delete cfg.eventPacks[event];
    } else {
      cfg.eventPacks[event] = value;
    }
    writeConfig(cfg);
    console.log(`${event} pack set to: ${value === 'null' || value === 'reset' ? '(active pack)' : value}`);
    return;
  }

  // Validate key
  if (!VALID_KEYS.includes(key)) {
    console.error(`Unknown config key: ${key}`);
    console.error(`Valid keys: ${VALID_KEYS.join(', ')}`);
    process.exit(1);
  }

  // One arg: show value
  if (value === undefined) {
    const cfg = readConfig();
    const val = cfg[key];
    if (typeof val === 'object' && val !== null) {
      console.log(JSON.stringify(val, null, 2));
    } else {
      console.log(val ?? '(not set)');
    }
    return;
  }

  // Validate mode values
  if (key === 'mode' && !VALID_MODES.includes(value)) {
    console.error(`Invalid mode: ${value}`);
    console.error(`Valid modes: ${VALID_MODES.join(', ')}`);
    process.exit(1);
  }

  // Validate volume
  if (key === 'volume') {
    const vol = parseInt(value, 10);
    if (isNaN(vol) || vol < 0 || vol > 100) {
      console.error('Volume must be a number between 0 and 100.');
      process.exit(1);
    }
    const cfg = readConfig();
    cfg.volume = vol;
    writeConfig(cfg);
    console.log(`volume set to: ${vol}`);
    return;
  }

  // Validate boolean keys
  if (key === 'notifications' || key === 'cooldown') {
    if (value !== 'true' && value !== 'false') {
      console.error(`${key} must be true or false.`);
      process.exit(1);
    }
    const cfg = readConfig();
    cfg[key] = value === 'true';
    writeConfig(cfg);
    console.log(`${key} set to: ${cfg[key]}`);
    return;
  }

  // Validate quietHours
  if (key === 'quietHours') {
    if (value !== 'null' && !/^\d{1,2}-\d{1,2}$/.test(value)) {
      console.error('Quiet hours must be in format "HH-HH" (e.g., "22-7") or "null" to disable.');
      process.exit(1);
    }
    const cfg = readConfig();
    cfg.quietHours = value === 'null' ? null : value;
    writeConfig(cfg);
    console.log(`quietHours set to: ${cfg.quietHours ?? '(disabled)'}`);
    return;
  }

  // Two args: set value
  const cfg = readConfig();
  cfg[key] = value === 'null' ? null : value;
  writeConfig(cfg);
  console.log(`${key} set to: ${cfg[key]}`);
}
