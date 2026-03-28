#!/bin/bash
# Download Warzone 2100 sound effects for pingthings notification pack
set -e

DEST="/Users/justinpinero/Desktop/projects/pingthings/packs/warzone2100-command/sounds"
BASE="https://raw.githubusercontent.com/Warzone2100/warzone2100/master/data/base/audio"
mkdir -p "$DEST"

echo "Downloading Warzone 2100 sound files..."

# Female computer voice - Research & Production
curl -sL "$BASE/memressp/research/pcv357.ogg" -o "$DEST/research-completed.ogg"         # Research Completed
curl -sL "$BASE/memressp/research/pcv358.ogg" -o "$DEST/major-research-completed.ogg"   # Major Research Completed
curl -sL "$BASE/memressp/research/pcv353.ogg" -o "$DEST/new-research-available.ogg"     # New Research Project Available
curl -sL "$BASE/memressp/productn/pcv367.ogg" -o "$DEST/production-completed.ogg"       # Production Completed
curl -sL "$BASE/memressp/productn/pcv366.ogg" -o "$DEST/production-started.ogg"         # Production Started

# Female computer voice - Structures & Design
curl -sL "$BASE/memressp/desnseq/pcv334.ogg" -o "$DEST/design-completed.ogg"            # Design Completed
curl -sL "$BASE/memressp/struct/pcv336.ogg" -o "$DEST/construction-completed.ogg"       # Construction Completed

# Female computer voice - Combat & Warnings
curl -sL "$BASE/memressp/combat/pcv399.ogg" -o "$DEST/unit-under-attack.ogg"            # Unit Under Attack
curl -sL "$BASE/memressp/struct/pcv337.ogg" -o "$DEST/structure-under-attack.ogg"       # Structure Under Attack
curl -sL "$BASE/memressp/detect/pcv378.ogg" -o "$DEST/enemy-detected.ogg"               # Enemy Unit Detected

# Female computer voice - Mission & Status
curl -sL "$BASE/memressp/missmesg/pcv459.ogg" -o "$DEST/mission-successful.ogg"         # Mission Successful
curl -sL "$BASE/memressp/missmesg/pcv458.ogg" -o "$DEST/mission-failed.ogg"             # Mission Failed
curl -sL "$BASE/memressp/missmesg/pcv455.ogg" -o "$DEST/incoming-transmission.ogg"      # Incoming Transmission
curl -sL "$BASE/memressp/missmesg/pcv469.ogg" -o "$DEST/system-failure-imminent.ogg"    # Warning! System Failure Imminent
curl -sL "$BASE/memressp/console/pcv413.ogg" -o "$DEST/console-activated.ogg"           # Command Console Activated
curl -sL "$BASE/memressp/routing/pcv438.ogg" -o "$DEST/route-obstructed.ogg"            # Route Obstructed
curl -sL "$BASE/memressp/missmesg/pcv434.ogg" -o "$DEST/excellent.ogg"                  # Excellent

# NEXUS AI voice
curl -sL "$BASE/nexus/laugh1.ogg" -o "$DEST/nexus-laugh.ogg"                            # NEXUS Laugh
curl -sL "$BASE/nexus/synplnk.ogg" -o "$DEST/nexus-synaptic-link.ogg"                   # NEXUS Synaptic Link
curl -sL "$BASE/nexus/defabsrd.ogg" -o "$DEST/nexus-defiance-absorbed.ogg"              # NEXUS Defiance Absorbed

# Interface beep
curl -sL "$BASE/sfx/interfce/beep4.ogg" -o "$DEST/select-beep.ogg"                      # Select beep

echo "Downloaded $(ls "$DEST"/*.ogg 2>/dev/null | wc -l) sound files."

# Convert OGG to WAV
echo "Converting OGG to WAV..."
FFMPEG="/opt/homebrew/bin/ffmpeg"
for ogg in "$DEST"/*.ogg; do
    wav="${ogg%.ogg}.wav"
    name=$(basename "$ogg")
    echo "  Converting $name..."
    "$FFMPEG" -y -i "$ogg" -acodec pcm_s16le -ar 22050 -ac 1 "$wav" 2>/dev/null
done

# Remove OGG files
echo "Removing OGG source files..."
rm -f "$DEST"/*.ogg

echo "Done! Converted WAV files:"
ls -la "$DEST"/*.wav
