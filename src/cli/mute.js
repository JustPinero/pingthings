import {
  setMuteUntilMs,
  clearMute,
  isMuteActive,
  getMuteUntilMs,
} from '../config.js';

function showHelp() {
  console.log(`
Usage: pingthings mute [on|off|duration]

Manually suppress all pingthings playback. The simple on/off path
(\`pingthings mute on\` / \`pingthings mute off\`) is the canonical way to
silence pingthings — there is no scheduled quiet-hours window. It's a
ping, not a ringtone.

Arguments:
  on          Mute indefinitely (until \`pingthings mute off\`).
  off         Cancel the active mute.
  <minutes>   Mute for N minutes. Examples: 30, 60.
  <duration>  Human-friendly form: 30m, 2h, 90s.
  (no arg)    Show remaining mute time, if any.

Examples:
  pingthings mute on        Mute indefinitely
  pingthings mute off       Cancel mute now
  pingthings mute 30        Mute for 30 minutes
  pingthings mute 2h        Mute for 2 hours
  pingthings mute           Show status

The mute is stored as an expiration timestamp at
  ~/.config/pingthings/.muted-until
and respected by every \`pingthings play\` invocation.
`);
}

// "Indefinite" mute — far-future timestamp (~100 years out). Stays well
// within Number.MAX_SAFE_INTEGER and parses as a finite int from the
// sentinel file.
const INDEFINITE_MUTE_MS = 100 * 365 * 24 * 60 * 60 * 1000;

function parseDuration(arg) {
  if (typeof arg !== 'string') return NaN;
  const m = arg.trim().match(/^(\d+(?:\.\d+)?)(s|m|h)?$/i);
  if (!m) return NaN;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n) || n < 0) return NaN;
  const unit = (m[2] || 'm').toLowerCase();
  if (unit === 's') return Math.round(n * 1000);
  if (unit === 'h') return Math.round(n * 60 * 60 * 1000);
  return Math.round(n * 60 * 1000); // default: minutes
}

function formatRemaining(ms) {
  if (ms <= 0) return 'expired';
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function mute(args) {
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  // No args: status
  if (args.length === 0) {
    if (!isMuteActive()) {
      console.log('Not muted.');
      return;
    }
    const remaining = getMuteUntilMs() - Date.now();
    console.log(`Muted for ${formatRemaining(remaining)}.`);
    return;
  }

  const arg = args[0];

  if (arg === 'off' || arg === 'cancel' || arg === 'unmute') {
    clearMute();
    console.log('Mute cancelled.');
    return;
  }

  if (arg === 'on') {
    const expiresAt = Date.now() + INDEFINITE_MUTE_MS;
    setMuteUntilMs(expiresAt);
    console.log('Muted. Run "pingthings mute off" to unmute.');
    return;
  }

  const ms = parseDuration(arg);
  if (!Number.isFinite(ms) || ms <= 0) {
    console.error(`Invalid duration: "${arg}". Try: on, off, 30, 30m, 2h, 90s.`);
    process.exit(1);
  }

  const expiresAt = Date.now() + ms;
  setMuteUntilMs(expiresAt);
  console.log(`Muted for ${formatRemaining(ms)}. (Until ${new Date(expiresAt).toLocaleTimeString()})`);
}
