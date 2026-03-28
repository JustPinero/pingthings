import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
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
