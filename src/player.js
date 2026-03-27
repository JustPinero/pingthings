import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { platform } from 'node:os';

function getPlayerCommand() {
  switch (platform()) {
    case 'darwin':
      return 'afplay';
    case 'linux': {
      // Prefer PulseAudio/PipeWire, fall back to ALSA
      try {
        const result = spawn('which', ['paplay'], { stdio: 'pipe' });
        return 'paplay';
      } catch {
        return 'aplay';
      }
    }
    default:
      return null;
  }
}

export function playSound(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Sound file not found: ${filePath}`);
  }

  const cmd = getPlayerCommand();
  if (!cmd) {
    throw new Error(`Unsupported platform: ${platform()}. Supported: macOS, Linux.`);
  }

  const child = spawn(cmd, [filePath], {
    detached: true,
    stdio: 'ignore',
  });

  child.unref();
}
