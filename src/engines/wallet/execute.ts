import { TRANSACTION_TYPES } from '@/domains/wallet/constants/transactionTypes';
import { Balance, WalletTransaction } from './types';
import { credit, debit } from './ledger';

export function executeTransaction(
  balance: Balance,
  tx: WalletTransaction
): Balance {
  if (tx.assetCode !== balance.assetCode) {
    throw new Error('Asset mismatch');
  }

  return tx.direction === TRANSACTION_TYPES.CREDIT
    ? credit(balance, tx.amountBaseUnits)
    : debit(balance, tx.amountBaseUnits);
}
