import { Balance, WalletTransaction } from './types';
import { credit, debit } from './ledger';

export function executeTransaction(
  balance: Balance,
  tx: WalletTransaction
): Balance {
  if (tx.currency !== balance.currency) {
    throw new Error('Currency mismatch');
  }

  return tx.direction === 'CREDIT'
    ? credit(balance, tx.amount)
    : debit(balance, tx.amount);
}