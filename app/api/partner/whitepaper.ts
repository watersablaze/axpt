// app/api/partner/whitepaper.ts
import { NextResponse } from 'next/server';
import { verifyTokenSignature } from '@/lib/tokenUtils';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const signature = searchParams.get('signature');

  if (!token || !signature) {
    return NextResponse.json({ error: 'Missing token or signature.' }, { status: 400 });
  }

  const isValid = verifyTokenSignature(token, signature);

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid token or signature.' }, { status: 403 });
  }

  const filePath = './public/pdf/whitepaper.pdf';
  const fileBuffer = await fetch(filePath).then(res => res.arrayBuffer());

  return new Response(Buffer.from(fileBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="AXPT_Whitepaper.pdf"'
    }
  });
}