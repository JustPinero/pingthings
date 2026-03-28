import { spawn } from 'node:child_process';
import { platform } from 'node:os';

function sanitize(str) {
  return str.replace(/[\\"]/g, '').replace(/[^\x20-\x7E]/g, '');
}

export function sendNotification(title, message) {
  const os = platform();
  const safeTitle = sanitize(title);
  const safeMessage = sanitize(message);

  if (os === 'darwin') {
    spawn('osascript', [
      '-e',
      `display notification "${safeMessage}" with title "${safeTitle}"`,
    ], { detached: true, stdio: 'ignore' }).on('error', () => {}).unref();
  } else if (os === 'linux') {
    spawn('notify-send', [safeTitle, safeMessage], {
      detached: true,
      stdio: 'ignore',
    }).on('error', () => {}).unref();
  }
}
