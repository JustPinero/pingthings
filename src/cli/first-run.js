import { createInterface } from 'node:readline';
import { writeConfig, getDefaults } from '../config.js';
import { listPacks, getPackSounds, pickRandom } from '../packs.js';
import { playSound } from '../player.js';
import { basename } from 'node:path';

export async function runFirstTimeSetup() {
  const packs = listPacks();

  console.log('\n  ================================================');
  console.log('     WELCOME TO PINGTHINGS!');
  console.log('     Your terminal is about to get a LOT cooler.');
  console.log('  ================================================\n');
  console.log('  Let\'s pick your first sound pack.\n');

  for (let i = 0; i < packs.length; i++) {
    console.log(`    ${i + 1}. ${packs[i].name}  (${packs[i].category})`);
    console.log(`       ${packs[i].description}`);
  }

  console.log('\n  Enter a number to preview, then press enter to confirm.\n');

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  const chosen = await new Promise((resolve) => {
    const ask = () => {
      rl.question('  Pick a pack (1-' + packs.length + '): ', (answer) => {
        const num = parseInt(answer.trim(), 10);
        if (isNaN(num) || num < 1 || num > packs.length) {
          console.log(`  Enter a number between 1 and ${packs.length}.`);
          ask();
          return;
        }

        const pack = packs[num - 1];
        const sounds = getPackSounds(pack.name);
        if (sounds.length > 0) {
          const sample = pickRandom(sounds);
          console.log(`\n  Preview: ${basename(sample)}`);
          playSound(sample);
        }

        resolve(pack);
      });
    };
    ask();
  });

  // Save config
  const config = getDefaults();
  config.activePack = chosen.name;
  writeConfig(config);

  console.log(`\n  Active pack set to: ${chosen.name}`);
  console.log('\n  Quick tip: Run "pingthings init" to set up Claude Code hooks.');
  console.log('  Or just run "pingthings play" anytime to hear a sound.\n');

  rl.close();
}
