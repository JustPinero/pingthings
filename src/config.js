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
  notifications: false,
  // Pack names the user has marked as favorites. Surfaced with ★ in
  // `pingthings list` / `browse`, and used as the candidate pool for
  // `pingthings random-pack` when non-empty.
  favorites: [],
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

// ----------------------------------------------------------------------------
// Favorites — pure-data helpers over config.favorites. The CLI layer is
// responsible for validating that pack names actually exist; these helpers
// just keep the array consistent (deduped, no falsy entries).
// ----------------------------------------------------------------------------

export function getFavorites(config = readConfig()) {
  const list = config.favorites;
  return Array.isArray(list) ? list.filter(Boolean) : [];
}

export function isFavorite(packName, config = readConfig()) {
  return getFavorites(config).includes(packName);
}

export function addFavorite(packName) {
  const cfg = readConfig();
  const current = getFavorites(cfg);
  if (current.includes(packName)) return false;
  cfg.favorites = [...current, packName];
  writeConfig(cfg);
  return true;
}

export function removeFavorite(packName) {
  const cfg = readConfig();
  const current = getFavorites(cfg);
  if (!current.includes(packName)) return false;
  cfg.favorites = current.filter(n => n !== packName);
  writeConfig(cfg);
  return true;
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
