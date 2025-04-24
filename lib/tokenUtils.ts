import crypto from 'crypto';

const TOKEN_SECRET = process.env.TOKEN_SECRET || 'your-secret-key';

export function generateTokenSignature(token: string): string {
  return crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(token)
    .digest('hex');
}

export function verifyTokenSignature(token: string, signature: string): boolean {
  const expectedSignature = generateTokenSignature(token);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}