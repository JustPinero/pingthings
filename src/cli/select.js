import { createInterface } from 'node:readline';
import { readConfig, writeConfig } from '../config.js';
import { listPacks, getPackSounds } from '../packs.js';
import { playSound } from '../player.js';
import { basename } from 'node:path';

function showHelp() {
  console.log(`
Usage: pingthings select

Interactive menu for choosing your active sound pack.
Displays a numbered list — type a number to preview and select.
`);
}

export default async function select(args) {
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const config = readConfig();
  const packs = listPacks();

  if (packs.length === 0) {
    console.error('No sound packs found.');
    process.exit(1);
  }

  console.log('\nChoose a sound pack:\n');

  for (let i = 0; i < packs.length; i++) {
    const active = packs[i].name === config.activePack ? ' *' : '  ';
    console.log(`${active} ${i + 1}. ${packs[i].name}  (${packs[i].soundCount} sounds)`);
    if (packs[i].description) {
      console.log(`      ${packs[i].description}`);
    }
  }

  console.log('\n  * = current pack');
  console.log('  Enter a number to preview & select, or q to quit.\n');

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  await new Promise((resolve) => {
    const ask = () => {
      rl.question('> ', (answer) => {
        const trimmed = answer.trim().toLowerCase();

        if (trimmed === 'q' || trimmed === 'quit' || trimmed === '') {
          rl.close();
          resolve();
          return;
        }

        const num = parseInt(trimmed, 10);
        if (isNaN(num) || num < 1 || num > packs.length) {
          console.log(`Enter 1-${packs.length} or q to quit.`);
          ask();
          return;
        }

        const chosen = packs[num - 1];
        config.activePack = chosen.name;
        writeConfig(config);

        // Preview a sound from the chosen pack
        const sounds = getPackSounds(chosen.name);
        if (sounds.length > 0) {
          const sample = sounds[Math.floor(Math.random() * sounds.length)];
          playSound(sample, config.volume);
        }

        console.log(`\nActive pack set to: ${chosen.name}`);
        rl.close();
        resolve();
      });
    };

    ask();
  });
}
