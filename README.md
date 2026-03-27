# pingthings

A Claude Code notification hook that plays random soldier acknowledgement sounds from **Seven Kingdoms: Ancient Adversaries** when Claude finishes a response.

Like having your own little army of peons confirming "job's done!"

## Setup

### 1. Clone this repo

```bash
git clone https://github.com/JustPinero/pingthings.git ~/pingthings
```

### 2. Configure Claude Code hook

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
            "command": "~/pingthings/play-peon.sh"
          }
        ]
      }
    ]
  }
}
```

This plays a random soldier sound whenever Claude Code sends a notification (waiting for input, permission, etc.).

### 3. Test it

```bash
./play-peon.sh
```

You should hear a random Seven Kingdoms soldier voice line.

## How it works

- `play-peon.sh` picks a random `.wav` file from `sounds/soldiers/` and plays it with `afplay` (macOS)
- The sound plays in the background so it doesn't block Claude Code
- Claude Code's `Notification` hook triggers the script when Claude needs your attention

## Sound files

All audio is extracted from [Seven Kingdoms: Ancient Adversaries](https://github.com/the3dfxdude/7kaa), which is fully open source under **GPL v2** (both code and game data).

The sounds include soldier acknowledgement voice lines from all 10 civilizations:
Norman, Maya, Greek, Viking, Persian, Chinese, Japanese, Egyptian, Indian, and Zulu.

## Requirements

- macOS (uses `afplay`)
- Claude Code CLI

## License

GPL v2 — same as the original Seven Kingdoms: Ancient Adversaries game assets.
