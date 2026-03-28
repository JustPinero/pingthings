import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { createInterface } from 'node:readline';

const IDES = {
  'claude-code': {
    name: 'Claude Code',
    configPath: () => join(homedir(), '.claude', 'settings.json'),
    generate: (mode) => ({
      hooks: mode === 'informational' ? {
        Notification: [{ matcher: '', hooks: [{ type: 'command', command: 'pingthings play --event permission' }] }],
        Stop: [{ matcher: '', hooks: [{ type: 'command', command: 'pingthings play --event complete' }] }],
        PostToolUseFailure: [{ matcher: '', hooks: [{ type: 'command', command: 'pingthings play --event error' }] }],
        StopFailure: [{ matcher: '', hooks: [{ type: 'command', command: 'pingthings play --event blocked' }] }],
      } : {
        Notification: [{ matcher: '', hooks: [{ type: 'command', command: 'pingthings play' }] }],
      },
    }),
  },
  cursor: {
    name: 'Cursor',
    configPath: () => join(homedir(), '.cursor', 'hooks.json'),
    generate: (mode) => ({
      version: 1,
      hooks: mode === 'informational' ? {
        stop: [{ command: 'pingthings play --event complete' }],
        afterFileEdit: [{ command: 'pingthings play --event done' }],
      } : {
        stop: [{ command: 'pingthings play' }],
      },
    }),
  },
  copilot: {
    name: 'GitHub Copilot',
    configPath: () => join('.github', 'hooks', 'pingthings.json'),
    generate: (mode) => ({
      version: 1,
      hooks: mode === 'informational' ? {
        sessionEnd: [{ type: 'command', bash: 'pingthings play --event complete' }],
        postToolUse: [{ type: 'command', bash: 'pingthings play --event done' }],
        errorOccurred: [{ type: 'command', bash: 'pingthings play --event error' }],
      } : {
        sessionEnd: [{ type: 'command', bash: 'pingthings play' }],
      },
    }),
  },
  codex: {
    name: 'OpenAI Codex',
    configPath: () => join(homedir(), '.codex', 'config.toml'),
    generate: () => null, // TOML, handle separately
    toml: 'notify = ["pingthings", "play", "--event", "complete"]\n',
  },
  windsurf: {
    name: 'Windsurf',
    configPath: () => join('.windsurf', 'hooks.json'),
    generate: (mode) => ({
      hooks: mode === 'informational' ? {
        post_cascade_response: [{ command: 'pingthings play --event complete' }],
        post_write_code: [{ command: 'pingthings play --event done' }],
      } : {
        post_cascade_response: [{ command: 'pingthings play' }],
      },
    }),
  },
  gemini: {
    name: 'Gemini CLI',
    configPath: () => join(homedir(), '.gemini', 'settings.json'),
    generate: (mode) => ({
      hooks: mode === 'informational' ? {
        SessionEnd: [{ matcher: '*', hooks: [{ type: 'command', command: 'pingthings play --event complete' }] }],
        AfterTool: [{ matcher: '*', hooks: [{ type: 'command', command: 'pingthings play --event done' }] }],
        Notification: [{ matcher: 'error', hooks: [{ type: 'command', command: 'pingthings play --event error' }] }],
      } : {
        SessionEnd: [{ matcher: '*', hooks: [{ type: 'command', command: 'pingthings play' }] }],
      },
    }),
  },
};

function showHelp() {
  console.log(`
Usage: pingthings setup <ide>

Configure pingthings hooks for your IDE/coding tool.

Supported IDEs:
  claude-code    Claude Code CLI
  cursor         Cursor AI editor
  copilot        GitHub Copilot CLI
  codex          OpenAI Codex CLI
  windsurf       Windsurf (Cascade)
  gemini         Gemini CLI

Options:
  --basic          Random sounds (no event mapping)
  --informational  Event-based sounds (recommended)

Examples:
  pingthings setup cursor
  pingthings setup copilot --informational
  pingthings setup codex
`);
}

function writeJsonConfig(path, config) {
  const dir = join(path, '..');
  mkdirSync(dir, { recursive: true });

  let existing = {};
  if (existsSync(path)) {
    try {
      existing = JSON.parse(readFileSync(path, 'utf8'));
    } catch {}
  }

  const merged = { ...existing, ...config };
  if (existing.hooks && config.hooks) {
    merged.hooks = { ...existing.hooks, ...config.hooks };
  }

  const tmpPath = path + '.tmp';
  writeFileSync(tmpPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  renameSync(tmpPath, path);
}

export default async function setup(args) {
  const ideName = args[0];

  if (!ideName || ideName === '--help' || ideName === '-h') {
    showHelp();
    if (!ideName) process.exit(1);
    return;
  }

  const ide = IDES[ideName];
  if (!ide) {
    console.error(`Unknown IDE: ${ideName}`);
    console.error(`Supported: ${Object.keys(IDES).join(', ')}`);
    process.exit(1);
  }

  let mode = 'informational';
  if (args.includes('--basic')) mode = 'basic';

  const configPath = ide.configPath();

  console.log(`\nSetting up pingthings for ${ide.name}...\n`);

  if (ideName === 'codex') {
    // Codex uses TOML
    mkdirSync(join(configPath, '..'), { recursive: true });
    if (existsSync(configPath)) {
      const existing = readFileSync(configPath, 'utf8');
      if (existing.includes('pingthings')) {
        console.log('pingthings is already configured in Codex.');
        return;
      }
      writeFileSync(configPath, existing + '\n' + ide.toml, 'utf8');
    } else {
      writeFileSync(configPath, ide.toml, 'utf8');
    }
    console.log(`Written to: ${configPath}`);
    console.log('Codex will run "pingthings play --event complete" on agent-turn-complete.');
  } else {
    const config = ide.generate(mode);
    writeJsonConfig(configPath, config);
    console.log(`Written to: ${configPath}`);
    console.log(`Mode: ${mode}`);
  }

  console.log('\nRestart your IDE for hooks to take effect.');
}
