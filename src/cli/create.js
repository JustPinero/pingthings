import { existsSync, readdirSync, mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { createInterface } from 'node:readline';
import { getConfigDir } from '../config.js';

const AUDIO_EXTENSIONS = new Set(['.wav', '.mp3', '.ogg', '.flac']);

function showHelp() {
  console.log(`
Usage: pingthings create <source-dir> [pack-name]

Create a new sound pack from a folder of audio files.

Arguments:
  source-dir    Directory containing audio files (.wav, .mp3, .ogg, .flac)
  pack-name     Name for the pack (defaults to directory name)

The pack will be installed to ~/.config/pingthings/packs/<pack-name>/
with an auto-generated manifest.json.

Examples:
  pingthings create ./my-sounds
  pingthings create ./my-sounds custom-pack
`);
}

export default async function create(args) {
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const sourceDir = args[0];
  if (!sourceDir) {
    showHelp();
    process.exit(1);
  }

  if (!existsSync(sourceDir)) {
    console.error(`Directory not found: ${sourceDir}`);
    process.exit(1);
  }

  // Find audio files
  const audioFiles = readdirSync(sourceDir)
    .filter(f => AUDIO_EXTENSIONS.has(extname(f).toLowerCase()))
    .sort();

  if (audioFiles.length === 0) {
    console.error(`No audio files found in ${sourceDir}`);
    console.error('Supported formats: .wav, .mp3, .ogg, .flac');
    process.exit(1);
  }

  const packName = args[1] || basename(sourceDir);
  const packsDir = join(getConfigDir(), 'packs');
  const packDir = join(packsDir, packName);
  const soundsDir = join(packDir, 'sounds');

  if (existsSync(packDir)) {
    console.error(`Pack already exists: ${packDir}`);
    console.error('Delete it first or choose a different name.');
    process.exit(1);
  }

  // Create pack directory structure
  mkdirSync(soundsDir, { recursive: true });

  // Copy audio files
  console.log(`\nCreating pack "${packName}" with ${audioFiles.length} sounds...\n`);

  const soundPaths = [];
  for (const file of audioFiles) {
    const dest = join(soundsDir, file);
    copyFileSync(join(sourceDir, file), dest);
    soundPaths.push(`sounds/${file}`);
    console.log(`  + ${file}`);
  }

  // Generate manifest
  const manifest = {
    name: packName,
    description: '',
    version: '1.0.0',
    license: '',
    credits: '',
    sounds: soundPaths,
    events: {
      done: [],
      permission: [],
      complete: [],
      error: [],
      blocked: [],
    },
  };

  writeFileSync(
    join(packDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf8'
  );

  console.log(`\nPack created at: ${packDir}`);
  console.log(`Manifest: ${join(packDir, 'manifest.json')}`);
  console.log('\nNext steps:');
  console.log('  1. Edit manifest.json to add description, license, and credits');
  console.log('  2. Map sounds to events in the "events" field');
  console.log(`  3. Run: pingthings use ${packName}`);
}
