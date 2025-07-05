// app/types/token.d.ts
export interface TokenPayload {
  partner: string;
  tier: 'Investor' | 'Board' | 'Partner' | 'Farmer' | 'Merchant' | 'Nomad';
  docs: string[];
  displayName?: string;
  greeting?: string;
  iat: number; // issued at timestamp
}