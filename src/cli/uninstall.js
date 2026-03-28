import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { getConfigDir, readConfig, writeConfig } from '../config.js';

function showHelp() {
  console.log(`
Usage: pingthings uninstall <pack>

Remove a user-installed sound pack.

Built-in packs cannot be uninstalled. Only packs in
~/.config/pingthings/packs/ can be removed.

Arguments:
  pack    Name of the pack to remove
`);
}

export default function uninstall(args) {
  const packName = args[0];

  if (!packName || packName === '--help' || packName === '-h') {
    showHelp();
    if (!packName) process.exit(1);
    return;
  }

  const userPackDir = join(getConfigDir(), 'packs', packName);

  if (!existsSync(userPackDir)) {
    console.error(`Pack not found in user packs: ${packName}`);
    console.error('Only user-installed packs can be uninstalled.');
    console.error('Run "pingthings list" to see all packs.');
    process.exit(1);
  }

  rmSync(userPackDir, { recursive: true });

  // If this was the active pack, reset to default
  const config = readConfig();
  if (config.activePack === packName) {
    config.activePack = '7kaa-soldiers';
    writeConfig(config);
    console.log(`Active pack reset to: 7kaa-soldiers`);
  }

  console.log(`Uninstalled: ${packName}`);
}
