import { WalletError } from './errors';
import { getAsset, type AssetCode } from '@/lib/assets/registry';
import { parseDisplayToBaseUnits } from '@/lib/money/baseUnits';

export type WalletRole = 'USER' | 'PARTNER' | 'ELDER';

export type WalletPolicyContext = {
  fromUserId: string;
  toUserId: string;
  assetCode: AssetCode;
  amountBaseUnits: bigint;
  role: WalletRole;
  // room for future:
  // dailyVolume?: number;
  // partnerTier?: string;
};

export function assertWalletPolicy(ctx: WalletPolicyContext) {
  const asset = getAsset(ctx.assetCode);
  const globalLimit = parseDisplayToBaseUnits('1000000', asset.decimals);
  const userLimit = parseDisplayToBaseUnits('10000', asset.decimals);
  const partnerLimit = parseDisplayToBaseUnits('100000', asset.decimals);

  // Global hard ceiling (safety rail)
  if (ctx.amountBaseUnits > globalLimit) {
    throw new WalletError('POLICY_LIMIT', 'Transfer exceeds global max', 400);
  }

  // Tiered limits (v0)
  if (ctx.role === 'USER' && ctx.amountBaseUnits > userLimit) {
    throw new WalletError('POLICY_LIMIT', 'User transfer limit exceeded', 400);
  }

  if (ctx.role === 'PARTNER' && ctx.amountBaseUnits > partnerLimit) {
    throw new WalletError('POLICY_LIMIT', 'Partner transfer limit exceeded', 400);
  }

  // Elders can exceed (still capped by global safety rail)
}
