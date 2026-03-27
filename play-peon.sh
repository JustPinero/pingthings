#!/bin/bash
# peon-ping: Play a random Seven Kingdoms soldier acknowledgement sound
# Used as a Claude Code hook to notify when a task is complete

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOUNDS_DIR="$SCRIPT_DIR/sounds/soldiers"

# Pick a random WAV file from the soldiers directory
SOUNDS=("$SOUNDS_DIR"/*.wav)
RANDOM_SOUND="${SOUNDS[$((RANDOM % ${#SOUNDS[@]}))]}"

# Play it (macOS). Runs in background so it doesn't block Claude Code.
afplay "$RANDOM_SOUND" &
