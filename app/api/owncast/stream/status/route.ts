// app/api/owncast/stream/status/route.ts
import { NextResponse } from 'next/server';
import { withTimeout } from '@/lib/utils/withTimeout';

export async function GET() {
  const base = process.env.OWNCAST_URL;
  if (!base)
    return NextResponse.json({ online: false, error: 'OWNCAST_URL missing' });

  try {
    const res = await withTimeout(fetch(`${base}/api/status`), 5000);

    if (!res.ok)
      return NextResponse.json({ online: false, error: 'Bad status response' });

    const json = await res.json();

    return NextResponse.json({
      online: Boolean(json.online),
      startedAt: json.startedAt ?? null,
      uptimeSeconds: json.uptimeSeconds,
      viewerCount: json.viewerCount,
      bitrateKbps: json.bitrate?.currentKbps,
      droppedFrames: json.bitrate?.droppedFrames,
      fps: json.video?.fps,
      resolution: `${json.video?.width}x${json.video?.height}`,
      lastDisconnected: json.lastDisconnect ?? null,
    });
  } catch (e) {
    return NextResponse.json({ online: false, error: String(e) });
  }
}