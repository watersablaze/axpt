// 📁 src/lib/token/tokenSchema.ts

import { z } from 'zod';

// 🎖️ Canonical tiers
export const tokenTierEnum = z.enum([
  'Investor',
  'Partner',
  'Farmer',
  'Merchant',
  'Nomad',
  'Board',
]);

// 📄 Canonical doc slugs (MUST match filenames in public/docs/AXPT/)
export const allowedDocEnum = z.enum(['whitepaper', 'hemp', 'chinje']);

// ✅ Primary schema for signed tokens
export const TokenPayloadSchema = z.object({
  userId: z.string().min(1, 'Missing userId'),
  partner: z.string().min(1, 'Missing partner slug'),
  tier: tokenTierEnum,
  docs: z.array(allowedDocEnum),
  email: z.string().email().optional(),

  displayName: z.string().optional(),
  greeting: z.string().optional(),
  popupMessage: z.string().optional(),

  iat: z.number().optional(),
  exp: z.number().optional(),
});

// ✅ Safe variant with iat/exp defaulted
export const TokenPayloadSafeSchema = TokenPayloadSchema.extend({
  iat: z.number().default(() => Math.floor(Date.now() / 1000)),
  exp: z.number().default(() => Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30),
});

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;
export type TokenPayloadSafe = z.infer<typeof TokenPayloadSafeSchema>;
export type AllowedDoc = z.infer<typeof allowedDocEnum>; // ✅ Add this