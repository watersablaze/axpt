import type { AssetCode } from '@/lib/assets/registry';
import { TRANSACTION_TYPES } from '@/domains/wallet/constants/transactionTypes';

export type Currency = AssetCode;

export interface Balance {
  assetCode: AssetCode;
  amountBaseUnits: bigint;
}

export interface WalletTransaction {
  assetCode: AssetCode;
  amountBaseUnits: bigint;
  direction:
    | typeof TRANSACTION_TYPES.DEBIT
    | typeof TRANSACTION_TYPES.CREDIT;
}
