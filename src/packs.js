import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getConfigDir } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUILT_IN_PACKS_DIR = join(__dirname, '..', 'packs');
const AUDIO_EXTENSIONS = new Set(['.wav', '.mp3', '.ogg', '.flac']);

function getUserPacksDir() {
  return join(getConfigDir(), 'packs');
}

function readManifest(packDir) {
  const manifestPath = join(packDir, 'manifest.json');
  if (!existsSync(manifestPath)) return null;
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (!manifest.name) {
      console.error(`Warning: manifest.json in ${packDir} is missing "name" field`);
    }
    return manifest;
  } catch (err) {
    console.error(`Warning: Failed to parse ${manifestPath}: ${err.message}`);
    return null;
  }
}

function discoverSounds(packDir) {
  const soundsDir = join(packDir, 'sounds');
  const searchDir = existsSync(soundsDir) ? soundsDir : packDir;

  try {
    return readdirSync(searchDir)
      .filter(f => AUDIO_EXTENSIONS.has(extname(f).toLowerCase()))
      .map(f => join(searchDir, f))
      .sort();
  } catch {
    return [];
  }
}

function scanDirectory(dir, isBuiltIn) {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      const packDir = join(dir, d.name);
      const manifest = readManifest(packDir);
      const sounds = discoverSounds(packDir);

      return {
        name: manifest?.name || d.name,
        version: manifest?.version || '0.0.0',
        description: manifest?.description || '',
        license: manifest?.license || 'Unknown',
        credits: manifest?.credits || '',
        location: packDir,
        soundCount: sounds.length,
        isBuiltIn,
      };
    })
    .filter(p => p.soundCount > 0);
}

export function listPacks() {
  const builtIn = scanDirectory(BUILT_IN_PACKS_DIR, true);
  const user = scanDirectory(getUserPacksDir(), false);

  // User packs override built-in packs with the same name
  const names = new Set(user.map(p => p.name));
  const merged = [...user, ...builtIn.filter(p => !names.has(p.name))];

  return merged.sort((a, b) => a.name.localeCompare(b.name));
}

export function resolvePack(name) {
  // Check user packs first (override built-in)
  const userDir = join(getUserPacksDir(), name);
  if (existsSync(userDir)) {
    const manifest = readManifest(userDir);
    return { name, dir: userDir, manifest };
  }

  // Check built-in packs
  const builtInDir = join(BUILT_IN_PACKS_DIR, name);
  if (existsSync(builtInDir)) {
    const manifest = readManifest(builtInDir);
    return { name, dir: builtInDir, manifest };
  }

  return null;
}

export function getPackSounds(name) {
  const pack = resolvePack(name);
  if (!pack) return [];

  // Use manifest sounds list if available
  if (pack.manifest?.sounds?.length) {
    return pack.manifest.sounds
      .map(s => join(pack.dir, s))
      .filter(f => existsSync(f));
  }

  return discoverSounds(pack.dir);
}

export function getEventSounds(name, event) {
  const pack = resolvePack(name);
  if (!pack) return [];

  const eventSounds = pack.manifest?.events?.[event];
  if (!eventSounds?.length) return [];

  return eventSounds
    .map(s => join(pack.dir, s))
    .filter(f => existsSync(f));
}

export function getPackEvents(name) {
  const pack = resolvePack(name);
  if (!pack) return [];

  const events = pack.manifest?.events;
  if (!events) return [];

  return Object.keys(events);
}

export function pickRandom(sounds) {
  if (sounds.length === 0) return null;
  return sounds[Math.floor(Math.random() * sounds.length)];
}
