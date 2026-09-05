import type { ProgramAccountId } from "../shared/identifiers";

import type { CurrencyCode, TreasuryMoney } from "../shared/money";

export type ConfirmedOutboundCapitalPosition = Readonly<{
  programAccountId: ProgramAccountId;

  currency: CurrencyCode;

  confirmedOutboundAmount: TreasuryMoney;

  contributingExecutionIds: readonly string[];
}>;
