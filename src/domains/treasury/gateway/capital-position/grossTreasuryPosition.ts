import type { ProgramAccountId } from "../shared/identifiers";

import type { CurrencyCode, TreasuryMoney } from "../shared/money";

export type GrossTreasuryPosition = Readonly<{
  programAccountId: ProgramAccountId;

  currency: CurrencyCode;

  grossAmount: TreasuryMoney;

  recognizedAmount: TreasuryMoney;

  confirmedOutboundAmount: TreasuryMoney;

  contributingReceiptIds: readonly string[];

  contributingExecutionIds: readonly string[];
}>;
