import { NextResponse } from 'next/server';
import { fetchOwncastStatus } from '@/lib/live/owncastClient';

export async function GET() {
  try {
    const status = await fetchOwncastStatus();

    // --- Normalize raw Owncast telemetry ---
    const online = Boolean(status?.online);

    const viewers =
      status?.viewerCount ??
      status?.broadcaster?.viewerCount ??
      0;

    const peakViewers =
      status?.sessionPeakViewerCount ??
      status?.overallPeakViewerCount ??
      viewers ??
      0;

    const bitrateKbps =
      status?.broadcaster?.bitrate ??
      status?.broadcaster?.bitrateKbps ??
      null;

    return NextResponse.json(
      {
        source: 'owncast',
        telemetry: {
          online,
          viewers,
          peakViewers,
          bitrateKbps,
          ingestHealthy: online,
          uptimeSeconds: null, // not exposed by Owncast
        },
        error: null,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        source: 'owncast',
        telemetry: {
          online: false,
          viewers: 0,
          peakViewers: 0,
          bitrateKbps: null,
          ingestHealthy: false,
          uptimeSeconds: null,
        },
        error: err?.message ?? 'Failed to reach Owncast',
      },
      { status: 200 } // graceful degradation
    );
  }
}