# pingthings

Notification sounds for Claude Code and other CLI tools. Like text tones for your terminal.

Pick a sound pack, and pingthings plays a random sound whenever Claude Code needs your attention.

## Install

```bash
npm install -g pingthings
```

## Quick start

```bash
# Play a random sound from the active pack
pingthings play

# See available packs
pingthings list

# Switch packs
pingthings use 7kaa-soldiers

# Preview a pack
pingthings preview 7kaa-soldiers

# Play a specific sound
pingthings play READY
```

## Claude Code setup

Add this to your `~/.claude/settings.json`:

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "pingthings play"
          }
        ]
      }
    ]
  }
}
```

Now you'll hear a sound whenever Claude Code sends a notification (waiting for input, permission prompts, etc.).

## Commands

| Command | Description |
|---------|-------------|
| `pingthings play [sound]` | Play a sound (random by default, or specify a name) |
| `pingthings list` | Show available sound packs |
| `pingthings use <pack>` | Set the active sound pack |
| `pingthings preview <pack>` | Preview a random sound from a pack |
| `pingthings config [key] [val]` | Show or update configuration |
| `pingthings install <pack>` | Install a sound pack (coming soon) |

## Configuration

Config lives at `~/.config/pingthings/config.json`:

```json
{
  "activePack": "7kaa-soldiers",
  "mode": "random",
  "specificSound": null
}
```

- **activePack** — which sound pack to use
- **mode** — `"random"` (default) or `"specific"`
- **specificSound** — sound name to always play when mode is `"specific"`

Set values via CLI:

```bash
pingthings config mode specific
pingthings config specificSound READY
```

## Built-in packs

### 7kaa-soldiers
Soldier acknowledgement voice lines from **Seven Kingdoms: Ancient Adversaries** — 53 sounds from all 10 civilizations (Norman, Maya, Greek, Viking, Persian, Chinese, Japanese, Egyptian, Indian, Zulu). License: GPL v2.

### wesnoth-combat
Fantasy combat and magic sounds from **Battle for Wesnoth** — 19 sounds including swords, bows, spells, explosions, gold collection, healing, and a dwarf laugh. License: GPL v2+.

### openarena-announcer
Arena FPS announcer voice lines from **OpenArena** — 18 sounds including "excellent!", "impressive!", "fight!", "perfect!", "denied!", and more. License: GPL v2.

### freedoom-arsenal
Retro FPS weapon and pickup sounds from **Freedoom** — 19 sounds including shotgun, plasma rifle, BFG, rocket launcher, item pickups, and teleport. License: BSD-3-Clause.

## Custom packs

Place packs in `~/.config/pingthings/packs/<pack-name>/`:

```
my-pack/
  manifest.json
  sounds/
    sound1.wav
    sound2.wav
```

Minimal `manifest.json`:

```json
{
  "name": "my-pack",
  "description": "My custom sound pack",
  "license": "MIT",
  "credits": "Your Name"
}
```

The `sounds` field in the manifest is optional — if omitted, all `.wav`, `.mp3`, `.ogg`, and `.flac` files in the `sounds/` directory are used.

## Requirements

- Node.js >= 18
- macOS (`afplay`) or Linux (`paplay` / `aplay`)

## License

GPL v2 — includes audio from [Seven Kingdoms: Ancient Adversaries](https://github.com/the3dfxdude/7kaa) (GPL v2).
