import type { ProgramAccountId } from "../shared/identifiers";

import type { CurrencyCode, TreasuryMoney } from "../shared/money";

export type CommittedCapitalPosition = Readonly<{
  programAccountId: ProgramAccountId;

  currency: CurrencyCode;

  committedAmount: TreasuryMoney;

  contributingAllocationIds: readonly string[];
}>;
