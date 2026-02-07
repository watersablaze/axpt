import { Balance } from './types';
import { assertValidBalance } from './invariants';

export function credit(balance: Balance, amount: number): Balance {
  const next = { ...balance, amount: balance.amount + amount };
  assertValidBalance(next);
  return next;
}

export function debit(balance: Balance, amount: number): Balance {
  const next = { ...balance, amount: balance.amount - amount };
  assertValidBalance(next);
  return next;
}