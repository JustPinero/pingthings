import { spawn, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { platform } from 'node:os';

function commandExists(cmd) {
  try {
    const checker = platform() === 'win32' ? 'where' : 'which';
    execFileSync(checker, [cmd], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function getPlayerCommand() {
  switch (platform()) {
    case 'darwin':
      return 'afplay';
    case 'linux': {
      if (commandExists('paplay')) return 'paplay';
      if (commandExists('aplay')) return 'aplay';
      return null;
    }
    case 'win32':
      return 'powershell';
    default:
      return null;
  }
}

function buildArgs(cmd, filePath, volume) {
  const vol = Math.max(0, Math.min(100, volume ?? 100));

  switch (cmd) {
    case 'afplay': {
      const afplayVol = (vol / 100).toFixed(2);
      return ['-v', afplayVol, filePath];
    }
    case 'paplay': {
      const paplayVol = Math.round((vol / 100) * 65536).toString();
      return ['--volume', paplayVol, filePath];
    }
    case 'aplay':
      return [filePath];
    case 'powershell': {
      const script = `(New-Object System.Media.SoundPlayer '${filePath.replace(/'/g, "''")}').PlaySync()`;
      return ['-NoProfile', '-Command', script];
    }
    default:
      return [filePath];
  }
}

export function playSound(filePath, volume) {
  if (!existsSync(filePath)) {
    throw new Error(`Sound file not found: ${filePath}`);
  }

  const cmd = getPlayerCommand();
  if (!cmd) {
    // No audio player available — skip silently (e.g. CI environments)
    return;
  }

  const args = buildArgs(cmd, filePath, volume);

  const child = spawn(cmd, args, {
    detached: true,
    stdio: 'ignore',
  });

  // Handle spawn errors gracefully (command not found, permission denied)
  child.on('error', () => {});
  child.unref();
}

export function playSoundSync(filePath, volume) {
  if (!existsSync(filePath)) {
    throw new Error(`Sound file not found: ${filePath}`);
  }

  const cmd = getPlayerCommand();
  if (!cmd) {
    return;
  }

  const args = buildArgs(cmd, filePath, volume);

  try {
    execFileSync(cmd, args, { stdio: ['ignore', 'ignore', 'pipe'], timeout: 5000 });
  } catch (err) {
    if (err.killed) {
      console.error(`Warning: Sound playback timed out for ${filePath}`);
    } else if (err.stderr?.length) {
      console.error(`Warning: Playback error: ${err.stderr.toString().trim()}`);
    }
  }
}
