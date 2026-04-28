import { readConfig, writeConfig, findScheduleProfile } from '../config.js';

function showHelp() {
  console.log(`
Usage: pingthings schedule [<subcommand>] [...args]

Manage hour-of-day pack rotations (timeProfiles). Configured profiles
are consulted by \`pingthings play\` AFTER the env var and per-project
overrides; before the global default. Wrap-around windows (e.g.
"22-7") are supported.

Subcommands:
  list                          Show current profiles + which window
                                applies right now (if any).
  add <window> <pack>           Add or replace a profile.
                                Window format: "HH-HH" (24-hour).
                                Examples: "9-17", "22-7"
  remove <window>               Remove a single profile.
  clear                         Remove ALL profiles (back to global only).
  current                       Print the active pack right now (or
                                "(no schedule active)" when none match).

Examples:
  pingthings schedule list
  pingthings schedule add 9-17 office-minimal
  pingthings schedule add 22-7 serene-bells
  pingthings schedule remove 9-17
  pingthings schedule current
`);
}

function isValidWindow(window) {
  const m = /^(\d{1,2})-(\d{1,2})$/.exec(window);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  return a >= 0 && a < 24 && b >= 0 && b < 24 && a !== b;
}

export default function schedule(args) {
  const sub = args[0];

  if (!sub || sub === '--help' || sub === '-h' || sub === 'help') {
    showHelp();
    return;
  }

  const cfg = readConfig();
  const profiles = cfg.timeProfiles || {};

  if (sub === 'list') {
    const keys = Object.keys(profiles);
    if (keys.length === 0) {
      console.log('No schedule profiles set. (Active pack falls through to global default.)');
      return;
    }
    const hour = new Date().getHours();
    const active = findScheduleProfile(profiles, hour);
    console.log('Schedule profiles:');
    for (const w of keys) {
      const star = profiles[w] === active && active !== null ? ' ← active right now' : '';
      console.log(`  ${w.padEnd(8)} → ${profiles[w]}${star}`);
    }
    return;
  }

  if (sub === 'current') {
    const hour = new Date().getHours();
    const active = findScheduleProfile(profiles, hour);
    if (active) {
      console.log(active);
    } else {
      console.log('(no schedule active — using global default)');
    }
    return;
  }

  if (sub === 'add') {
    const window = args[1];
    const pack = args[2];
    if (!window || !pack) {
      console.error('Usage: pingthings schedule add <window> <pack>');
      process.exit(1);
    }
    if (!isValidWindow(window)) {
      console.error(
        `Invalid window: "${window}". Use "HH-HH" (24-hour, distinct hours).`,
      );
      process.exit(1);
    }
    cfg.timeProfiles = { ...profiles, [window]: pack };
    writeConfig(cfg);
    console.log(`Added: ${window} → ${pack}`);
    return;
  }

  if (sub === 'remove' || sub === 'rm') {
    const window = args[1];
    if (!window) {
      console.error('Usage: pingthings schedule remove <window>');
      process.exit(1);
    }
    if (!(window in profiles)) {
      console.error(`No profile for window "${window}".`);
      process.exit(1);
    }
    const next = { ...profiles };
    delete next[window];
    cfg.timeProfiles = next;
    writeConfig(cfg);
    console.log(`Removed: ${window}`);
    return;
  }

  if (sub === 'clear') {
    cfg.timeProfiles = {};
    writeConfig(cfg);
    console.log('Cleared all schedule profiles.');
    return;
  }

  console.error(`Unknown subcommand: ${sub}`);
  showHelp();
  process.exit(1);
}
