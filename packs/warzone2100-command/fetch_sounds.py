#!/usr/bin/env python3
"""Download and convert Warzone 2100 sound effects for pingthings."""
import subprocess
import os
import json
import base64

DEST = "/Users/justinpinero/Desktop/projects/pingthings/packs/warzone2100-command/sounds"
REPO = "Warzone2100/warzone2100"
BASE_PATH = "data/base/audio"
FFMPEG = "/opt/homebrew/bin/ffmpeg"

# Sound files to download: (repo_subpath, output_name, description)
SOUNDS = [
    # Female computer voice - Research
    ("memressp/research/pcv357.ogg", "research-completed", "Research Completed"),
    ("memressp/research/pcv358.ogg", "major-research-completed", "Major Research Completed"),
    ("memressp/research/pcv353.ogg", "new-research-available", "New Research Project Available"),
    # Female computer voice - Production
    ("memressp/productn/pcv367.ogg", "production-completed", "Production Completed"),
    ("memressp/productn/pcv366.ogg", "production-started", "Production Started"),
    # Female computer voice - Design & Construction
    ("memressp/desnseq/pcv334.ogg", "design-completed", "Design Completed"),
    ("memressp/struct/pcv336.ogg", "construction-completed", "Construction Completed"),
    # Female computer voice - Combat & Warnings
    ("memressp/combat/pcv399.ogg", "unit-under-attack", "Unit Under Attack"),
    ("memressp/struct/pcv337.ogg", "structure-under-attack", "Structure Under Attack"),
    ("memressp/detect/pcv378.ogg", "enemy-detected", "Enemy Unit Detected"),
    # Female computer voice - Mission & Status
    ("memressp/missmesg/pcv459.ogg", "mission-successful", "Mission Successful"),
    ("memressp/missmesg/pcv458.ogg", "mission-failed", "Mission Failed"),
    ("memressp/missmesg/pcv455.ogg", "incoming-transmission", "Incoming Transmission"),
    ("memressp/missmesg/pcv469.ogg", "system-failure-imminent", "Warning! System Failure Imminent"),
    ("memressp/console/pcv413.ogg", "console-activated", "Command Console Activated"),
    ("memressp/routing/pcv438.ogg", "route-obstructed", "Route Obstructed"),
    ("memressp/tutorial/pcv434.ogg", "excellent", "Excellent"),
    # NEXUS AI voice
    ("nexus/laugh1.ogg", "nexus-laugh", "NEXUS Laugh"),
    ("nexus/synplnk.ogg", "nexus-synaptic-link", "NEXUS Synaptic Link"),
    ("nexus/defabsrd.ogg", "nexus-defiance-absorbed", "NEXUS Defiance Absorbed"),
    # Interface
    ("sfx/interfce/beep4.ogg", "select-beep", "Select Beep"),
]

os.makedirs(DEST, exist_ok=True)

for subpath, name, desc in SOUNDS:
    ogg_path = os.path.join(DEST, f"{name}.ogg")
    wav_path = os.path.join(DEST, f"{name}.wav")
    api_path = f"{BASE_PATH}/{subpath}"

    # Skip if WAV already exists
    if os.path.exists(wav_path):
        print(f"  SKIP {name}.wav (already exists)")
        continue

    # Download via gh api
    print(f"  Downloading {desc} ({subpath})...")
    try:
        result = subprocess.run(
            ["gh", "api", f"repos/{REPO}/contents/{api_path}", "--jq", ".content"],
            capture_output=True, text=True, check=True
        )
        content_b64 = result.stdout.strip()
        binary_data = base64.b64decode(content_b64)
        with open(ogg_path, "wb") as f:
            f.write(binary_data)
        print(f"    Downloaded {len(binary_data)} bytes")
    except Exception as e:
        print(f"    ERROR downloading: {e}")
        continue

    # Convert to WAV
    print(f"  Converting {name}.ogg -> {name}.wav...")
    try:
        subprocess.run(
            [FFMPEG, "-y", "-i", ogg_path, "-acodec", "pcm_s16le", "-ar", "22050", "-ac", "1", wav_path],
            capture_output=True, check=True
        )
        os.remove(ogg_path)
        size = os.path.getsize(wav_path)
        print(f"    Converted ({size} bytes)")
    except Exception as e:
        print(f"    ERROR converting: {e}")

# Also remove any leftover OGG
for f in os.listdir(DEST):
    if f.endswith(".ogg"):
        os.remove(os.path.join(DEST, f))
        print(f"  Cleaned up {f}")

print(f"\nDone! {len([f for f in os.listdir(DEST) if f.endswith('.wav')])} WAV files ready.")
