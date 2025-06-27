import jwt, { JwtPayload } from 'jsonwebtoken';

const rawSecret = process.env.JWT_SECRET;

if (!rawSecret) {
  throw new Error('JWT_SECRET not set in environment');
}

const JWT_SECRET = rawSecret as string;

export function signJwt(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// 🔐 Stronger typing for returned JWT payload
export function verifyJwt(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Explicitly narrow type
    return typeof decoded === 'object' ? (decoded as JwtPayload) : null;
  } catch {
    return null;
  }
}