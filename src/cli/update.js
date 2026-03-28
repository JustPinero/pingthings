import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function showHelp() {
  console.log(`
Usage: pingthings update

Check for new versions of pingthings on npm.
`);
}

export default function update(args) {
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const pkg = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8'));
  const current = pkg.version;

  console.log(`\nCurrent version: ${current}`);
  console.log('Checking npm for updates...\n');

  try {
    const latest = execFileSync('npm', ['view', 'pingthings', 'version'], {
      encoding: 'utf8',
      timeout: 10000,
    }).trim();

    if (latest === current) {
      console.log('You are on the latest version.');
    } else {
      console.log(`New version available: ${latest}`);
      console.log(`\nRun: npm install -g pingthings@${latest}`);
    }
  } catch {
    console.error('Could not check for updates. Are you online?');
  }
}
