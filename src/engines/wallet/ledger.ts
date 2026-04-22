import { Balance } from './types';
import { assertValidBalance } from './invariants';

export function credit(balance: Balance, amountBaseUnits: bigint): Balance {
  const next = {
    ...balance,
    amountBaseUnits: balance.amountBaseUnits + amountBaseUnits,
  };
  assertValidBalance(next);
  return next;
}

export function debit(balance: Balance, amountBaseUnits: bigint): Balance {
  const next = {
    ...balance,
    amountBaseUnits: balance.amountBaseUnits - amountBaseUnits,
  };
  assertValidBalance(next);
  return next;
}
