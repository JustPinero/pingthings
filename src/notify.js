import { spawn } from 'node:child_process';
import { platform } from 'node:os';

export function sendNotification(title, message) {
  const os = platform();

  if (os === 'darwin') {
    spawn('osascript', [
      '-e',
      `display notification "${message}" with title "${title}"`,
    ], { detached: true, stdio: 'ignore' }).unref();
  } else if (os === 'linux') {
    spawn('notify-send', [title, message], {
      detached: true,
      stdio: 'ignore',
    }).on('error', () => {}).unref();
  }
  // Windows: no native CLI notification without dependencies, skip for now
}
