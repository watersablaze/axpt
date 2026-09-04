import type { ProgramAccountId } from "../shared/identifiers";

import type { CurrencyCode, TreasuryMoney } from "../shared/money";

export type RecognizedCapitalPosition = Readonly<{
  programAccountId: ProgramAccountId;

  currency: CurrencyCode;

  recognizedAmount: TreasuryMoney;

  contributingReceiptIds: readonly string[];
}>;
