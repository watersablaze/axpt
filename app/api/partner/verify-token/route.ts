import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ success: false, message: 'Missing token.' }, { status: 400 });
  }

  const partnerTokens: Record<string, string> = {
    [process.env.NEXT_PUBLIC_QUEENDOM_COLLECTIVE_TOKEN!]: 'Queendom Collective',
    [process.env.NEXT_PUBLIC_RED_ROLLIN_TOKEN!]: 'Red Rollin Holdings',
    [process.env.NEXT_PUBLIC_LIMITECH_TOKEN!]: 'Limitech',
    [process.env.NEXT_PUBLIC_AXPT_ADMIN_TOKEN!]: 'AXPT Admin Access',
  };

  const partnerName = partnerTokens[token];

  if (partnerName) {
    return NextResponse.json({
      success: true,
      message: 'Token is valid.',
      partner: partnerName,
    });
  } else {
    return NextResponse.json({ success: false, message: 'Invalid token.' }, { status: 401 });
  }
}