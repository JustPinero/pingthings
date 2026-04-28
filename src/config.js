import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const DEFAULTS = {
  activePack: '7kaa-soldiers',
  mode: 'random',
  specificSound: null,
  volume: 100,
  eventPacks: {},
  cooldown: true,
  quietHours: null,
  notifications: false,
  // Cross-process debounce window in ms. When multiple `pingthings play`
  // invocations fire within this window (e.g. multi-pane Claude Code
  // sessions ending simultaneously), only the first one plays a sound;
  // subsequent invocations are silently dropped. Set to 0 to disable.
  debounceMs: 1500,
  // Suppress sound playback while a video-call client is active.
  // See src/call-detector.js for cross-platform detection.
  muteOnCall: false,
  // Hour-of-day pack overrides. Format: { "HH-HH": "pack-name" }.
  // First match wins. Wrap-around windows (e.g. "22-7") supported.
  timeProfiles: {},
  // Auto-run loudnorm on freshly-installed packs (when ffmpeg is on
  // PATH). Set to false for manual control. Defaults true: defends
  // against the class of issue that prompted mduel-retro's removal.
  autoNormalize: true,
  // Volume scale applied when active audio output looks like
  // headphones / AirPods / earbuds. 1.0 = no change, 0.7 = 70% of
  // global volume. Detected via src/audio-output.js with a 60s cache.
  headphoneVolumeScale: 1.0,
};

export function getConfigDir() {
  const base = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
  const dir = join(base, 'pingthings');
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function getConfigPath() {
  return join(getConfigDir(), 'config.json');
}

export function isFirstRun() {
  return !existsSync(getConfigPath());
}

export function readConfig() {
  const configPath = getConfigPath();
  if (!existsSync(configPath)) {
    return { ...DEFAULTS };
  }
  try {
    const raw = readFileSync(configPath, 'utf8');
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function writeConfig(config) {
  const configPath = getConfigPath();
  const tmpPath = configPath + '.tmp';
  writeFileSync(tmpPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
  renameSync(tmpPath, configPath);
}

export function getDefaults() {
  return { ...DEFAULTS };
}

export function getLastPlayed() {
  const path = join(getConfigDir(), '.last-played');
  try {
    return readFileSync(path, 'utf8').trim();
  } catch {
    return null;
  }
}

export function setLastPlayed(soundPath) {
  const path = join(getConfigDir(), '.last-played');
  try {
    writeFileSync(path, soundPath, 'utf8');
  } catch {}
}

// Cross-process debounce sentinel — used by `pingthings play` to coalesce
// near-simultaneous invocations (e.g. multi-pane dispatch finishing in
// lockstep) into a single audible play.
export function getLastPlayTimeMs() {
  const path = join(getConfigDir(), '.last-play-time');
  try {
    const raw = readFileSync(path, 'utf8').trim();
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function setLastPlayTimeMs(timeMs) {
  const path = join(getConfigDir(), '.last-play-time');
  try {
    writeFileSync(path, String(timeMs), 'utf8');
  } catch {}
}

export function isQuietHours(config) {
  if (!config.quietHours) return false;
  const [start, end] = config.quietHours.split('-').map(Number);
  if (isNaN(start) || isNaN(end)) return false;
  const hour = new Date().getHours();
  if (start < end) {
    return hour >= start && hour < end;
  }
  // Wraps midnight (e.g., 22-7)
  return hour >= start || hour < end;
}

export const VALID_MODES = ['random', 'specific', 'informational'];

export const VALID_EVENTS = ['done', 'permission', 'complete', 'error', 'blocked'];

// ----------------------------------------------------------------------------
// Manual mute (`pingthings mute <minutes>`). Sentinel file holds the unix-ms
// expiration timestamp; isMuteActive() compares against now.
// ----------------------------------------------------------------------------

export function getMutePath() {
  return join(getConfigDir(), '.muted-until');
}

export function setMuteUntilMs(expiresAtMs) {
  try {
    writeFileSync(getMutePath(), String(expiresAtMs), 'utf8');
  } catch {}
}

export function clearMute() {
  try {
    if (existsSync(getMutePath())) {
      unlinkSync(getMutePath());
    }
  } catch {}
}

export function getMuteUntilMs() {
  try {
    const raw = readFileSync(getMutePath(), 'utf8').trim();
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function isMuteActive(now = Date.now()) {
  return getMuteUntilMs() > now;
}

// ----------------------------------------------------------------------------
// Active-pack resolution. Priority order (highest wins):
//   1. PINGTHINGS_PACK env var (one-shot override)
//   2. Per-project: <cwd>/.claude/settings.json -> pingthings.activePack
//   3. Schedule profile: config.timeProfiles entry matching current hour
//   4. config.activePack (the global default)
// ----------------------------------------------------------------------------

function readProjectPackOverride(cwd) {
  if (!cwd) return null;
  const path = join(cwd, '.claude', 'settings.json');
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, 'utf8');
    const parsed = JSON.parse(raw);
    const pack = parsed?.pingthings?.activePack;
    return typeof pack === 'string' && pack.trim() !== '' ? pack : null;
  } catch {
    return null;
  }
}

export function findScheduleProfile(timeProfiles, hour) {
  if (!timeProfiles || typeof timeProfiles !== 'object') return null;
  for (const [window, pack] of Object.entries(timeProfiles)) {
    if (typeof pack !== 'string' || pack.trim() === '') continue;
    const m = window.match(/^(\d{1,2})-(\d{1,2})$/);
    if (!m) continue;
    const start = Number(m[1]);
    const end = Number(m[2]);
    if (Number.isNaN(start) || Number.isNaN(end)) continue;
    let match;
    if (start < end) {
      match = hour >= start && hour < end;
    } else {
      // Wrap-around (e.g. 22-7)
      match = hour >= start || hour < end;
    }
    if (match) return pack;
  }
  return null;
}

export function resolveActivePack(config, cwd, now = new Date()) {
  // 1. env override
  const env = process.env.PINGTHINGS_PACK;
  if (env && env.trim() !== '') return env.trim();

  // 2. per-project override
  const projectOverride = readProjectPackOverride(cwd);
  if (projectOverride) return projectOverride;

  // 3. schedule profile
  const sched = findScheduleProfile(config.timeProfiles, now.getHours());
  if (sched) return sched;

  // 4. global default
  return config.activePack;
}
