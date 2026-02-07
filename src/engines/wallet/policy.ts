import { WalletError } from './errors';
import type { Currency } from './types';

export type WalletRole = 'USER' | 'PARTNER' | 'ELDER';

export type WalletPolicyContext = {
  fromUserId: string;
  toUserId: string;
  tokenType: Currency;
  amount: number;
  role: WalletRole;
  // room for future:
  // dailyVolume?: number;
  // partnerTier?: string;
};

export function assertWalletPolicy(ctx: WalletPolicyContext) {
  // Global hard ceiling (safety rail)
  if (ctx.amount > 1_000_000) {
    throw new WalletError('POLICY_LIMIT', 'Transfer exceeds global max', 400);
  }

  // Tiered limits (v0)
  if (ctx.role === 'USER' && ctx.amount > 10_000) {
    throw new WalletError('POLICY_LIMIT', 'User transfer limit exceeded', 400);
  }

  if (ctx.role === 'PARTNER' && ctx.amount > 100_000) {
    throw new WalletError('POLICY_LIMIT', 'Partner transfer limit exceeded', 400);
  }

  // Elders can exceed (still capped by global safety rail)
}