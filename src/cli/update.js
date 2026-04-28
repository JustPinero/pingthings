import { execFileSync, execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getConfigDir } from '../config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function showHelp() {
  console.log(`
Usage: pingthings update [options]

Check for and install updates to the CLI and installed packs.

Options:
  --all        Update everything (CLI + all packs)
  --cli        Only check/update the CLI
  --packs      Only check/update installed packs
  --check      Check for updates without installing (default)
  --help, -h   Show this help message

Examples:
  pingthings update              Check for available updates
  pingthings update --all        Update CLI and all packs
  pingthings update --packs      Update only installed packs
`);
}

function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
}

function checkCliUpdate() {
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8'));
  const current = pkg.version;

  console.log(`  Current version: v${current}`);

  try {
    const latest = execFileSync('npm', ['view', 'pingthings', 'version'], {
      encoding: 'utf8',
      timeout: 10000,
    }).trim();

    if (compareVersions(latest, current) > 0) {
      return { name: 'pingthings', current, latest, hasUpdate: true };
    }
    return { name: 'pingthings', current, latest, hasUpdate: false };
  } catch {
    console.log('  Could not check npm. Are you online?');
    return { name: 'pingthings', current, latest: null, hasUpdate: false, error: true };
  }
}

function getGitPackChangelog(packDir, count = 5) {
  try {
    const log = execFileSync('git', [
      'log', '--oneline', `HEAD..FETCH_HEAD`, `-${count}`,
    ], { cwd: packDir, encoding: 'utf8', timeout: 10000 }).trim();
    return log || null;
  } catch {
    return null;
  }
}

function checkPackUpdates() {
  const packsDir = join(getConfigDir(), 'packs');
  if (!existsSync(packsDir)) return [];

  const results = [];
  const entries = readdirSync(packsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const packDir = join(packsDir, entry.name);
    const gitDir = join(packDir, '.git');

    if (!existsSync(gitDir)) continue; // Skip non-git packs

    const name = entry.name;
    let currentVersion = '0.0.0';

    // Read current manifest version
    for (const manifestFile of ['manifest.json', 'openpeon.json']) {
      const mPath = join(packDir, manifestFile);
      if (existsSync(mPath)) {
        try {
          const m = JSON.parse(readFileSync(mPath, 'utf8'));
          currentVersion = m.version || '0.0.0';
        } catch { /* ignore */ }
        break;
      }
    }

    // Fetch latest from remote
    try {
      execFileSync('git', ['fetch', '--quiet'], {
        cwd: packDir,
        encoding: 'utf8',
        timeout: 15000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch {
      results.push({ name, current: currentVersion, hasUpdate: false, error: true });
      continue;
    }

    // Check if there are new commits
    try {
      const behind = execFileSync('git', [
        'rev-list', '--count', 'HEAD..FETCH_HEAD',
      ], { cwd: packDir, encoding: 'utf8', timeout: 5000 }).trim();

      const behindCount = parseInt(behind, 10);
      if (behindCount > 0) {
        const changelog = getGitPackChangelog(packDir);
        results.push({
          name,
          current: currentVersion,
          behindCount,
          hasUpdate: true,
          changelog,
          packDir,
        });
      } else {
        results.push({ name, current: currentVersion, hasUpdate: false });
      }
    } catch {
      results.push({ name, current: currentVersion, hasUpdate: false, error: true });
    }
  }

  return results;
}

function updateCli() {
  console.log('\nUpdating pingthings CLI...');
  try {
    // Detect if installed globally via npm
    const npmRoot = execFileSync('npm', ['root', '-g'], {
      encoding: 'utf8',
      timeout: 10000,
    }).trim();

    if (existsSync(join(npmRoot, 'pingthings'))) {
      execFileSync('npm', ['install', '-g', 'pingthings@latest'], {
        stdio: 'inherit',
        timeout: 60000,
      });
      console.log('CLI updated successfully.');
      return true;
    }

    // Not a global npm install — give manual instructions
    console.log('pingthings is not installed globally via npm.');
    console.log('Update manually: npm install -g pingthings@latest');
    return false;
  } catch {
    console.error('Failed to update CLI. Try manually: npm install -g pingthings@latest');
    return false;
  }
}

function updatePack(packDir, name) {
  try {
    execFileSync('git', ['pull', '--ff-only'], {
      cwd: packDir,
      encoding: 'utf8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    console.log(`  Updated: ${name}`);
    return true;
  } catch {
    console.error(`  Failed to update: ${name} (try manually: cd ${packDir} && git pull)`);
    return false;
  }
}

export default function update(args) {
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const doAll = args.includes('--all');
  const cliOnly = args.includes('--cli');
  const packsOnly = args.includes('--packs');
  const checkOnly = !doAll && !cliOnly && !packsOnly || args.includes('--check');
  const shouldCheckCli = !packsOnly;
  const shouldCheckPacks = !cliOnly;

  const updates = { cli: null, packs: [] };

  // Check CLI
  if (shouldCheckCli) {
    console.log('\nCLI:');
    updates.cli = checkCliUpdate();

    if (updates.cli.hasUpdate) {
      console.log(`  New version available: v${updates.cli.latest}`);
    } else if (!updates.cli.error) {
      console.log('  Up to date.');
    }
  }

  // Check packs
  if (shouldCheckPacks) {
    console.log('\nInstalled packs:');
    updates.packs = checkPackUpdates();

    if (updates.packs.length === 0) {
      console.log('  No git-based packs installed.');
    } else {
      const updatable = updates.packs.filter(p => p.hasUpdate);
      const upToDate = updates.packs.filter(p => !p.hasUpdate && !p.error);
      const errors = updates.packs.filter(p => p.error);

      if (updatable.length > 0) {
        for (const pack of updatable) {
          console.log(`  ${pack.name} — ${pack.behindCount} new commit${pack.behindCount === 1 ? '' : 's'}`);
          if (pack.changelog) {
            for (const line of pack.changelog.split('\n')) {
              console.log(`    ${line}`);
            }
          }
        }
      }

      if (upToDate.length > 0) {
        for (const pack of upToDate) {
          console.log(`  ${pack.name} — up to date`);
        }
      }

      if (errors.length > 0) {
        for (const pack of errors) {
          console.log(`  ${pack.name} — could not check (network error?)`);
        }
      }
    }
  }

  // Summary for check-only mode
  if (checkOnly && !doAll) {
    const cliNeedsUpdate = updates.cli?.hasUpdate;
    const packUpdates = updates.packs.filter(p => p.hasUpdate);

    if (cliNeedsUpdate || packUpdates.length > 0) {
      console.log('\nTo update everything: pingthings update --all');
      if (cliNeedsUpdate && packUpdates.length === 0) {
        console.log(`Or manually: npm install -g pingthings@${updates.cli.latest}`);
      }
    } else {
      console.log('\nEverything is up to date.');
    }
    return;
  }

  // Perform updates
  let updated = 0;

  if ((doAll || cliOnly) && updates.cli?.hasUpdate) {
    if (updateCli()) updated++;
  }

  if (doAll || packsOnly) {
    const updatable = updates.packs.filter(p => p.hasUpdate);
    if (updatable.length > 0) {
      console.log('\nUpdating packs...');
      for (const pack of updatable) {
        if (updatePack(pack.packDir, pack.name)) updated++;
      }
    }
  }

  if (updated > 0) {
    console.log(`\nDone. Updated ${updated} item${updated === 1 ? '' : 's'}.`);
  } else {
    console.log('\nNothing to update.');
  }
}
