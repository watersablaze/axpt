import type { AssetCode } from '@/lib/assets/registry';
import { TRANSACTION_TYPES } from '../wallet/constants/transactionTypes'

export type Currency = AssetCode;

export interface Balance {
  assetCode: AssetCode;
  amountBaseUnits: bigint;
}

export interface WalletTransaction {
  assetCode: AssetCode;
  amountBaseUnits: bigint;
  direction: type: TRANSACTION_TYPES.DEBIT | type: TRANSACTION_TYPES.CREDIT';
}
