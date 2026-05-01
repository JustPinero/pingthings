# pingthings

<p align="center">
  <img src="https://justpinero.github.io/pingthings/images/pingthings-hero.jpg" alt="pingthings" width="100%" />
</p>

<p align="center">
  <strong>Terminal sound effects for everyone.</strong><br>
  33 sound packs · 662 sounds · 17 themes · 6 IDE adapters
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/pingthings"><img src="https://img.shields.io/npm/v/pingthings" alt="npm version" /></a>
  <a href="https://github.com/JustPinero/pingthings/actions"><img src="https://github.com/JustPinero/pingthings/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://justpinero.github.io/pingthings/"><img src="https://img.shields.io/badge/demo-listen%20now-39ff14" alt="Demo" /></a>
</p>

<p align="center">
  <a href="https://justpinero.github.io/pingthings/">Listen to all packs on the showcase site</a>
</p>

---

Your AI finishes a task. You hear a sound. That's it. That's the app.

But the sounds? The sounds are *really* good. Retro game soldiers acknowledging commands, arena announcers shouting "EXCELLENT!", zen singing bowls, forest birds, office clicks — pick your vibe.

Works with **Claude Code**, **Cursor**, **Copilot**, **Codex**, **Windsurf**, and **Gemini CLI**.

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
| `pingthings random-pack` | Switch to a random pack |
| `pingthings install <source>` | Install a pack from GitHub or local path |
| `pingthings uninstall <pack>` | Remove a user-installed pack |
| `pingthings demo` | Play one sound from every pack — showroom tour |
| `pingthings stats` | Show usage statistics |
| `pingthings setup <ide>` | Configure hooks for any IDE (cursor, copilot, codex, etc.) |
| `pingthings mute [on\|off\|duration]` | Silence pingthings indefinitely, until a deadline, or cancel a mute |
| `pingthings fav [add\|remove\|list] [pack]` | Manage favorite packs (★ marker, drives random-pack) |
| `pingthings schedule <list\|add\|remove\|clear\|current>` | Manage hour-of-day pack rotations |
| `pingthings doctor` | Diagnose audio setup and configuration |
| `pingthings update` | Check for new versions on npm |
| `pingthings cesp [pack\|--all]` | Generate CESP-compatible manifests |
| `pingthings completions <shell>` | Generate shell completions (bash/zsh/fish) |

## Configuration

Config lives at `~/.config/pingthings/config.json`:

```json
{
  "activePack": "7kaa-soldiers",
  "mode": "random",
  "specificSound": null,
  "volume": 100,
  "eventPacks": {},
  "cooldown": true,
  "notifications": false,
  "favorites": []
}
```

- **activePack** — which sound pack to use
- **mode** — `"random"` (default), `"specific"`, or `"informational"`
- **specificSound** — sound name to always play when mode is `"specific"`
- **volume** — playback volume, 0-100 (default: 100)
- **eventPacks** — per-event pack overrides (e.g. `{"error": "freedoom-arsenal"}`)
- **cooldown** — avoid repeating the same sound twice in a row (default: true)
- **notifications** — show desktop notifications alongside sound (default: false)
- **favorites** — pack names you've starred. Managed via `pingthings fav add/remove/list`. When non-empty, `pingthings random-pack` picks from this list instead of the full catalog.

To silence pingthings temporarily, use `pingthings mute on` /
`pingthings mute off` (or `pingthings mute 30m` for a fixed window).
There's no scheduled quiet-hours window — it's a ping, not a ringtone.

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

### xonotic-announcer
Arena FPS announcer voice lines from **Xonotic** — 15 sounds including "awesome!", "amazing!", "impressive!", "prepare for battle!", "terminated!". License: GPL v2+.

### fighting-announcer
Fighting game announcer voice lines — 20 sounds including "Fight!", "Victory!", "K.O!", "Game Over!", "Ready?", "You Win!". License: CC-BY 4.0.

### kenney-voiceover
Human voice notifications by **Kenney** — 19 sounds including "mission completed", "objective achieved", "game over", "congratulations". License: CC0.

### droid-announcer
Robotic AI voice lines — 15 sounds including "objective complete", "action required", "instruction unclear", "mission complete". Perfect for AI coding tools. License: CC-BY-SA 4.0.

### kenney-digital
Digital and space notification tones by **Kenney** — 18 sounds including power-ups, phasers, zaps, and bleeps. License: CC0.

### kenney-rpg
Fantasy RPG foley sounds by **Kenney** — 18 sounds including metal latches, book flips, sword draws, door creaks. License: CC0.

### kenney-impacts
Material impact sounds by **Kenney** — 18 sounds including metal plates, wood, glass, bells, and mining. License: CC0.

### kenney-fighter
Female fighting game announcer by **Kenney** — 18 sounds including "flawless victory!", "combo breaker!", "prepare yourself!". License: CC0.

### retro-weapons
8-bit weapons, explosions, and death screams — 18 sounds from the SubspaceAudio collection. License: CC0.

### retro-movement
8-bit portals, doors, jumps, and bleeps — 18 sounds from the SubspaceAudio collection. License: CC0.

### serene-bells
Temple bells, gongs, and crystal chimes — 13 peaceful sounds for zen notifications. License: CC0.

### serene-water
Water drops, drips, and gentle splashes — 12 calming water sounds. License: CC0.

### serene-tones
Soft metallic tones, chimes, and resonances — 12 meditative notification sounds. License: CC0.

### office-minimal
Subtle clicks, ticks, and toggles — 15 workplace-appropriate notification sounds. License: CC0.

### office-digital
Digital pings, alerts, and ascending chimes — 15 modern notification tones. License: CC0.

### office-classic
Keys, switches, paper, and desk sounds — 15 classic office foley. License: CC0.

### office-mechanical
Machines, stamps, taps, and tools — 15 satisfying mechanical sounds. License: CC0.

### nature-animals
Barks, chirps, howls, and creature calls — 15 animal notification sounds. License: CC0.

### nature-night
Nocturnal sounds — owls, crickets, distant calls — 14 night-time notifications. License: CC0.

### nature-forest
Twigs snapping, birds singing, streams babbling — 14 forest sounds. License: CC0.

### nature-ocean
Waves, bubbles, and ocean currents — 11 coastal notification sounds. License: CC0.

### nature-weather
Thunder, wind gusts, rain drops, and storms — 12 dramatic weather sounds. License: CC0.

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
| `developer` | AI assistant vibes — droid announcer + human voiceover |
| `arcade` | Full 8-bit arcade experience |
| `tabletop` | Tavern sounds — RPG foley + material impacts |
| `tournament` | Fighting game tournament — multiple announcers |
| `zen` | Calm and centered — bells, water, soft tones |
| `corporate` | Workplace appropriate — clean clicks and subtle pings |
| `outdoors` | Bring nature inside — birds, waves, weather |
| `nightshift` | Late night coding — crickets, owls, soft tones |
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
