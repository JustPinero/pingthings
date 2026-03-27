import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const DEFAULTS = {
  activePack: '7kaa-soldiers',
  mode: 'random',
  specificSound: null,
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

export const VALID_MODES = ['random', 'specific', 'informational'];

export const VALID_EVENTS = ['done', 'permission', 'complete', 'error', 'blocked'];
