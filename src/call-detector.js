import { execFileSync } from 'node:child_process';
import { platform } from 'node:os';

/**
 * Cross-platform "is the user on a video call?" detector.
 *
 * Strategy: process-name allowlist of apps that exist primarily for video
 * calling. Their presence as a running process is a strong signal of an
 * active call. We deliberately do NOT include Slack or Discord here —
 * they're often background-running without an active call, which would
 * produce false positives.
 *
 * If a future iteration wants tighter precision (e.g. checking microphone-
 * in-use rather than process-running), the platform-specific impls below
 * are the place to add that. The exported `isOnCall()` API stays stable.
 *
 * Returns false on errors; this function never throws.
 */

// Process names matched case-insensitively as substrings. Each platform
// has slightly different process naming conventions.
const CALL_PROCESSES = {
  // macOS — `ps -A -o comm=` returns full bundle paths
  darwin: [
    'zoom.us',
    'ZoomMeeting',
    'Microsoft Teams',
    'WebexHelper',
    'Webex',
    'BlueJeans',
    'GoToMeeting',
    'Skype',
  ],
  // Linux — `ps -A -o comm=` returns the executable name
  linux: [
    'zoom',
    'ZoomLauncher',
    'teams',
    'teams-for-linux',
    'webex',
    'skypeforlinux',
  ],
  // Windows — `tasklist` returns image names (.exe)
  win32: [
    'Zoom.exe',
    'ZoomLauncher.exe',
    'Teams.exe',
    'ms-teams.exe',
    'webex.exe',
    'WebexHost.exe',
    'BlueJeans.exe',
    'Skype.exe',
  ],
};

function listProcesses() {
  try {
    if (platform() === 'win32') {
      // tasklist /FO CSV produces a parseable, deterministic listing.
      const out = execFileSync(
        'tasklist',
        ['/FO', 'CSV', '/NH'],
        { stdio: ['ignore', 'pipe', 'ignore'], timeout: 4000 },
      ).toString();
      return out
        .split('\n')
        .map(line => line.split(',')[0]?.replace(/^"|"$/g, '').trim())
        .filter(Boolean);
    }
    // macOS + Linux
    const out = execFileSync('ps', ['-A', '-o', 'comm='], {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 4000,
    }).toString();
    return out.split('\n').map(s => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export function isOnCall() {
  const procs = listProcesses();
  if (procs.length === 0) return false;
  const matchers = CALL_PROCESSES[platform()] || [];
  if (matchers.length === 0) return false;
  const haystack = procs.join('\n').toLowerCase();
  for (const needle of matchers) {
    if (haystack.includes(needle.toLowerCase())) return true;
  }
  return false;
}

/** Inspectable for `pingthings doctor` and tests. */
export function getCallProcessAllowlist() {
  return CALL_PROCESSES[platform()] || [];
}
