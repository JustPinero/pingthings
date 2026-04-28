import {
  setMuteUntilMs,
  clearMute,
  isMuteActive,
  getMuteUntilMs,
} from '../config.js';

function showHelp() {
  console.log(`
Usage: pingthings mute [duration|off]

Manually suppress all pingthings playback for a fixed duration.

Useful when joining a call you didn't catch with --mute-on-call, when
you need focus, or when you just want quiet without changing your
quietHours config.

Arguments:
  <minutes>   Mute for N minutes. Examples: 30, 60.
  <duration>  Human-friendly form: 30m, 2h, 90s.
  off         Cancel the active mute.
  (no arg)    Show remaining mute time, if any.

Examples:
  pingthings mute 30        Mute for 30 minutes
  pingthings mute 2h        Mute for 2 hours
  pingthings mute off       Cancel mute now
  pingthings mute           Show status

The mute is stored as an expiration timestamp at
  ~/.config/pingthings/.muted-until
and respected by every \`pingthings play\` invocation.
`);
}

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

  const ms = parseDuration(arg);
  if (!Number.isFinite(ms) || ms <= 0) {
    console.error(`Invalid duration: "${arg}". Try: 30, 30m, 2h, 90s, or off.`);
    process.exit(1);
  }

  const expiresAt = Date.now() + ms;
  setMuteUntilMs(expiresAt);
  console.log(`Muted for ${formatRemaining(ms)}. (Until ${new Date(expiresAt).toLocaleTimeString()})`);
}
