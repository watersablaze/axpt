import type { OwncastHealth, ViewerAnalyticsPoint } from './owncastTypes';

const DEFAULT_TIMEOUT = 6000;

function withTimeout<T>(promise: Promise<T>, ms = DEFAULT_TIMEOUT): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);

  return new Promise((resolve, reject) => {
    promise
      .then((res) => {
        clearTimeout(timeout);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timeout);
        reject(err);
      });
  });
}

/* -------------------------------------------------
   OWNCAST HEALTH — from our Next.js proxy
-------------------------------------------------- */

export async function fetchOwncastHealth(): Promise<OwncastHealth> {
  try {
    const res = await withTimeout(fetch('/api/owncast/health'));

    if (!res.ok) {
      return {
        online: false,
        updatedAt: new Date().toISOString(),
        error: `HTTP ${res.status}`,
      };
    }

    return (await res.json()) as OwncastHealth;
  } catch (err: any) {
    return {
      online: false,
      updatedAt: new Date().toISOString(),
      error:
        err?.name === 'AbortError'
          ? 'Health check timed out.'
          : `Request failed: ${String(err.message || err)}`,
    };
  }
}

/* -------------------------------------------------
   VIEWER TIMESERIES (analytics)
-------------------------------------------------- */

export async function fetchViewerTimeSeries(): Promise<ViewerAnalyticsPoint[]> {
  try {
    const res = await withTimeout(fetch('/api/owncast/stats'));

    if (!res.ok) return [];

    const raw = (await res.json()) as any[];

    return raw.map((entry) => ({
      timestamp: entry.timestamp,
      viewers: entry.viewers ?? 0,
    }));
  } catch {
    return [];
  }
}

/* -------------------------------------------------
   OWNCAST STATUS — real-time admin metrics
-------------------------------------------------- */

export interface OwncastStatusResponse {
  online: boolean;
  viewerCount: number;
  sessionPeakViewerCount?: number;
  overallPeakViewerCount?: number;
  broadcaster?: {
    viewerCount?: number;
    bitrate?: number;
    bitrateKbps?: number;
  };
}

export async function fetchOwncastStatus(): Promise<OwncastStatusResponse> {
  const BASE =
    process.env.OWNCAST_BASE_URL || 'https://live.axpt.io';

  const res = await withTimeout(
    fetch(`${BASE}/api/status`, { cache: 'no-store' })
  );

  if (!res.ok) {
    throw new Error(`Owncast status HTTP ${res.status}`);
  }

  return res.json();
}
