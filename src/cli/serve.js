import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { VALID_EVENTS } from '../config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_BIN = join(__dirname, '..', '..', 'bin', 'pingthings.js');

function showHelp() {
  console.log(`
Usage: pingthings serve [--port N] [--host H] [--token T]

Start an on-demand HTTP server that lets external tools trigger
sound playback by POSTing to localhost. Useful for CI alerts,
GitHub Actions, deploy scripts, or any external system that
should ring pingthings.

Options:
  --port <N>    Port to listen on (default 9999).
  --host <H>    Bind address (default 127.0.0.1 — localhost only).
                Pass 0.0.0.0 to expose on the network; requires --token.
  --token <T>   Shared secret. Required for non-localhost binds. When
                set, callers must include "X-Pingthings-Token: <T>".
  --help, -h    Show this message.

Endpoints:
  GET  /healthz          Returns 200 OK with version info.
  POST /play             Plays a random sound from the active pack.
  POST /play/event/<e>   Plays a sound mapped to event <e>.
                         Valid events: ${VALID_EVENTS.join(', ')}.

Examples:
  pingthings serve
  pingthings serve --port 9000
  pingthings serve --host 0.0.0.0 --token mysecret

Then trigger from anywhere:
  curl -X POST http://localhost:9999/play
  curl -X POST http://localhost:9999/play/event/error
`);
}

function spawnPlay(args) {
  const child = spawn('node', [CLI_BIN, 'play', ...args], {
    detached: true,
    stdio: 'ignore',
  });
  child.on('error', () => {});
  child.unref();
}

export default async function serve(args) {
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  let port = 9999;
  let host = '127.0.0.1';
  let token = null;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--port' && args[i + 1]) {
      port = parseInt(args[++i], 10);
    } else if (a === '--host' && args[i + 1]) {
      host = args[++i];
    } else if (a === '--token' && args[i + 1]) {
      token = args[++i];
    }
  }

  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    console.error('--port must be 1–65535.');
    process.exit(1);
  }

  // Refuse to bind to non-localhost without a token. Defense against
  // accidental network exposure of an unauthenticated trigger.
  if (host !== '127.0.0.1' && host !== 'localhost' && !token) {
    console.error(
      'Refusing to bind to non-localhost without --token. Either bind to ' +
        '127.0.0.1 or pass --token <secret>.',
    );
    process.exit(1);
  }

  const server = createServer((req, res) => {
    // Token check (if configured)
    if (token) {
      const provided = req.headers['x-pingthings-token'];
      if (provided !== token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'invalid or missing token' }));
        return;
      }
    }

    if (req.method === 'GET' && req.url === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'pingthings' }));
      return;
    }

    if (req.method === 'POST' && req.url === '/play') {
      spawnPlay([]);
      res.writeHead(202, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'accepted', event: null }));
      return;
    }

    const eventMatch = req.url && req.url.match(/^\/play\/event\/(\w+)$/);
    if (req.method === 'POST' && eventMatch) {
      const event = eventMatch[1];
      if (!VALID_EVENTS.includes(event)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'invalid event',
            valid: VALID_EVENTS,
          }),
        );
        return;
      }
      spawnPlay(['--event', event]);
      res.writeHead(202, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'accepted', event }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found', url: req.url }));
  });

  server.on('error', err => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Try --port <other>.`);
    } else {
      console.error(`Server error: ${err.message}`);
    }
    process.exit(1);
  });

  server.listen(port, host, () => {
    const url = `http://${host}:${port}`;
    console.log(`pingthings serve listening on ${url}`);
    if (token) console.log('Token authentication: enabled');
    console.log('Endpoints:');
    console.log(`  GET  ${url}/healthz`);
    console.log(`  POST ${url}/play`);
    console.log(`  POST ${url}/play/event/<event>`);
    console.log('Ctrl+C to stop.');
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\nShutting down…');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 2000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
