import type { Tier } from '@/config/tiers/tiers';

/**
 * Represents a simplified, decoded token summary.
 * Often used in UI displays or logs.
 */
export interface Token {
  partner: string;
  tier: string;
  docs: string[];
  issuedAt: string;
}

/**
 * Full structure of the JWT payload.
 * Mirrors TokenPayloadSchema from lib/token/tokenSchema.ts.
 */
export interface TokenPayload {
  userId: string; // ✅ REQUIRED by renew and downstream logic
  partner: string;
  tier: Tier | string;
  docs: string[];
  displayName?: string;
  greeting?: string;
  popupMessage?: string;
  iat?: number; // Optional: set via signToken
  exp?: number; // Optional: set via signToken
  [key: string]: unknown; // Allows sub, aud, jti, etc.
}