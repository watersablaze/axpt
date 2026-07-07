import type {
  ExecutableTrancheId,
  TreasuryExecutionPlanId,
  TreasuryTransferId,
} from "../shared/identifiers";

import type { TreasuryCommand } from "../shared/commandContext";

export type CreateTreasuryExecutionFromEligibleTranche = TreasuryCommand<{
  transferId: TreasuryTransferId;

  planId: TreasuryExecutionPlanId;

  trancheId: ExecutableTrancheId;
}>;
