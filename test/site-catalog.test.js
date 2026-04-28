import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SITE_CATALOG_PATH = join(ROOT, 'site/public/packs.json');
const PACKS_DIR = join(ROOT, 'packs');

const siteCatalog = JSON.parse(readFileSync(SITE_CATALOG_PATH, 'utf8'));
const filesystemPacks = readdirSync(PACKS_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

describe('site/public/packs.json — schema sync (1.6.1)', () => {
  it('has one entry per filesystem pack (no orphans, no missing)', () => {
    const siteNames = new Set(siteCatalog.map(e => e.name));
    const fsNames = new Set(filesystemPacks);
    for (const name of fsNames) {
      assert.ok(siteNames.has(name), `site catalog missing entry for ${name}`);
    }
    for (const name of siteNames) {
      assert.ok(fsNames.has(name), `site catalog has orphan entry: ${name} (no /packs dir)`);
    }
  });

  it('every entry has the new 1.6.0 schema fields (sourceUrl, tone, maxVolume)', () => {
    for (const entry of siteCatalog) {
      assert.ok(typeof entry.sourceUrl === 'string', `${entry.name} missing sourceUrl`);
      assert.ok(typeof entry.tone === 'string', `${entry.name} missing tone`);
      assert.ok(typeof entry.maxVolume === 'number', `${entry.name} missing maxVolume`);
    }
  });

  it('every entry preserves legacy fields (name, description, license, soundCount)', () => {
    for (const entry of siteCatalog) {
      assert.ok(typeof entry.name === 'string');
      assert.ok(typeof entry.description === 'string');
      assert.ok(typeof entry.license === 'string');
      assert.ok(typeof entry.soundCount === 'number');
    }
  });
});
