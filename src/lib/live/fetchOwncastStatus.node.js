// src/lib/live/fetchOwncastStatus.node.js
// Node-only Owncast status helper for server.js
// Supports node-fetch v3 (ESM) via dynamic import()

async function getFetch() {
  // load ESM node-fetch dynamically
  const mod = await import('node-fetch');
  return mod.default;
}

function getOwncastBaseUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_OWNCAST_URL ||
    process.env.OWNCAST_URL ||
    'https://live.axpt.io';

  return envUrl.replace(/\/+$/, '');
}

async function fetchOwncastStatus() {
  const fetch = await getFetch();
  const base = getOwncastBaseUrl();
  const url = `${base}/api/status`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();

    return {
      online: !!json.online,
      viewerCount:
        json.viewerCount ??
        json.viewers ??
        json.viewersConnected ??
        0,
      peakViewers:
        json.peakViewerCount ??
        json.peakViewers ??
        json.highestViewerCount ??
        0,
      bitrateKbps:
        json.bitrateKbps ??
        json.bitrate ??
        null,
      ingestHealthy: true,
      uptimeSeconds: json.uptime ?? null,
      raw: json,
    };
  } catch (err) {
    console.error('[WS] Owncast Fetch Error (node helper):', err);

    return {
      online: false,
      viewerCount: 0,
      peakViewers: 0,
      bitrateKbps: null,
      ingestHealthy: false,
      uptimeSeconds: null,
      error: err.message || 'Owncast fetch failed',
      raw: null,
    };
  }
}

module.exports = { fetchOwncastStatus };