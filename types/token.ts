// File: app/types/token.ts

export interface Token {
  partner: string;
  tier: string;
  docs: string[];
  issuedAt: string;
}

export interface TokenPayload {
  partner: string;
  tier: 'Investor' | 'Board' | 'Partner' | 'Farmer' | 'Merchant' | 'Nomad';
  docs: string[];
  displayName?: string;
  greeting?: string;
  iat: number;
  exp?: number;

  // Add this to satisfy SignJWT
  [key: string]: unknown;
}

