import { readConfig, writeConfig, VALID_MODES } from '../config.js';

const VALID_KEYS = ['activePack', 'mode', 'specificSound'];

export default function config(args) {
  const [key, ...rest] = args;
  const value = rest.join(' ') || undefined;

  // No args: show full config
  if (!key) {
    const cfg = readConfig();
    console.log(JSON.stringify(cfg, null, 2));
    return;
  }

  // Validate key
  if (!VALID_KEYS.includes(key)) {
    console.error(`Unknown config key: ${key}`);
    console.error(`Valid keys: ${VALID_KEYS.join(', ')}`);
    process.exit(1);
  }

  // One arg: show value
  if (value === undefined) {
    const cfg = readConfig();
    console.log(cfg[key] ?? '(not set)');
    return;
  }

  // Validate mode values
  if (key === 'mode' && !VALID_MODES.includes(value)) {
    console.error(`Invalid mode: ${value}`);
    console.error(`Valid modes: ${VALID_MODES.join(', ')}`);
    process.exit(1);
  }

  // Two args: set value
  const cfg = readConfig();
  cfg[key] = value === 'null' ? null : value;
  writeConfig(cfg);
  console.log(`${key} set to: ${cfg[key]}`);
}
