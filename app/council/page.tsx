import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import crypto from 'crypto';
import CouncilChamber from './CouncilChamber';

function verifySession(token: string | undefined) {
  if (!token) return null;

  const secret = process.env.COUNCIL_SESSION_SECRET;
  if (!secret) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const data = `${header}.${body}`;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64url');

  if (!crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )) return null;

  const payload = JSON.parse(Buffer.from(body, 'base64url').toString());

  if (!payload.exp || Date.now() > payload.exp) return null;

  return payload;
}

export default function CouncilPage() {
  const cookieStore = cookies();
  const session = cookieStore.get('axpt_council')?.value;

  const payload = verifySession(session);

  if (!payload) {
    redirect('/');
  }

  return <CouncilChamber session={payload} />;
}