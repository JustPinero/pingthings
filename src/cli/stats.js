import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readConfig, getConfigDir } from '../config.js';
import { listPacks } from '../packs.js';

function showHelp() {
  console.log(`
Usage: pingthings stats

Show usage statistics — total sounds, packs, play count, and more.
`);
}

function getStatsPath() {
  return join(getConfigDir(), 'stats.json');
}

export function recordPlay(packName, event) {
  const statsPath = getStatsPath();
  let stats = { totalPlays: 0, packPlays: {}, eventPlays: {}, dailyPlays: {} };

  if (existsSync(statsPath)) {
    try {
      stats = JSON.parse(readFileSync(statsPath, 'utf8'));
    } catch {}
  }

  stats.totalPlays = (stats.totalPlays || 0) + 1;

  if (!stats.packPlays) stats.packPlays = {};
  stats.packPlays[packName] = (stats.packPlays[packName] || 0) + 1;

  if (event) {
    if (!stats.eventPlays) stats.eventPlays = {};
    stats.eventPlays[event] = (stats.eventPlays[event] || 0) + 1;
  }

  const today = new Date().toISOString().split('T')[0];
  if (!stats.dailyPlays) stats.dailyPlays = {};
  stats.dailyPlays[today] = (stats.dailyPlays[today] || 0) + 1;

  try {
    writeFileSync(statsPath, JSON.stringify(stats, null, 2) + '\n', 'utf8');
  } catch {}
}

export default function stats(args) {
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const packs = listPacks();
  const totalSounds = packs.reduce((s, p) => s + p.soundCount, 0);
  const statsPath = getStatsPath();

  console.log('\n  PINGTHINGS STATS\n');
  console.log(`  Packs installed:    ${packs.length}`);
  console.log(`  Total sounds:       ${totalSounds}`);
  console.log(`  Categories:         ${new Set(packs.map(p => p.category)).size}`);

  if (!existsSync(statsPath)) {
    console.log('\n  No play history yet. Start using pingthings!\n');
    return;
  }

  let data;
  try {
    data = JSON.parse(readFileSync(statsPath, 'utf8'));
  } catch {
    console.log('\n  No play history yet.\n');
    return;
  }

  console.log(`\n  Total plays:        ${data.totalPlays || 0}`);

  const today = new Date().toISOString().split('T')[0];
  console.log(`  Plays today:        ${data.dailyPlays?.[today] || 0}`);

  if (data.packPlays && Object.keys(data.packPlays).length > 0) {
    const sorted = Object.entries(data.packPlays).sort((a, b) => b[1] - a[1]);
    console.log(`\n  Most played packs:`);
    for (const [pack, count] of sorted.slice(0, 5)) {
      console.log(`    ${pack.padEnd(24)} ${count} plays`);
    }
  }

  if (data.eventPlays && Object.keys(data.eventPlays).length > 0) {
    console.log(`\n  Events:`);
    for (const [event, count] of Object.entries(data.eventPlays)) {
      console.log(`    ${event.padEnd(16)} ${count}`);
    }
  }

  console.log('');
}
