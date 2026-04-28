import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, unlinkSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { resolvePack, getPackSounds } from '../packs.js';

function showHelp() {
  console.log(`
Usage: pingthings normalize <pack> [--target-lufs N] [--peak-db N] [--dry-run]

Normalize the loudness of every sound file in a pack so playback is
consistent across packs. Defends against the class of issues that bit
us with the now-removed mduel-retro pack (uncalibrated peaks blowing
speakers at default volume).

Uses ffmpeg's loudnorm filter. ffmpeg must be on PATH.

Defaults: -23 LUFS integrated, -2 dB true peak.
These are conservative broadcast-style values; --target-lufs -16 is
closer to YouTube/streaming conventions if you want louder output.

Options:
  --target-lufs <N>  Integrated loudness target in LUFS (default -23).
  --peak-db <N>      True-peak ceiling in dBTP (default -2).
  --dry-run          Show what would change without modifying files.
  --help, -h         Show this message.

Examples:
  pingthings normalize office-minimal
  pingthings normalize 7kaa-soldiers --target-lufs -16
  pingthings normalize my-pack --dry-run
`);
}

function ensureFfmpeg() {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'pipe' });
    return true;
  } catch {
    console.error('ffmpeg not found on PATH. Install ffmpeg first:');
    console.error('  macOS:   brew install ffmpeg');
    console.error('  Linux:   sudo apt-get install ffmpeg');
    console.error('  Windows: winget install ffmpeg');
    return false;
  }
}

export default function normalize(args) {
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    showHelp();
    return;
  }

  let packName = null;
  let targetLufs = -23;
  let peakDb = -2;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--target-lufs' && args[i + 1]) {
      targetLufs = parseFloat(args[++i]);
    } else if (a === '--peak-db' && args[i + 1]) {
      peakDb = parseFloat(args[++i]);
    } else if (a === '--dry-run') {
      dryRun = true;
    } else if (!a.startsWith('-') && !packName) {
      packName = a;
    }
  }

  if (!packName) {
    console.error('Pack name required.');
    process.exit(1);
  }
  if (!Number.isFinite(targetLufs) || !Number.isFinite(peakDb)) {
    console.error('--target-lufs and --peak-db must be numbers.');
    process.exit(1);
  }
  if (!ensureFfmpeg()) process.exit(1);

  const pack = resolvePack(packName);
  if (!pack) {
    console.error(`Pack not found: ${packName}`);
    process.exit(1);
  }
  const sounds = getPackSounds(packName);
  if (sounds.length === 0) {
    console.error(`Pack "${packName}" has no sounds to normalize.`);
    process.exit(1);
  }

  console.log(
    `Normalizing ${sounds.length} sound(s) in ${packName} ` +
      `→ I=${targetLufs} LUFS, TP=${peakDb} dBTP${dryRun ? ' (dry run)' : ''}`,
  );

  const filter = `loudnorm=I=${targetLufs}:TP=${peakDb}:LRA=7`;
  let processed = 0;
  let failed = 0;

  for (const file of sounds) {
    const ext = extname(file).toLowerCase();
    const base = basename(file);
    const tmp = file + '.normalized.tmp' + ext;

    if (dryRun) {
      console.log(`  [dry] ${base}`);
      processed++;
      continue;
    }

    const result = spawnSync(
      'ffmpeg',
      ['-y', '-i', file, '-af', filter, '-loglevel', 'error', tmp],
      { stdio: 'pipe' },
    );

    if (result.status === 0 && existsSync(tmp)) {
      renameSync(tmp, file);
      processed++;
      console.log(`  ✓ ${base}`);
    } else {
      failed++;
      try {
        if (existsSync(tmp)) unlinkSync(tmp);
      } catch {}
      const err = result.stderr ? result.stderr.toString().trim() : '(unknown)';
      console.error(`  ✗ ${base} — ${err.split('\n').pop()}`);
    }
  }

  console.log(
    `\nDone. Processed ${processed}/${sounds.length}${failed > 0 ? `, ${failed} failed` : ''}.`,
  );

  if (failed > 0) process.exit(1);
}
