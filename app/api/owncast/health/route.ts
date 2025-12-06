// app/api/owncast/health/route.ts
import { NextResponse } from 'next/server';

const DEFAULT_POLL_TIMEOUT_MS = 5000;

type OwncastHealthResponse = {
  online: boolean;
  version?: string;
  viewerCount?: number;
  updatedAt: string;
  raw?: unknown;
  error?: string;
};

export async function GET() {
  const baseUrl = process.env.OWNCAST_URL;

  if (!baseUrl) {
    const body: OwncastHealthResponse = {
      online: false,
      updatedAt: new Date().toISOString(),
      error: 'OWNCAST_URL is not configured in environment variables.',
    };
    return NextResponse.json(body, { status: 500 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_POLL_TIMEOUT_MS);

  try {
    // 🔧 Adjust these paths to your Owncast setup if needed
    const healthRes = await fetch(`${baseUrl}/api/health`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!healthRes.ok) {
      const body: OwncastHealthResponse = {
        online: false,
        updatedAt: new Date().toISOString(),
        error: `Owncast health responded with status ${healthRes.status}`,
      };
      return NextResponse.json(body, { status: 502 });
    }

    const healthJson = (await healthRes.json()) as any;

    // Optional: derive viewer count from another endpoint or property
    const viewerCount =
      typeof healthJson?.viewerCount === 'number'
        ? healthJson.viewerCount
        : undefined;

    const payload: OwncastHealthResponse = {
      online: Boolean(healthJson?.online ?? true),
      version: healthJson?.version ?? healthJson?.serverVersion,
      viewerCount,
      updatedAt: new Date().toISOString(),
      raw: healthJson,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: any) {
    const body: OwncastHealthResponse = {
      online: false,
      updatedAt: new Date().toISOString(),
      error: err?.name === 'AbortError'
        ? 'Owncast health request timed out.'
        : `Owncast health request failed: ${String(err?.message ?? err)}`,
    };
    return NextResponse.json(body, { status: 504 });
  } finally {
    clearTimeout(timeout);
  }
}