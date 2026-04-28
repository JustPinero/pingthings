import { execFileSync } from 'node:child_process';
import { platform } from 'node:os';

/**
 * Cross-platform "is the active audio output a headphone-style device?"
 * detector. Used by future loudness-profile switching: when AirPods /
 * USB headphones / 3.5mm headphones are connected and active, you
 * probably want a quieter level than laptop speakers.
 *
 * Returns one of:
 *   - "headphones"   active output is a headphone-style device
 *   - "speakers"     active output is built-in or external speakers
 *   - "unknown"      can't determine on this platform / system
 *
 * Never throws.
 */

const HEADPHONE_HINTS = [
  'headphone', 'headphones', 'headset',
  'airpod', 'airpods',
  'beats',
  'earbud', 'earbuds',
  'bose',
  'sony',
  'usb-c headphone',
  'lightning headphone',
  'bluetooth a2dp',
];

function looksLikeHeadphones(deviceName) {
  if (!deviceName) return false;
  const lower = deviceName.toLowerCase();
  return HEADPHONE_HINTS.some(h => lower.includes(h));
}

function detectMacOS() {
  // system_profiler is slow but built-in. JSON output is reliable.
  try {
    const json = execFileSync(
      'system_profiler',
      ['SPAudioDataType', '-json'],
      { stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 },
    ).toString();
    const data = JSON.parse(json);
    const items = data.SPAudioDataType?.[0]?._items ?? [];
    for (const item of items) {
      // Look for the active default output device
      if (item.coreaudio_default_audio_output_device === 'spaudio_yes') {
        const name = item._name || '';
        return looksLikeHeadphones(name) ? 'headphones' : 'speakers';
      }
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

function detectLinux() {
  try {
    // pactl is the most common — works on PulseAudio + PipeWire's pulse compat.
    const out = execFileSync(
      'pactl',
      ['list', 'short', 'sinks'],
      { stdio: ['ignore', 'pipe', 'ignore'], timeout: 4000 },
    ).toString();
    // Active sink is hard to determine from this alone; check `info` for default
    const info = execFileSync(
      'pactl',
      ['info'],
      { stdio: ['ignore', 'pipe', 'ignore'], timeout: 4000 },
    ).toString();
    const m = info.match(/Default Sink:\s*(\S+)/);
    if (!m) return 'unknown';
    const defaultSink = m[1];
    const sinkLine = out.split('\n').find(l => l.includes(defaultSink));
    return looksLikeHeadphones(sinkLine || defaultSink) ? 'headphones' : 'speakers';
  } catch {
    return 'unknown';
  }
}

function detectWindows() {
  // PowerShell — Get-AudioDevice from the AudioDeviceCmdlets module if installed,
  // otherwise fall back to default-device WMI query.
  try {
    const script = `
      $ErrorActionPreference = 'SilentlyContinue';
      try {
        Import-Module AudioDeviceCmdlets;
        $d = Get-AudioDevice -Playback;
        $d.Name
      } catch {
        Get-CimInstance Win32_SoundDevice |
          Where-Object { $_.Status -eq 'OK' } |
          Select-Object -First 1 -ExpandProperty Name
      }
    `;
    const out = execFileSync(
      'powershell',
      ['-NoProfile', '-Command', script],
      { stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 },
    ).toString().trim();
    if (!out) return 'unknown';
    return looksLikeHeadphones(out) ? 'headphones' : 'speakers';
  } catch {
    return 'unknown';
  }
}

export function detectAudioOutput() {
  switch (platform()) {
    case 'darwin':
      return detectMacOS();
    case 'linux':
      return detectLinux();
    case 'win32':
      return detectWindows();
    default:
      return 'unknown';
  }
}

/**
 * Convenience: true if the current default audio output looks like
 * headphones. Returns false on unknown — conservative default keeps any
 * volume scaling behavior off when we can't confirm.
 */
export function isHeadphonesActive() {
  return detectAudioOutput() === 'headphones';
}
