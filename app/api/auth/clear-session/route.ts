import { NextRequest, NextResponse } from 'next/server';

// 🔒 Session clearing logic has been archived.
// This route currently responds with a safe placeholder.

export async function POST(_req: NextRequest) {
  try {
    // No-op: session logic not active
    // Previously: await clearSessionCookie();

    return NextResponse.json({
      success: true,
      message: '[AXPT] Session clearing placeholder active. No action performed.',
    });
  } catch (err) {
    console.error('[AXPT] ❌ Failed to execute placeholder session clear:', err);
    return NextResponse.json(
      { success: false, error: 'Failed placeholder session clear.' },
      { status: 500 }
    );
  }
}