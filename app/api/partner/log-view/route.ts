import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { verifyToken, decodeToken } from '@/lib/token';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, route = '/partner/whitepaper', source = 'manual', userAgent } = body;

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token is required' }), { status: 400 });
    }

    // Attempt token verification
    const { valid, payload } = await verifyToken(token);

    // Decode as backup for logs even if verification fails
    const decoded = await decodeToken(token);

    // Hash token for log integrity
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Create structured log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      route,
      source,
      tokenHash,
      partner: payload?.partner ?? decoded?.partner ?? 'unknown',
      tier: payload?.tier ?? decoded?.tier ?? 'unknown',
      docs: payload?.docs ?? decoded?.docs ?? [],
      iat: payload?.iat ?? decoded?.iat ?? null,
      userAgent,
      verified: valid,
    };

    // Ensure logs directory exists
    const logsDir = path.join(process.cwd(), 'logs');
    fs.mkdirSync(logsDir, { recursive: true });

    // Append entry to .jsonl file
    const logPath = path.join(logsDir, 'partner-view-logs.jsonl');
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('🛑 Logging failed:', error);
    return new Response(JSON.stringify({ error: 'Logging failed' }), { status: 500 });
  }
}