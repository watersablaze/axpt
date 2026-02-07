// src/lib/axpt/devIssueToken.ts
import jwt from 'jsonwebtoken';

export function devIssueToken(payload: {
  caseId: string;
  role: 'SELLER' | 'BUYER';
}) {
  return jwt.sign(payload, process.env.AXPT_PUBLIC_TOKEN_SECRET!, {
    expiresIn: '7d',
  });
}