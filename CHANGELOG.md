# Changelog

## 1.0.0

### Stable release

pingthings v1.0.0 — the first stable release.

19 sound packs, 369 sounds, 25 commands, 13 themes, 130 tests.
Supports Claude Code, Cursor, Copilot, Codex, Windsurf, and Gemini CLI.
CESP-compatible for interoperability with the broader ecosystem.

### Fixed (v1.0 audit)
- LICENSE now attributes all 19 packs (was missing 13)
- notify.js sanitizes osascript arguments (prevents injection)
- stats.js uses atomic write (tmp+rename) for race condition safety
- README fully updated: all 25 commands, all 19 packs, all 13 themes, all config keys
- completions.js updated with all commands and themes
- Windows `which` → `where` for cross-platform command detection
- 130 tests covering all commands

## 0.9.0

### Added
- Multi-IDE adapter system via `setup` command:
  - `pingthings setup cursor` — Cursor AI editor
  - `pingthings setup copilot` — GitHub Copilot CLI
  - `pingthings setup codex` — OpenAI Codex CLI
  - `pingthings setup windsurf` — Windsurf (Cascade)
  - `pingthings setup gemini` — Gemini CLI
  - `pingthings setup claude-code` — Claude Code (same as init)
- `demo` command — plays one sound from every pack in sequence
- `stats` command — usage statistics (total plays, most-played pack, daily count)
- `--silent` flag on play — run hooks without audio (for scripts/CI)
- Play history tracking (stats.json in config dir)
- 4 new themes: developer, arcade, tabletop, tournament (13 total)

## 0.8.0

### Added
- CESP (Coding Event Sound Pack) format compatibility
  - Reads `openpeon.json` alongside `manifest.json`
  - Maps CESP's 9 events to our 5 events
  - `cesp` command generates CESP manifests for all packs
  - Our packs now work with PeonPing and other CESP-compatible tools
- 6 new sound packs:
  - `kenney-digital` — 18 digital/space tones (CC0)
  - `kenney-rpg` — 18 fantasy RPG foley sounds (CC0)
  - `kenney-impacts` — 18 material impact sounds (CC0)
  - `kenney-fighter` — 18 female fighting announcer: "flawless victory!" (CC0)
  - `retro-weapons` — 18 8-bit weapons, explosions, death screams (CC0)
  - `retro-movement` — 18 8-bit portals, doors, jumps, bleeps (CC0)
- Updated React site with all 19 packs and 95 audio samples

### Changed
- Total: 19 packs, 369 sounds
- CESP manifests generated for all built-in packs
- manifest.json takes priority over openpeon.json (richer metadata)

## 0.7.0

### Added
- 2 new sound packs:
  - `kenney-voiceover` — 19 human voice notifications (CC0): "mission completed", "objective achieved", "game over"
  - `droid-announcer` — 15 robotic AI voice lines (CC-BY-SA 4.0): "objective complete", "action required", "instruction unclear"
- Total: 13 packs, 281 sounds

## 0.6.0

### Added
- Desktop notifications alongside sound (`config notifications true` or `play --notify`)
  - macOS: native notification via osascript
  - Linux: notify-send
- First-run wizard — interactive pack selection on first use (TTY only)
- `update` command — check npm for new CLI versions
- OGG audio format — all built-in packs converted from WAV to OGG (Opus codec)

### Changed
- Package size reduced from ~10MB to ~2.5MB (83% reduction via OGG conversion)
- Boolean config keys (cooldown, notifications) share unified validation
- First-run wizard only triggers on interactive TTY, not hooks/scripts

### Added (site)
- React showcase site with retro 16-bit pixel art theme
- Interactive pack browser with click-to-play audio (55 MP3 samples)
- Category filtering and theme previewer
- GitHub Actions deploy workflow for GitHub Pages

## 0.5.0

### Added
- 2 new sound packs:
  - `xonotic-announcer` — 15 arena FPS voice lines (GPL v2+)
  - `fighting-announcer` — 20 fighting game announcer clips (CC-BY 4.0)
- `random-pack` command — switch to a random pack for variety
- `doctor` command — diagnose audio setup, verify packs, check Claude Code hooks
- `completions` command — generate bash/zsh/fish shell completions
- Sound cooldown — prevents playing the same sound twice in a row (configurable)
- Quiet hours — mute during specified hours, e.g. `config quietHours 22-7`
- Path traversal protection in `uninstall` command

### Changed
- Total: 11 packs, 247 sounds

## 0.4.0

### Added
- 3 new CC0 sound packs:
  - `retro-8bit` — 18 classic 8-bit chiptune sounds (coins, fanfares, power-ups, errors)
  - `kenney-interface` — 18 clean modern UI sounds (confirmations, questions, errors)
  - `kenney-scifi` — 18 futuristic sci-fi sounds (computers, force fields, explosions, lasers)
- `browse` command — browse packs by category (military, arena, fantasy, sci-fi, fps, retro, ui)
- `search` command — full-text search across pack names, descriptions, and sound filenames
- `sounds` command — list individual sounds in a pack, with `--events` flag for event grouping
- Category field in all pack manifests
- 3 new themes: `professional` (Kenney UI), `8bit` (retro chiptune), `space` (Warzone + Kenney sci-fi)

### Changed
- Total: 9 packs, 212 sounds

## 0.3.0

### Added
- GitHub Actions CI pipeline (tests on Node 18/20/22, macOS + Linux)
- `uninstall` command to remove user-installed packs
- CHANGELOG.md
- Manifest validation warnings on malformed pack manifests

### Fixed
- `playSoundSync` timeout reduced from 10s to 5s with stderr capture for debugging
- Malformed manifest.json no longer silently ignored — warnings printed to stderr

## 0.2.1

### Fixed
- Null guard before `playSound` prevents confusing "file not found: null" error
- Volume config now passed in `test-events` and `select` commands
- `install` uses `fs.cpSync` instead of `cp -r` (Windows compatibility)
- Empty basename guard in `install` for edge case paths
- Atomic write (tmp+rename) for `settings.json` in `init`
- LICENSE updated with all 6 pack attributions
- README commands table updated with all 11 commands
- Config example in README now includes `volume` and `eventPacks`
- Player test suite added (6 tests)
- Packs test updated to validate all 6 packs

## 0.2.0

### Added
- `select` command — interactive numbered menu for choosing packs
- `test-events` command — play all 5 event sounds to preview a pack
- `theme` command — 6 pre-built themes (retro, sci-fi, arena, fantasy, ancient, chaos)
- `init` command — auto-configure Claude Code hooks
- `create` command — scaffold a pack from a folder of audio files
- `install` command — install packs from GitHub repos or local paths
- Volume control (`config volume 0-100`)
- Pack mixing — different packs per event via `config eventPacks.<event> <pack>`
- Windows support via PowerShell SoundPlayer
- Per-command `--help` for all subcommands
- GitHub Pages catalog (`docs/index.html`)

## 0.1.0

### Added
- Initial npm package release
- Node.js CLI with zero dependencies
- 6 built-in sound packs (158 sounds):
  - 7kaa-soldiers (53 sounds, GPL v2)
  - wesnoth-combat (19 sounds, GPL v2+)
  - openarena-announcer (18 sounds, GPL v2)
  - freedoom-arsenal (19 sounds, BSD-3-Clause)
  - warzone2100-command (21 sounds, GPL v2)
  - 0ad-civilizations (28 sounds, CC-BY-SA 3.0)
- 3 modes: random, specific, informational
- Event-to-sound mapping (done, permission, complete, error, blocked)
- Cross-platform audio: macOS (afplay), Linux (paplay/aplay)
- XDG-compliant config at `~/.config/pingthings/`
- Commands: play, list, use, preview, config
