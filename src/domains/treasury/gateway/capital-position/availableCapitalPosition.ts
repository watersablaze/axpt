import type { ProgramAccountId } from "../shared/identifiers";

import type { CurrencyCode, TreasuryMoney } from "../shared/money";

export type AvailableCapitalPosition = Readonly<{
  programAccountId: ProgramAccountId;

  currency: CurrencyCode;

  availableAmount: TreasuryMoney;

  grossAmount: TreasuryMoney;

  committedAmount: TreasuryMoney;

  contributingReceiptIds: readonly string[];

  contributingExecutionIds: readonly string[];

  contributingAllocationIds: readonly string[];
}>;
