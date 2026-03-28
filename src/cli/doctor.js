import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { platform, homedir } from 'node:os';
import { readConfig, getConfigDir } from '../config.js';
import { listPacks } from '../packs.js';

function showHelp() {
  console.log(`
Usage: pingthings doctor

Diagnose audio setup, check player availability, verify packs,
and validate Claude Code hook configuration.
`);
}

function check(label, fn) {
  try {
    const result = fn();
    if (result === true) {
      console.log(`  OK  ${label}`);
    } else if (result === false) {
      console.log(`  !!  ${label}`);
    } else {
      console.log(`  OK  ${label}: ${result}`);
    }
    return result;
  } catch (err) {
    console.log(`  !!  ${label}: ${err.message}`);
    return false;
  }
}

function commandExists(cmd) {
  try {
    execFileSync('which', [cmd], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export default function doctor(args) {
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  console.log('\npingthings doctor\n');

  // Platform
  console.log('Platform:');
  check('Operating system', () => {
    const os = platform();
    const names = { darwin: 'macOS', linux: 'Linux', win32: 'Windows' };
    return names[os] || os;
  });

  // Audio player
  console.log('\nAudio player:');
  let hasPlayer = false;
  if (platform() === 'darwin') {
    hasPlayer = check('afplay available', () => commandExists('afplay'));
  } else if (platform() === 'linux') {
    const pa = check('paplay available (PulseAudio/PipeWire)', () => commandExists('paplay'));
    const al = check('aplay available (ALSA)', () => commandExists('aplay'));
    hasPlayer = pa || al;
  } else if (platform() === 'win32') {
    hasPlayer = check('PowerShell available', () => commandExists('powershell'));
  }
  if (!hasPlayer) {
    console.log('\n  No audio player found! Sounds will not play.');
    if (platform() === 'linux') {
      console.log('  Install: sudo apt install pulseaudio-utils (Ubuntu/Debian)');
      console.log('  Or: sudo apt install alsa-utils');
    }
  }

  // Config
  console.log('\nConfiguration:');
  const config = readConfig();
  check('Config directory', () => getConfigDir());
  check('Active pack', () => config.activePack);
  check('Mode', () => config.mode);
  check('Volume', () => `${config.volume}%`);
  if (config.quietHours) {
    check('Quiet hours', () => config.quietHours);
  }

  // Packs
  console.log('\nPacks:');
  const packs = listPacks();
  check('Built-in packs', () => {
    const builtIn = packs.filter(p => p.isBuiltIn);
    return `${builtIn.length} packs, ${builtIn.reduce((s, p) => s + p.soundCount, 0)} sounds`;
  });
  check('User packs', () => {
    const user = packs.filter(p => !p.isBuiltIn);
    return user.length > 0 ? `${user.length} packs` : 'none';
  });

  // Active pack validation
  const activePack = packs.find(p => p.name === config.activePack);
  if (!activePack) {
    check('Active pack exists', () => { throw new Error(`"${config.activePack}" not found`); });
  } else {
    check('Active pack valid', () => `${activePack.name} (${activePack.soundCount} sounds)`);
  }

  // Claude Code hooks
  console.log('\nClaude Code integration:');
  const settingsPath = join(homedir(), '.claude', 'settings.json');
  if (existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
      const hooks = settings.hooks || {};
      const hasPingthings = JSON.stringify(hooks).includes('pingthings');
      check('settings.json found', () => true);
      check('pingthings hooks configured', () => hasPingthings);
      if (hasPingthings) {
        const hookTypes = Object.keys(hooks).filter(k =>
          JSON.stringify(hooks[k]).includes('pingthings')
        );
        check('Hook events', () => hookTypes.join(', '));
      }
    } catch {
      check('settings.json valid', () => false);
    }
  } else {
    check('settings.json found', () => { throw new Error('Run "pingthings init" to set up'); });
  }

  console.log('');
}
