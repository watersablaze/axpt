// src/lib/live/owncastClientStream.ts

export async function fetchStreamStatus() {
  try {
    const res = await fetch('/api/live/status', { cache: 'no-store' });

    if (!res.ok) {
      return {
        online: false,
        viewers: 0,
        peakViewers: 0,
        bitrateKbps: null,
        ingestHealthy: false,
        error: `HTTP ${res.status}`,
      };
    }

    return await res.json();
  } catch (err: any) {
    return {
      online: false,
      viewers: 0,
      peakViewers: 0,
      bitrateKbps: null,
      ingestHealthy: false,
      error: err?.message || 'Network error',
    };
  }
}