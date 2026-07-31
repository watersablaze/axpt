import type {
  ExecutableTrancheId,
  TreasuryEventId,
  TreasuryExecutionId,
  TreasuryExecutionPlanId,
  TreasuryTransferId,
} from "../../shared/identifiers";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type { PersistedNewTreasuryExecution } from "../../executions/persistence/contracts";

import type { PersistedTreasuryExecutionPlanTransition } from "../persistence/contracts";

import type { ExecutableTrancheBoundToExecutionPayload } from "../events";

export type InstantiateTreasuryExecutionFromEligibleTrancheDurably = Readonly<{
  transferId: TreasuryTransferId;

  planId: TreasuryExecutionPlanId;

  trancheId: ExecutableTrancheId;

  executionId: TreasuryExecutionId;

  executionReference: string;

  executionCreatedEventId: TreasuryEventId;

  trancheBoundEventId: TreasuryEventId;

  context: TreasuryCommandContext;
}>;

export type PersistedTreasuryExecutionInstantiation = Readonly<{
  execution: PersistedNewTreasuryExecution;

  plan: PersistedTreasuryExecutionPlanTransition<ExecutableTrancheBoundToExecutionPayload>;
}>;
