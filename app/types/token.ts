// File: app/types/token.ts

export interface Token {
  partner: string;
  tier: string;
  docs: string[];
  issuedAt: string;
}

export interface TokenPayload {
  partner: string;
  tier: 'Investor' | 'Board' | 'Partner' | 'Farmer' | 'Merchant' | 'Nomad'; // Updated
  docs: string[];
  iat: number; // Standard for token-based systems
  exp?: number;
}