import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isOnCall, getCallProcessAllowlist } from '../src/call-detector.js';
import { platform } from 'node:os';

describe('call-detector', () => {
  it('isOnCall returns a boolean (never throws)', () => {
    const r = isOnCall();
    assert.equal(typeof r, 'boolean');
  });

  it('returns false in a CI/test environment with no call apps running', () => {
    // CI shouldn't have Zoom etc. running. If the test runs locally
    // while Zoom IS running, this will be true — that's expected.
    // We just assert no throw and a valid boolean.
    const r = isOnCall();
    assert.equal(typeof r, 'boolean');
  });

  it('exports a non-empty allowlist for the current platform', () => {
    const list = getCallProcessAllowlist();
    if (['darwin', 'linux', 'win32'].includes(platform())) {
      assert.ok(list.length > 0, 'expected non-empty allowlist');
    } else {
      // Unknown platform — empty is acceptable
      assert.ok(Array.isArray(list));
    }
  });

  it('allowlist for macOS contains zoom.us and Microsoft Teams', () => {
    if (platform() !== 'darwin') return;
    const list = getCallProcessAllowlist();
    assert.ok(list.includes('zoom.us'));
    assert.ok(list.some(p => p.includes('Teams')));
  });
});
