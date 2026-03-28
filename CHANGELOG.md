# Changelog

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
