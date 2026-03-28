# pingthings

Notification sounds for Claude Code and other CLI tools. Like text tones for your terminal.

Pick a sound pack, and pingthings plays a random sound whenever Claude Code needs your attention. Or use **informational mode** to hear different sounds for different events — know if a task is done, if something went wrong, or if Claude needs your input, all by ear.

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

# Play event-based sounds (informational mode)
pingthings play --event done
pingthings play --event error
pingthings play -e complete
```

## Claude Code setup

### Basic (random sounds)

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

### Informational (event-based sounds)

For different sounds based on what Claude is doing, set up multiple hooks:

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "pingthings play --event permission"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "pingthings play --event complete"
          }
        ]
      }
    ],
    "PostToolUseFailure": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "pingthings play --event error"
          }
        ]
      }
    ],
    "StopFailure": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "pingthings play --event blocked"
          }
        ]
      }
    ]
  }
}
```

| Claude Code Event | Sound Event | When it fires |
|---|---|---|
| `Notification` | `permission` | Claude needs your input or approval |
| `Stop` | `complete` | Claude finishes a response |
| `PostToolUseFailure` | `error` | A tool fails (bash error, etc.) |
| `StopFailure` | `blocked` | API error, rate limit, auth issue |

## Commands

| Command | Description |
|---------|-------------|
| `pingthings play [sound] [--event type]` | Play a sound (random, specific, or event-based) |
| `pingthings list` | Show available sound packs |
| `pingthings select` | Interactive pack selector |
| `pingthings use <pack>` | Set the active sound pack |
| `pingthings preview <pack>` | Preview a random sound from a pack |
| `pingthings test-events [pack]` | Play all event sounds to hear each one |
| `pingthings theme [name]` | Apply a sound theme |
| `pingthings config [key] [val]` | Show or update configuration |
| `pingthings init` | Set up Claude Code hooks automatically |
| `pingthings create <dir>` | Create a pack from audio files |
| `pingthings browse [category]` | Browse packs by category |
| `pingthings search <term>` | Search packs and sounds |
| `pingthings sounds [pack]` | List individual sounds in a pack |
| `pingthings install <source>` | Install a pack from GitHub or local path |
| `pingthings uninstall <pack>` | Remove a user-installed pack |

## Configuration

Config lives at `~/.config/pingthings/config.json`:

```json
{
  "activePack": "7kaa-soldiers",
  "mode": "random",
  "specificSound": null,
  "volume": 100,
  "eventPacks": {}
}
```

- **activePack** — which sound pack to use
- **mode** — `"random"` (default), `"specific"`, or `"informational"`
- **specificSound** — sound name to always play when mode is `"specific"`
- **volume** — playback volume, 0-100 (default: 100)
- **eventPacks** — per-event pack overrides (e.g. `{"error": "freedoom-arsenal"}`)

Set values via CLI:

```bash
pingthings config mode random          # any random sound
pingthings config mode specific        # always the same sound
pingthings config mode informational   # event-based sounds
pingthings config specificSound READY  # set the sound for specific mode
```

## Modes

### Random (default)
Plays any random sound from the active pack. Great for variety.

### Specific
Always plays the same configured sound. Set it with `pingthings config specificSound <name>`.

### Informational
Plays different sounds based on what's happening. Use the `--event` flag to tell pingthings what type of event occurred:

| Event | Meaning | Example trigger |
|-------|---------|----------------|
| `done` | Task/step finished | Claude completed a request |
| `permission` | Needs approval | Claude needs tool permission |
| `complete` | Major milestone done | Project or phase finished |
| `error` | Something went wrong | Build failed, test failed |
| `blocked` | User action needed | Need to update a dashboard, grant access |

```bash
pingthings play --event done       # "task finished" sound
pingthings play --event error      # "something broke" sound
pingthings play -e permission      # "need your approval" sound
```

Each pack maps its sounds to events thematically:
- **7kaa-soldiers**: voice acknowledgements for done, "READY" for permission, attack grunts for errors
- **openarena-announcer**: "excellent!" for done, "prepare!" for permission, "denied!" for errors
- **wesnoth-combat**: gold collect for done, chest open for permission, explosions for errors
- **freedoom-arsenal**: item pickup for done, shotgun cock for permission, barrel explosion for errors
- **warzone2100-command**: "research completed" for done, "incoming transmission" for permission, "mission failed" for errors
- **0ad-civilizations**: Greek "as you wish" for done, "my lord?" for permission, alarm horns for errors

## Built-in packs

### 7kaa-soldiers
Soldier acknowledgement voice lines from **Seven Kingdoms: Ancient Adversaries** — 53 sounds from all 10 civilizations (Norman, Maya, Greek, Viking, Persian, Chinese, Japanese, Egyptian, Indian, Zulu). License: GPL v2.

### wesnoth-combat
Fantasy combat and magic sounds from **Battle for Wesnoth** — 19 sounds including swords, bows, spells, explosions, gold collection, healing, and a dwarf laugh. License: GPL v2+.

### openarena-announcer
Arena FPS announcer voice lines from **OpenArena** — 18 sounds including "excellent!", "impressive!", "fight!", "perfect!", "denied!", and more. License: GPL v2.

### freedoom-arsenal
Retro FPS weapon and pickup sounds from **Freedoom** — 19 sounds including shotgun, plasma rifle, BFG, rocket launcher, item pickups, and teleport. License: BSD-3-Clause.

### warzone2100-command
Sci-fi military commander voice lines from **Warzone 2100** — 21 sounds including "research completed", "mission successful", "incoming transmission", "enemy detected", and NEXUS AI laughs. License: GPL v2.

### 0ad-civilizations
Ancient civilization voice lines and alerts from **0 A.D.** — 28 sounds with Greek, Latin, and Persian voice acknowledgements ("my lord", "as you wish", "by your order") plus alarm sounds (victory, defeat, attack). License: CC-BY-SA 3.0.

### retro-8bit
Classic 8-bit chiptune notification sounds — 18 sounds including coins, fanfares, power-ups, error buzzes, and button clicks. Perfect for that retro gaming feel. License: CC0.

### kenney-interface
Clean modern UI notification sounds by **Kenney** — 18 sounds including confirmations, questions, errors, glitches, and bongs. Professional and minimal. License: CC0.

### kenney-scifi
Futuristic sci-fi notification sounds by **Kenney** — 18 sounds including computer noises, force fields, lasers, explosions, and thrusters. License: CC0.

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

To support informational mode, add an `events` field mapping event types to sounds:

```json
{
  "name": "my-pack",
  "description": "My custom sound pack",
  "license": "MIT",
  "credits": "Your Name",
  "events": {
    "done": ["sounds/success.wav", "sounds/complete.wav"],
    "permission": ["sounds/question.wav"],
    "complete": ["sounds/fanfare.wav"],
    "error": ["sounds/alarm.wav", "sounds/buzz.wav"],
    "blocked": ["sounds/warning.wav"]
  }
}
```

## Themes

Apply a pre-built theme that maps events to packs with one command:

```bash
pingthings theme              # list available themes
pingthings theme sci-fi       # apply a theme
pingthings theme reset        # back to defaults
```

| Theme | Description |
|-------|-------------|
| `retro` | Classic retro gaming — Freedoom weapons + 7kaa soldiers |
| `sci-fi` | Sci-fi command center — Warzone 2100 commander voice |
| `arena` | Arena announcer with FPS weapons for errors |
| `fantasy` | Medieval fantasy — Wesnoth + 0 A.D. civilizations |
| `ancient` | Ancient world — 7kaa soldiers + 0 A.D. voices |
| `professional` | Clean and minimal — Kenney UI sounds for everything |
| `8bit` | Pure retro — 8-bit chiptune for everything |
| `space` | Space station — Warzone 2100 + Kenney sci-fi |
| `chaos` | Different pack for every event — maximum variety |

## Tools

### Create a pack
```bash
pingthings create ./my-sounds my-pack
```
Scaffolds a new pack from a folder of audio files with an auto-generated manifest.

### Install from GitHub
```bash
pingthings install user/repo
pingthings install https://github.com/user/pack-name
```

### Auto-setup Claude Code hooks
```bash
pingthings init                  # interactive wizard
pingthings init --basic          # random sounds, no prompts
pingthings init --informational  # event-based sounds, no prompts
```

## Use with other tools

pingthings works anywhere you can run a shell command.

### Git hooks
```bash
# .git/hooks/post-commit
#!/bin/sh
pingthings play --event done
```

### CI notifications (GitHub Actions)
```yaml
- name: Notify on failure
  if: failure()
  run: npx pingthings play --event error
```

### Shell aliases
```bash
# Add to ~/.zshrc or ~/.bashrc
alias done='pingthings play --event complete'
alias oops='pingthings play --event error'
```

### Pomodoro timer
```bash
sleep 1500 && pingthings play --event complete  # 25 minute focus
```

## Requirements

- Node.js >= 18
- macOS (`afplay`), Linux (`paplay` / `aplay`), or Windows (PowerShell)

## License

GPL v2 — includes audio from open source games:
- [Seven Kingdoms: Ancient Adversaries](https://github.com/the3dfxdude/7kaa) (GPL v2)
- [Battle for Wesnoth](https://github.com/wesnoth/wesnoth) (GPL v2+)
- [OpenArena](http://openarena.ws) (GPL v2)
- [Freedoom](https://github.com/freedoom/freedoom) (BSD-3-Clause)
- [Warzone 2100](https://github.com/Warzone2100/warzone2100) (GPL v2)
- [0 A.D.](https://github.com/0ad/0ad) (CC-BY-SA 3.0)
