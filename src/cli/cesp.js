import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { resolvePack, listPacks } from '../packs.js';

const PINGTHINGS_TO_CESP = {
  done: 'task.acknowledge',
  permission: 'input.required',
  complete: 'task.complete',
  error: 'task.error',
  blocked: 'resource.limit',
};

function showHelp() {
  console.log(`
Usage: pingthings cesp [pack|--all]

Generate CESP-compatible openpeon.json for a pack.
Makes your packs work with any CESP-compatible tool (PeonPing, etc.)

Arguments:
  pack     Generate for a specific pack
  --all    Generate for all built-in packs

Examples:
  pingthings cesp 7kaa-soldiers    Generate for one pack
  pingthings cesp --all            Generate for all packs
`);
}

function generateCesp(packName) {
  const pack = resolvePack(packName);
  if (!pack || !pack.manifest) {
    console.error(`Pack not found: ${packName}`);
    return false;
  }

  const m = pack.manifest;
  const categories = {};

  for (const [pingEvent, cespEvent] of Object.entries(PINGTHINGS_TO_CESP)) {
    const eventSounds = m.events?.[pingEvent] || [];
    if (eventSounds.length === 0) continue;

    categories[cespEvent] = {
      sounds: eventSounds.map(file => {
        const fullPath = join(pack.dir, file);
        let sha256 = '';
        try {
          const data = readFileSync(fullPath);
          sha256 = createHash('sha256').update(data).digest('hex');
        } catch {}

        return {
          file,
          label: file.split('/').pop().replace(/\.\w+$/, '').replace(/[-_]/g, ' '),
          ...(sha256 ? { sha256 } : {}),
        };
      }),
    };
  }

  const cesp = {
    cesp_version: '1.0',
    name: m.name,
    display_name: m.description,
    version: m.version || '1.0.0',
    license: m.license,
    author: {
      name: m.credits || 'Unknown',
    },
    categories,
  };

  const outPath = join(pack.dir, 'openpeon.json');
  writeFileSync(outPath, JSON.stringify(cesp, null, 2) + '\n', 'utf8');
  console.log(`  Generated: ${outPath}`);
  return true;
}

export default function cesp(args) {
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    showHelp();
    if (args.length === 0) process.exit(1);
    return;
  }

  if (args.includes('--all')) {
    console.log('\nGenerating CESP manifests for all packs:\n');
    const packs = listPacks();
    for (const pack of packs) {
      if (pack.isBuiltIn) {
        generateCesp(pack.name);
      }
    }
    console.log('\nDone.\n');
    return;
  }

  generateCesp(args[0]);
}
