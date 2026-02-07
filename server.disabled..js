// server.js
const http = require('http');
const next = require('next');
const { WebSocketServer } = require('ws');

// Node-only Owncast helper (SAFE to import, not execute)
const {
  fetchOwncastStatus,
} = require('./src/lib/live/fetchOwncastStatus.node.js');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

console.log('🟡 server.js loaded');

async function startServer() {
  try {
    console.log('🟡 Preparing Next.js...');
    await app.prepare();
    console.log('🟢 Next.js prepared');

    const server = http.createServer((req, res) => {
      handle(req, res);
    });

    // WebSocket server (mounted AFTER HTTP exists)
    const wss = new WebSocketServer({
      server,
      path: '/api/live/ws',
    });

    let heartbeatInterval = null;
    let owncastInterval = null;

    function startIntervals() {
      if (!heartbeatInterval) {
        heartbeatInterval = setInterval(async () => {
          try {
            const res = await fetch('http://localhost:3000/api/live/status');
            const json = await res.json();

            const msg = JSON.stringify({
              type: 'live:status',
              payload: json,
            });

            wss.clients.forEach(client => {
              if (client.readyState === 1) client.send(msg);
            });
          } catch (err) {
            const msg = JSON.stringify({
              type: 'error',
              payload: {
                message: err?.message || 'status fetch failed',
              },
            });
            wss.clients.forEach(client => {
              if (client.readyState === 1) client.send(msg);
            });
          }
        }, 5000);
      }

      if (!owncastInterval) {
        owncastInterval = setInterval(async () => {
          try {
            const status = await fetchOwncastStatus();
            const msg = JSON.stringify({
              type: 'livestatus',
              payload: status,
            });

            wss.clients.forEach(client => {
              if (client.readyState === 1) client.send(msg);
            });
          } catch (err) {
            console.error('[Owncast WS error]', err);
          }
        }, 2000);
      }
    }

    function stopIntervalsIfNoClients() {
      if (wss.clients.size === 0) {
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        if (owncastInterval) {
          clearInterval(owncastInterval);
          owncastInterval = null;
        }
      }
    }

    wss.on('connection', socket => {
      console.log('[WS] Client connected to AXPT LiveBridge');

      socket.send(
        JSON.stringify({
          type: 'info',
          payload: {
            message: 'AXPT WS connected (Node server)',
          },
        })
      );

      startIntervals();

      socket.on('close', () => {
        console.log('[WS] Client disconnected');
        stopIntervalsIfNoClients();
      });
    });

    server.listen(3000, () => {
      console.log('\n🚀 AXPT Dev Server running at http://localhost:3000\n');
    });

  } catch (err) {
    console.error('🔴 AXPT server failed to start', err);
    process.exit(1);
  }
}

startServer();