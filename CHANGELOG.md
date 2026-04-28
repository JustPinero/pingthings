# Changelog

## 1.6.0

Big release. Audio hygiene + metadata, user control, cross-platform
detection, on-demand HTTP server. 176 tests across 39 suites.

### Added — Audio hygiene & metadata

- **Manifest schema extensions** (`src/manifest-schema.js`):
  - `sourceUrl` — canonical URL to the pack's origin (download / project
    page). Backfilled across all 32 existing packs.
  - `maxVolume` — 0–100 cap on effective playback volume for this pack;
    player applies `min(globalVolume, maxVolume)`. Default 100. Defends
    against the class of issue that prompted mduel-retro's removal.
  - `tone` — one of `peaceful | professional | playful | aggressive |
    mixed`. Inferred from category for backfill.
  - `validatePackManifest()` for soft validation (returns
    `{ ok, errors }`); does not break legacy packs missing optional
    fields.
- **`pingthings normalize <pack>`** (`src/cli/normalize.js`) — runs
  ffmpeg's loudnorm filter (default -23 LUFS / -2 dB true peak) on
  every sound in a pack. Includes `--target-lufs`, `--peak-db`, and
  `--dry-run`. Exits cleanly with install instructions if ffmpeg
  isn't on PATH.

### Added — User control

- **`pingthings mute <duration>`** (`src/cli/mute.js`) — manual
  suppression of all playback for a fixed window. Accepts numeric
  minutes, or `s`/`m`/`h` suffixes (e.g. `30`, `90s`, `2h`).
  `pingthings mute off` cancels. `pingthings unmute` works as an
  alias. Sentinel file at `~/.config/pingthings/.muted-until`
  (Unix-ms expiration), respected by every `play` invocation.
- **Per-project pack override** — when a project has
  `.claude/settings.json` with `pingthings.activePack: "name"`,
  `pingthings play` invocations from that cwd use the project's
  pack instead of the global default. Layers with the new resolution
  priority: env (`PINGTHINGS_PACK`) > project override > schedule
  profile > global default.
- **Schedule profiles** — new `timeProfiles` config field. Map
  `{ "9-17": "office-minimal", "22-7": "serene-bells" }` rotates
  packs by hour-of-day. Wrap-around windows (overnight) supported.
- **Mute on call** — when `muteOnCall: true` in config, every play
  is suppressed if a known video-call client is detected as running
  (Zoom, Teams, Webex, BlueJeans, Skype). Process-allowlist
  detection in `src/call-detector.js`; cross-platform on macOS,
  Linux, Windows. Slack/Discord intentionally NOT in the allowlist
  to avoid false positives (their presence ≠ on-a-call).

### Added — Cross-platform detection libraries

- **`src/call-detector.js`** — `isOnCall()` returns true when a
  known video-call process is running. Uses `ps -A -o comm=` on
  macOS/Linux and `tasklist /FO CSV` on Windows.
  `getCallProcessAllowlist()` exposes the per-platform list for
  `pingthings doctor` and tests.
- **`src/audio-output.js`** — `detectAudioOutput()` returns
  `headphones | speakers | unknown`. macOS via `system_profiler`,
  Linux via `pactl info`, Windows via PowerShell + AudioDeviceCmdlets
  (or WMI fallback). Library available for future
  headphone-aware volume scaling.

### Added — Webhook server

- **`pingthings serve [--port N] [--host H] [--token T]`**
  (`src/cli/serve.js`) — on-demand HTTP server. Localhost-only
  default. Refuses to bind non-localhost without a `--token`.
  Endpoints:
  - `GET /healthz` → 200 OK with version info
  - `POST /play` → 202; spawns a random play
  - `POST /play/event/<event>` → 202; spawns a play for the named
    event (`done | permission | complete | error | blocked`)
  - Optional `X-Pingthings-Token` header authentication when
    `--token` is set
- Useful for CI alerts, GitHub Actions, deploy scripts, or any
  external trigger that should ring pingthings.

### Pack catalog

- `requests/phase-2-pack-expansion/2.1-source-30-packs.md` — request
  file scoping the addition of 30 new packs (5 each from Freesound,
  Mixkit, NASA, OpenGameArt, YouTube Audio Library, Internet
  Archive). Manifest templates, search queries, license expectations,
  and acceptance criteria documented; actual audio sourcing is a
  follow-up that needs browser access.

### Tests

- Baseline 130 → **176** (+46). New suites: `manifest-schema`,
  `config-extras` (mute + schedule + resolveActivePack),
  `call-detector`, `audio-output`, `serve`, `mute`.

## 1.5.0

### Added
- **Cross-process debounce** — new `debounceMs` config field (default
  `1500`) coalesces near-simultaneous `pingthings play` invocations
  into a single audible play. Solves the multi-pane Claude Code
  dispatch case where N sessions ending in lockstep would previously
  fire N overlapping sounds. Set `debounceMs: 0` to disable.
  Sentinel: `~/.config/pingthings/.last-play-time`.
- `pingthings config debounceMs <ms>` to tune the window.

### Removed
- **`mduel-retro` pack** removed from the registry, the website's
  `packs.json`, and the test suite. Some sounds in this pack had
  uncalibrated peaks that could damage speakers at default volume.
  Users who had it as their active pack will fall back to the default
  `7kaa-soldiers`. If you really want it back, install separately via
  `pingthings install <github-url>`.

### Notes
- `cooldown` (existing flag) and `debounceMs` (new) solve different
  problems and stack: `cooldown` prevents picking the same sound
  twice in a row, `debounceMs` prevents ANY sound from playing if
  one was played in the last N ms regardless of which.

## 1.1.0

### Added
- 3 new sound sections beyond retro gaming:
  - **Serene** (3 packs): temple bells, water drops, soft tones
  - **Office** (4 packs): minimal clicks, mechanical, digital pings, classic desk sounds
  - **Nature** (5 packs): animals, ocean, night, weather, forest
- 12 new sound packs (31 total, 522 sounds)
- Redesigned React site with 4 themed sections:
  - Landing page with section tiles
  - /retro — CRT scanlines, neon glow
  - /serene — soft gradients, zen aesthetic
  - /office — clean white/gray, minimal corporate
  - /nature — earthy greens, organic textures
- React Router for page navigation
- 20 sound categories

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
