import { existsSync, mkdirSync, cpSync } from 'node:fs';
import { join, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import { getConfigDir } from '../config.js';

function showHelp() {
  console.log(`
Usage: pingthings install <source>

Install a sound pack from a GitHub repository or local path.

Arguments:
  source    GitHub URL, GitHub shorthand (user/repo), or local path

The pack will be installed to ~/.config/pingthings/packs/

Examples:
  pingthings install user/repo
  pingthings install https://github.com/user/pingthings-pack-name
  pingthings install ./path/to/local/pack
`);
}

function installFromGit(source) {
  const packsDir = join(getConfigDir(), 'packs');
  mkdirSync(packsDir, { recursive: true });

  // Convert shorthand to full URL
  let url = source;
  if (!source.startsWith('http') && !source.startsWith('git@') && source.includes('/')) {
    url = `https://github.com/${source}.git`;
  }

  const repoName = basename(url, '.git');
  const destDir = join(packsDir, repoName);

  if (existsSync(destDir)) {
    console.error(`Pack already exists: ${repoName}`);
    console.error(`Delete ${destDir} first to reinstall.`);
    process.exit(1);
  }

  console.log(`Cloning ${url}...`);

  try {
    execFileSync('git', ['clone', '--depth', '1', url, destDir], {
      stdio: 'inherit',
    });
  } catch {
    console.error('Failed to clone repository. Check the URL and try again.');
    process.exit(1);
  }

  // Check for manifest
  if (!existsSync(join(destDir, 'manifest.json'))) {
    console.log('\nNote: No manifest.json found. The pack may need one to work properly.');
    console.log('Run "pingthings create" to generate a manifest from audio files.');
  }

  console.log(`\nInstalled: ${repoName}`);
  console.log(`Location: ${destDir}`);
  console.log(`\nTo use: pingthings use ${repoName}`);
  return repoName;
}

function installFromLocal(source) {
  if (!existsSync(source)) {
    console.error(`Path not found: ${source}`);
    process.exit(1);
  }

  if (!existsSync(join(source, 'manifest.json'))) {
    console.error('No manifest.json found in the source directory.');
    console.error('Run "pingthings create <dir>" to create a pack from audio files.');
    process.exit(1);
  }

  const packName = basename(source);
  if (!packName) {
    console.error('Could not determine pack name from path.');
    process.exit(1);
  }
  const packsDir = join(getConfigDir(), 'packs');
  const destDir = join(packsDir, packName);

  if (existsSync(destDir)) {
    console.error(`Pack already exists: ${packName}`);
    console.error(`Delete ${destDir} first to reinstall.`);
    process.exit(1);
  }

  mkdirSync(packsDir, { recursive: true });

  try {
    cpSync(source, destDir, { recursive: true });
  } catch {
    console.error('Failed to copy pack.');
    process.exit(1);
  }

  console.log(`Installed: ${packName}`);
  console.log(`Location: ${destDir}`);
  console.log(`\nTo use: pingthings use ${packName}`);
  return packName;
}

/**
 * Run `pingthings normalize` on a freshly-installed pack so its
 * loudness matches the rest of the library. Defends against the
 * class of issue that prompted mduel-retro's removal in v1.5.0
 * (uncalibrated peaks at default volume).
 *
 * No-ops cleanly when:
 *   - --no-normalize flag is passed (caller opt-out)
 *   - autoNormalize: false in config (global opt-out)
 *   - ffmpeg is not on PATH (graceful skip with one-line note)
 */
async function maybeNormalize(packName, args) {
  if (args.includes('--no-normalize')) return;

  let autoNormalize = true;
  try {
    const { readConfig } = await import('../config.js');
    const cfg = readConfig();
    if (cfg.autoNormalize === false) autoNormalize = false;
  } catch {
    // If config can't be read, default to attempting normalization.
  }
  if (!autoNormalize) return;

  // ffmpeg presence check — quiet skip if absent
  try {
    const { execFileSync } = await import('node:child_process');
    execFileSync('ffmpeg', ['-version'], { stdio: 'pipe' });
  } catch {
    console.log('\nSkipping auto-normalize: ffmpeg not on PATH.');
    console.log('  Run `pingthings normalize ' + packName + '` after installing ffmpeg if you want consistent loudness.');
    return;
  }

  console.log('\nAuto-normalizing audio (--no-normalize to skip)…');
  try {
    // Spawn `pingthings normalize` as a child process so a non-zero
    // exit there doesn't take down the install command. This matters
    // for invalid-audio test fixtures and for any pack whose files
    // ffmpeg can't read.
    const { fileURLToPath } = await import('node:url');
    const { dirname, join } = await import('node:path');
    const { spawnSync } = await import('node:child_process');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const cli = join(__dirname, '..', '..', 'bin', 'pingthings.js');
    const r = spawnSync('node', [cli, 'normalize', packName], {
      stdio: 'inherit',
    });
    if (r.status !== 0) {
      console.log(
        `\nNormalize finished with errors. Pack is installed; run \`pingthings normalize ${packName}\` to retry.`,
      );
    }
  } catch (err) {
    console.log(`Auto-normalize encountered an issue: ${err.message}`);
    console.log(`Pack is installed; run \`pingthings normalize ${packName}\` to retry.`);
  }
}

export default async function install(args) {
  const source = args[0];

  if (!source || source === '--help' || source === '-h') {
    showHelp();
    if (!source) process.exit(1);
    return;
  }

  let packName = source;
  // Determine if it's a git URL, shorthand, or local path
  if (source.startsWith('http') || source.startsWith('git@') ||
      (source.includes('/') && !source.startsWith('.') && !source.startsWith('/'))) {
    packName = installFromGit(source) || packName;
  } else {
    packName = installFromLocal(source) || packName;
  }

  await maybeNormalize(packName, args);
}
