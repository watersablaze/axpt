import { TREASURY_EVENT_TYPE } from "../events/eventType";

import type { TreasuryExecution } from "../executions/contracts";

import { TREASURY_EXECUTION_STATUS } from "../executions/status";

import type { TreasuryDomainResult } from "../shared/domainResult";

import type { BindExecutableTrancheToTreasuryExecution } from "./commands";

import type { TreasuryExecutionPlan } from "./contracts";

import type { ExecutableTrancheBoundToExecutionPayload } from "./events";

import {
  EXECUTABLE_TRANCHE_STATUS,
  TREASURY_EXECUTION_PLAN_STATUS,
} from "./status";

export function bindExecutableTrancheToTreasuryExecution(
  aggregate: TreasuryExecutionPlan,

  execution: TreasuryExecution,

  command: BindExecutableTrancheToTreasuryExecution,
): TreasuryDomainResult<
  TreasuryExecutionPlan,
  ExecutableTrancheBoundToExecutionPayload
> {
  if (command.payload.planId !== aggregate.id) {
    throw new Error(
      `[TREASURY_EXECUTION_PLAN_COMMAND_TARGET_MISMATCH] ${command.payload.planId} -> ${aggregate.id}`,
    );
  }

  if (command.payload.executionId !== execution.id) {
    throw new Error(
      `[EXECUTABLE_TRANCHE_EXECUTION_COMMAND_TARGET_MISMATCH] ${command.payload.executionId} -> ${execution.id}`,
    );
  }

  if (aggregate.status !== TREASURY_EXECUTION_PLAN_STATUS.RECORDED) {
    throw new Error(
      `[EXECUTABLE_TRANCHE_BINDING_PLAN_NOT_RECORDED] ${aggregate.status}`,
    );
  }

  if (execution.status !== TREASURY_EXECUTION_STATUS.CREATED) {
    throw new Error(
      `[EXECUTABLE_TRANCHE_BINDING_EXECUTION_NOT_CREATED] ${execution.status}`,
    );
  }

  const tranche = aggregate.tranches.find(
    (candidate) => candidate.id === command.payload.trancheId,
  );

  if (!tranche) {
    throw new Error(
      `[EXECUTABLE_TRANCHE_BINDING_TRANCHE_NOT_FOUND] ${command.payload.trancheId}`,
    );
  }

  if (tranche.status !== EXECUTABLE_TRANCHE_STATUS.ELIGIBLE) {
    throw new Error(
      `[EXECUTABLE_TRANCHE_BINDING_TRANCHE_NOT_ELIGIBLE] ${tranche.status}`,
    );
  }

  if (tranche.executionId) {
    throw new Error(
      `[EXECUTABLE_TRANCHE_BINDING_EXECUTION_ALREADY_BOUND] ${tranche.executionId}`,
    );
  }

  if (execution.allocationId !== tranche.allocationId) {
    throw new Error(
      `[EXECUTABLE_TRANCHE_BINDING_ALLOCATION_MISMATCH] ${execution.allocationId} -> ${tranche.allocationId}`,
    );
  }

  if (execution.instructionId !== tranche.instructionId) {
    throw new Error(
      `[EXECUTABLE_TRANCHE_BINDING_INSTRUCTION_MISMATCH] ${String(execution.instructionId)} -> ${String(tranche.instructionId)}`,
    );
  }

  if (execution.kind !== tranche.executionKind) {
    throw new Error(
      `[EXECUTABLE_TRANCHE_BINDING_KIND_MISMATCH] ${execution.kind} -> ${tranche.executionKind}`,
    );
  }

  if (execution.beneficiaryProfileId !== tranche.beneficiaryProfileId) {
    throw new Error(
      `[EXECUTABLE_TRANCHE_BINDING_BENEFICIARY_MISMATCH] ${String(execution.beneficiaryProfileId)} -> ${String(tranche.beneficiaryProfileId)}`,
    );
  }

  if (execution.settlementEndpointId !== tranche.settlementEndpointId) {
    throw new Error(
      `[EXECUTABLE_TRANCHE_BINDING_SETTLEMENT_ENDPOINT_MISMATCH] ${String(execution.settlementEndpointId)} -> ${tranche.settlementEndpointId}`,
    );
  }

  if (
    execution.amount.amount !== tranche.amount.amount ||
    execution.amount.currency !== tranche.amount.currency
  ) {
    throw new Error("[EXECUTABLE_TRANCHE_BINDING_AMOUNT_MISMATCH]");
  }

  if (execution.purpose !== tranche.purpose) {
    throw new Error("[EXECUTABLE_TRANCHE_BINDING_PURPOSE_MISMATCH]");
  }

  const now = command.context.requestedAt;

  return {
    aggregate: {
      ...aggregate,

      tranches: aggregate.tranches.map((candidate) =>
        candidate.id === tranche.id
          ? {
              ...candidate,

              status: EXECUTABLE_TRANCHE_STATUS.BOUND_TO_EXECUTION,

              executionId: execution.id,
            }
          : candidate,
      ),

      metadata: {
        ...aggregate.metadata,

        updatedAt: now,

        lastModifiedByActorId: command.context.actorId,

        version: aggregate.metadata.version + 1,
      },
    },

    event: {
      eventType:
        TREASURY_EVENT_TYPE.EXECUTABLE_TRANCHE_BOUND_TO_EXECUTION,

      payload: {
        planId: aggregate.id,

        trancheId: tranche.id,

        executionId: execution.id,
      },

      occurredAt: now,
    },
  };
}
