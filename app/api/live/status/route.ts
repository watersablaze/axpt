import { NextResponse } from 'next/server';
import { fetchOwncastStatus } from '@/lib/live/owncastClient';

export async function GET() {
  try {
    const status = await fetchOwncastStatus();

    const payload = {
      online: Boolean(status.online),
      viewers: status.viewerCount ?? 0,
      peakViewers:
        status.sessionPeakViewerCount ??
        status.overallPeakViewerCount ??
        status.viewerCount ??
        0,
      bitrateKbps: status.broadcaster?.bitrate ?? null,
      ingestHealthy: Boolean(status.online),
      uptimeSeconds: null,
      error: null,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: any) {
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