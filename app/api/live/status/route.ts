import { NextResponse } from 'next/server';
import { fetchOwncastStatus } from '@/lib/live/owncastClient';

export async function GET() {
  try {
    const status = await fetchOwncastStatus();

    // --- Normalize fields from Owncast ---
    const isOnline = Boolean(status?.online);
    const currentViewers =
      status?.viewerCount ??
      status?.broadcaster?.viewerCount ??
      0;

    const peakViewers =
      status?.sessionPeakViewerCount ??
      status?.overallPeakViewerCount ??
      currentViewers ??
      0;

    const bitrateKbps =
      status?.broadcaster?.bitrate ??
      status?.broadcaster?.bitrateKbps ??
      null;

    // --- Construct API response ---
    const payload = {
      online: isOnline,
      viewers: currentViewers,
      peakViewers,
      bitrateKbps,

      // Treat ingest health as "online"
      ingestHealthy: isOnline,

      // Owncast does not expose uptime, so null for now
      uptimeSeconds: null,

      error: null,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: any) {
    // Graceful degradation
    return NextResponse.json(
      {
        online: false,
        viewers: 0,
        peakViewers: 0,
        bitrateKbps: null,
        ingestHealthy: false,
        uptimeSeconds: null,
        error: err?.message ?? 'Failed to reach Owncast',
      },
      { status: 200 },
    );
  }
}