export type DecimalString = string;

export type CurrencyCode = string;

export type TreasuryMoney = Readonly<{
  amount: DecimalString;

  currency: CurrencyCode;
}>;
