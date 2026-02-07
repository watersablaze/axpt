import jwt from 'jsonwebtoken';

const SECRET = process.env.AXPT_PUBLIC_TOKEN_SECRET!;

type PortalTokenPayload = {
  caseId: string;
  role: 'SELLER' | 'BUYER';
  surface: 'PORTAL';
  iat: number;
  exp: number;
};

export function verifyPublicToken(token: string): PortalTokenPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET) as PortalTokenPayload;

    if (!decoded.caseId || !decoded.role || decoded.surface !== 'PORTAL') {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}