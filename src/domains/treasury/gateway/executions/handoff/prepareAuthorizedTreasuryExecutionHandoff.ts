import { TREASURY_EXECUTION_STATUS } from "../status";

import { assertPositiveDecimal } from "../../shared/decimalAmount";

import type { TreasuryExecution } from "../contracts";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type {
  TreasuryApprovalId,
  TreasuryExecutionHandoffId,
} from "../../shared/identifiers";

import type { TreasuryExecutionHandoff } from "./contracts";

export function prepareAuthorizedTreasuryExecutionHandoff(params: {
  handoffId: TreasuryExecutionHandoffId;

  execution: TreasuryExecution;

  approvalIds: readonly TreasuryApprovalId[];

  context: TreasuryCommandContext;
}): TreasuryExecutionHandoff {
  const { handoffId, execution, approvalIds, context } = params;

  if (execution.status !== TREASURY_EXECUTION_STATUS.AUTHORIZED) {
    throw new Error(
      `[TREASURY_EXECUTION_HANDOFF_NOT_AUTHORIZED] ${execution.status}`,
    );
  }

  if (!execution.authorizedAt) {
    throw new Error(
      "[TREASURY_EXECUTION_HANDOFF_AUTHORIZATION_TIMESTAMP_REQUIRED]",
    );
  }

  if (approvalIds.length === 0) {
    throw new Error("[TREASURY_EXECUTION_HANDOFF_APPROVAL_EVIDENCE_REQUIRED]");
  }

  assertPositiveDecimal(execution.amount.amount);

  return {
    id: handoffId,

    executionId: execution.id,

    executionVersion: execution.metadata.version,

    programId: execution.programId,

    allocationId: execution.allocationId,

    instructionId: execution.instructionId,

    kind: execution.kind,

    beneficiaryProfileId: execution.beneficiaryProfileId,

    settlementEndpointId: execution.settlementEndpointId,

    amount: execution.amount,

    purpose: execution.purpose,

    authorization: {
      approvalIds,

      authorizedAt: execution.authorizedAt,
    },

    context: {
      requestedByActorId: context.actorId,

      correlationId: context.correlationId,

      causationId: context.causationId,

      idempotencyKey: context.idempotencyKey,

      requestedAt: context.requestedAt,
    },
  };
}
