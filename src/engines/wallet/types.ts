export type Currency = 'AXG' | 'NMP' | 'USD';

export interface Balance {
  currency: Currency;
  amount: number;
}

export interface WalletTransaction {
  currency: Currency;
  amount: number;
  direction: 'DEBIT' | 'CREDIT';
}
