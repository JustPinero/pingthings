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

// CESP event → pingthings event mapping
const CESP_EVENT_MAP = {
  'session.start': 'permission',
  'task.acknowledge': 'done',
  'task.complete': 'complete',
  'task.error': 'error',
  'input.required': 'permission',
  'resource.limit': 'blocked',
  'user.spam': 'blocked',
  'session.end': 'complete',
  'task.progress': 'done',
};

function convertCespManifest(cesp) {
  const events = {};
  for (const [cespEvent, sounds] of Object.entries(cesp.categories || {})) {
    const pingEvent = CESP_EVENT_MAP[cespEvent];
    if (!pingEvent) continue;
    const files = (sounds.sounds || []).map(s => s.file);
    if (!events[pingEvent]) events[pingEvent] = [];
    events[pingEvent].push(...files);
  }

  const allSounds = [];
  for (const sounds of Object.values(cesp.categories || {})) {
    for (const s of sounds.sounds || []) {
      if (!allSounds.includes(s.file)) allSounds.push(s.file);
    }
  }

  return {
    name: cesp.name,
    description: cesp.display_name || cesp.description || '',
    version: cesp.version || '1.0.0',
    license: cesp.license || 'Unknown',
    credits: cesp.author?.name || '',
    category: cesp.tags?.[0] || 'other',
    sounds: allSounds,
    events,
    _cesp: true,
  };
}

function readManifest(packDir) {
  // Prefer manifest.json (our native format) — richer metadata
  const manifestPath = join(packDir, 'manifest.json');
  if (existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      if (!manifest.name) {
        console.error(`Warning: manifest.json in ${packDir} is missing "name" field`);
      }
      return manifest;
    } catch (err) {
      console.error(`Warning: Failed to parse ${manifestPath}: ${err.message}`);
    }
  }

  // Fall back to CESP format (openpeon.json) for community packs
  const cespPath = join(packDir, 'openpeon.json');
  if (existsSync(cespPath)) {
    try {
      const cesp = JSON.parse(readFileSync(cespPath, 'utf8'));
      return convertCespManifest(cesp);
    } catch (err) {
      console.error(`Warning: Failed to parse ${cespPath}: ${err.message}`);
    }
  }

  return null;
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
        category: manifest?.category || 'other',
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
