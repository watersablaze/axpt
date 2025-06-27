import crypto from 'crypto';
import { TokenPayload } from '@/types/token';

function getPartnerSecret(): string {
  const secret = process.env.PARTNER_SECRET;
  if (!secret) throw new Error('❌ Missing PARTNER_SECRET in environment');
  return secret;
}

// ✅ Generate a signed token with base64url + HMAC SHA256
export function generateSignedToken(payload: TokenPayload): string {
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', getPartnerSecret()).update(base64Payload).digest('hex');
  return `${base64Payload}:${signature}`;
}

// ✅ Decode the token body (unsafe, no signature check)
export function decodeToken(token: string): TokenPayload | null {
  try {
    const [base64Payload] = token.split(':');
    const json = Buffer.from(base64Payload, 'base64url').toString();
    return JSON.parse(json);
  } catch (err) {
    console.error('[decodeToken] Failed:', err);
    return null;
  }
}

// ✅ Verify token signature (only)
export function verifyTokenSignature(token: string): boolean {
  const [base64Payload, signature] = token.split(':');
  if (!base64Payload || !signature) return false;

  const expected = crypto.createHmac('sha256', getPartnerSecret()).update(base64Payload).digest('hex');
  return signature === expected;
}

// ✅ Check if token is older than 7 days
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded?.iat) return true;

  const ageLimitMs = 7 * 24 * 60 * 60 * 1000;
  const issuedAtMs = decoded.iat * 1000;
  return Date.now() > issuedAtMs + ageLimitMs;
}

// ✅ Full token verifier: signature + age
export function verifyToken(token: string): TokenPayload | null {
  if (!verifyTokenSignature(token)) return null;
  if (isTokenExpired(token)) return null;
  return decodeToken(token);
}