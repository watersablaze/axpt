export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const SECRET = process.env.AXPT_PUBLIC_TOKEN_SECRET!;

export async function POST(req: Request) {
  const body = await req.json();

  const { caseId, role } = body;

  if (!caseId || !role) {
    return NextResponse.json(
      { ok: false, error: 'caseId and role required' },
      { status: 400 }
    );
  }

  // Payload intentionally minimal
  const payload = {
    caseId,
    role, // 'SELLER' | 'BUYER'
    surface: 'PORTAL',
  };

  const token = jwt.sign(payload, SECRET, {
    expiresIn: '7d', // adjust later
  });

  return NextResponse.json({
    ok: true,
    token,
    url: `http://localhost:3000/portal/${token}`,
  });
}