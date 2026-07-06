import type { TreasuryTransferId } from "../shared/identifiers";

import type { TreasuryCommand } from "../shared/commandContext";

import type { TreasuryMoney } from "../shared/money";

import type { TransferCapacityConstraint } from "./contracts";

export type RecordTransferCapacityAssessment = TreasuryCommand<{
  transferId: TreasuryTransferId;

  requestedAmount: TreasuryMoney;

  constraints: readonly TransferCapacityConstraint[];

  assessedAt: Date;

  notes?: string;
}>;
