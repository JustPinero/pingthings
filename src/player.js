import { spawn, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { platform } from 'node:os';

function getPlayerCommand() {
  switch (platform()) {
    case 'darwin':
      return 'afplay';
    case 'linux': {
      try {
        execFileSync('which', ['paplay'], { stdio: 'pipe' });
        return 'paplay';
      } catch {
        return 'aplay';
      }
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
      // afplay volume: 0.0 to 1.0
      const afplayVol = (vol / 100).toFixed(2);
      return ['-v', afplayVol, filePath];
    }
    case 'paplay': {
      // paplay volume: 0 to 65536 (100% = 65536)
      const paplayVol = Math.round((vol / 100) * 65536).toString();
      return ['--volume', paplayVol, filePath];
    }
    case 'aplay':
      // aplay doesn't support volume natively
      return [filePath];
    case 'powershell': {
      // PowerShell SoundPlayer doesn't support volume, but it plays the file
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
    throw new Error(`Unsupported platform: ${platform()}. Supported: macOS, Linux, Windows.`);
  }

  const args = buildArgs(cmd, filePath, volume);

  const child = spawn(cmd, args, {
    detached: true,
    stdio: 'ignore',
  });

  child.unref();
}

export function playSoundSync(filePath, volume) {
  if (!existsSync(filePath)) {
    throw new Error(`Sound file not found: ${filePath}`);
  }

  const cmd = getPlayerCommand();
  if (!cmd) {
    throw new Error(`Unsupported platform: ${platform()}. Supported: macOS, Linux, Windows.`);
  }

  const args = buildArgs(cmd, filePath, volume);

  try {
    execFileSync(cmd, args, { stdio: 'ignore', timeout: 10000 });
  } catch {
    // Timeout or error — don't crash
  }
}
