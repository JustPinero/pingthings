import { readConfig, writeConfig } from '../config.js';
import { resolvePack } from '../packs.js';

const THEMES = {
  'retro': {
    description: 'Classic retro gaming — Freedoom weapons and 7kaa soldiers',
    activePack: '7kaa-soldiers',
    eventPacks: {
      done: '7kaa-soldiers',
      permission: '7kaa-soldiers',
      complete: 'freedoom-arsenal',
      error: 'freedoom-arsenal',
      blocked: 'freedoom-arsenal',
    },
  },
  'sci-fi': {
    description: 'Sci-fi command center — Warzone 2100 commander voice',
    activePack: 'warzone2100-command',
    eventPacks: {
      done: 'warzone2100-command',
      permission: 'warzone2100-command',
      complete: 'warzone2100-command',
      error: 'warzone2100-command',
      blocked: 'warzone2100-command',
    },
  },
  'arena': {
    description: 'Arena announcer with FPS weapons for errors',
    activePack: 'openarena-announcer',
    eventPacks: {
      done: 'openarena-announcer',
      permission: 'openarena-announcer',
      complete: 'openarena-announcer',
      error: 'freedoom-arsenal',
      blocked: 'freedoom-arsenal',
    },
  },
  'fantasy': {
    description: 'Medieval fantasy — Wesnoth combat and 0 A.D. civilizations',
    activePack: 'wesnoth-combat',
    eventPacks: {
      done: 'wesnoth-combat',
      permission: '0ad-civilizations',
      complete: 'wesnoth-combat',
      error: 'wesnoth-combat',
      blocked: '0ad-civilizations',
    },
  },
  'ancient': {
    description: 'Ancient world — 7kaa soldiers and 0 A.D. civilizations',
    activePack: '7kaa-soldiers',
    eventPacks: {
      done: '7kaa-soldiers',
      permission: '0ad-civilizations',
      complete: '0ad-civilizations',
      error: '7kaa-soldiers',
      blocked: '0ad-civilizations',
    },
  },
  'chaos': {
    description: 'Random pack for every event — maximum variety',
    activePack: '7kaa-soldiers',
    eventPacks: {
      done: '7kaa-soldiers',
      permission: 'openarena-announcer',
      complete: 'warzone2100-command',
      error: 'freedoom-arsenal',
      blocked: 'wesnoth-combat',
    },
  },
};

function showHelp() {
  console.log(`
Usage: pingthings theme [name]

Apply a sound theme that maps events to packs.

With no arguments, lists available themes.

Available themes:`);

  for (const [name, theme] of Object.entries(THEMES)) {
    console.log(`  ${name.padEnd(12)} ${theme.description}`);
  }

  console.log(`
Examples:
  pingthings theme             List themes
  pingthings theme sci-fi      Apply the sci-fi theme
  pingthings theme reset       Reset to defaults
`);
}

export default function theme(args) {
  const name = args[0];

  if (!name || name === '--help' || name === '-h') {
    showHelp();
    return;
  }

  if (name === 'reset') {
    const config = readConfig();
    config.eventPacks = {};
    config.mode = 'random';
    writeConfig(config);
    console.log('Theme reset. Using default random mode.');
    return;
  }

  const selected = THEMES[name];
  if (!selected) {
    console.error(`Unknown theme: ${name}`);
    console.error(`Available themes: ${Object.keys(THEMES).join(', ')}`);
    process.exit(1);
  }

  const config = readConfig();
  config.activePack = selected.activePack;
  config.mode = 'informational';
  config.eventPacks = { ...selected.eventPacks };
  writeConfig(config);

  console.log(`\nTheme applied: ${name}`);
  console.log(`${selected.description}\n`);
  console.log('Event mapping:');
  for (const [event, pack] of Object.entries(selected.eventPacks)) {
    console.log(`  ${event.padEnd(12)} → ${pack}`);
  }
  console.log(`\nMode set to: informational`);
}
