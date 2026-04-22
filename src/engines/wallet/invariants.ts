import { Balance } from './types';

export function assertValidBalance(balance: Balance) {
  if (balance.amountBaseUnits < 0n) {
    throw new Error('Invariant violation: negative balance');
  }
}
