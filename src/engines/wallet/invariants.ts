import { Balance } from './types';

export function assertValidBalance(balance: Balance) {
  if (balance.amount < 0) {
    throw new Error('Invariant violation: negative balance');
  }

  if (!Number.isFinite(balance.amount)) {
    throw new Error('Invariant violation: non-finite balance');
  }
}