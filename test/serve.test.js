import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = join(__dirname, '..', 'bin', 'pingthings.js');

// Pick a high port unlikely to collide. If it does, the EADDRINUSE
// branch is exercised — also fine.
const PORT = 19998;
const TOKEN = 'test-token-abc';

function startServer(extraArgs = []) {
  const args = ['serve', '--port', String(PORT), ...extraArgs];
  const proc = spawn('node', [CLI, ...args], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return proc;
}

async function waitForListening(proc, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('serve never reported listening')), timeoutMs);
    proc.stdout.on('data', chunk => {
      if (chunk.toString().includes('listening on')) {
        clearTimeout(t);
        resolve();
      }
    });
    proc.on('exit', code => {
      clearTimeout(t);
      reject(new Error(`serve exited early with code ${code}`));
    });
  });
}

async function fetchUrl(url, opts = {}) {
  const res = await fetch(url, opts);
  return res;
}

describe('pingthings serve — HTTP API', () => {
  let proc;

  before(async () => {
    proc = startServer();
    await waitForListening(proc);
  });

  after(() => {
    if (proc && !proc.killed) proc.kill('SIGTERM');
  });

  it('GET /healthz returns 200 with status:ok', async () => {
    const res = await fetchUrl(`http://127.0.0.1:${PORT}/healthz`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'pingthings');
  });

  it('POST /play returns 202', async () => {
    const res = await fetchUrl(`http://127.0.0.1:${PORT}/play`, { method: 'POST' });
    assert.equal(res.status, 202);
    const body = await res.json();
    assert.equal(body.status, 'accepted');
  });

  it('POST /play/event/<valid> returns 202', async () => {
    const res = await fetchUrl(`http://127.0.0.1:${PORT}/play/event/error`, {
      method: 'POST',
    });
    assert.equal(res.status, 202);
    const body = await res.json();
    assert.equal(body.event, 'error');
  });

  it('POST /play/event/<invalid> returns 400 with valid list', async () => {
    const res = await fetchUrl(`http://127.0.0.1:${PORT}/play/event/bogus`, {
      method: 'POST',
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(Array.isArray(body.valid));
    assert.ok(body.valid.includes('error'));
  });

  it('GET /unknown-route returns 404', async () => {
    const res = await fetchUrl(`http://127.0.0.1:${PORT}/nope`);
    assert.equal(res.status, 404);
  });
});

describe('pingthings serve — non-localhost requires --token', () => {
  it('exits with error when binding non-localhost without token', async () => {
    const proc = spawn(
      'node',
      [CLI, 'serve', '--port', String(PORT + 1), '--host', '0.0.0.0'],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let stderr = '';
    proc.stderr.on('data', d => (stderr += d.toString()));
    const code = await new Promise(resolve => proc.on('exit', resolve));
    assert.notEqual(code, 0);
    assert.match(stderr, /token/i);
  });
});

describe('pingthings serve — token auth', () => {
  let proc;
  const tokenPort = PORT + 2;

  before(async () => {
    proc = spawn(
      'node',
      [CLI, 'serve', '--port', String(tokenPort), '--token', TOKEN],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    await waitForListening(proc);
  });

  after(() => {
    if (proc && !proc.killed) proc.kill('SIGTERM');
  });

  it('rejects requests without token (401)', async () => {
    const res = await fetchUrl(`http://127.0.0.1:${tokenPort}/healthz`);
    assert.equal(res.status, 401);
  });

  it('accepts requests with valid token', async () => {
    const res = await fetchUrl(`http://127.0.0.1:${tokenPort}/healthz`, {
      headers: { 'X-Pingthings-Token': TOKEN },
    });
    assert.equal(res.status, 200);
  });
});
