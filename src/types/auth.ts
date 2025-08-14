// types/auth.ts

export type SessionPayload = {
  userId: string;
  tier: 'Investor' | 'Partner' | 'Farmer' | 'Merchant' | 'Nomad' | 'Board';
  displayName: string;
  docs: ('whitepaper' | 'hemp' | 'chinje')[];
  popupMessage: string;
  greeting: string;
  partner: string;
  iat: number;
  exp: number;
  email?: string; // Optional
};