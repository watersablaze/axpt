import { createTreasuryExecution } from "../executions/createTreasuryExecution";

import type { TreasuryExecution } from "../executions/contracts";

import type { TreasuryExecutionCreatedPayload } from "../executions/events";

import type { TreasuryTransfer } from "../transfers/contracts";

import { TREASURY_TRANSFER_STATUS } from "../transfers/status";

import type { TreasuryDomainResult } from "../shared/domainResult";

import type { TreasuryExecutionId } from "../shared/identifiers";

import type { TreasuryExecutionPlan } from "./contracts";

import type { CreateTreasuryExecutionFromEligibleTranche } from "./executionInstantiationCommands";

import {
  EXECUTABLE_TRANCHE_STATUS,
  TREASURY_EXECUTION_PLAN_STATUS,
} from "./status";

export function createTreasuryExecutionFromEligibleTranche(params: {
  executionId: TreasuryExecutionId;

  reference: string;

  transfer: TreasuryTransfer;

  plan: TreasuryExecutionPlan;

  command: CreateTreasuryExecutionFromEligibleTranche;
}): TreasuryDomainResult<TreasuryExecution, TreasuryExecutionCreatedPayload> {
  const { executionId, reference, transfer, plan, command } = params;

  if (command.payload.transferId !== transfer.id) {
    throw new Error(
      `[TREASURY_EXECUTION_INSTANTIATION_TRANSFER_COMMAND_TARGET_MISMATCH] ${command.payload.transferId} -> ${transfer.id}`,
    );
  }

  if (command.payload.planId !== plan.id) {
    throw new Error(
      `[TREASURY_EXECUTION_INSTANTIATION_PLAN_COMMAND_TARGET_MISMATCH] ${command.payload.planId} -> ${plan.id}`,
    );
  }

  if (transfer.status !== TREASURY_TRANSFER_STATUS.PLANNED) {
    throw new Error(
      `[TREASURY_EXECUTION_INSTANTIATION_TRANSFER_NOT_PLANNED] ${transfer.status}`,
    );
  }

  if (plan.status !== TREASURY_EXECUTION_PLAN_STATUS.RECORDED) {
    throw new Error(
      `[TREASURY_EXECUTION_INSTANTIATION_PLAN_NOT_RECORDED] ${plan.status}`,
    );
  }

  if (plan.transferId !== transfer.id) {
    throw new Error(
      `[TREASURY_EXECUTION_INSTANTIATION_PLAN_TRANSFER_MISMATCH] ${plan.transferId} -> ${transfer.id}`,
    );
  }

  const tranche = plan.tranches.find(
    (candidate) => candidate.id === command.payload.trancheId,
  );

  if (!tranche) {
    throw new Error(
      `[TREASURY_EXECUTION_INSTANTIATION_TRANCHE_NOT_FOUND] ${command.payload.trancheId}`,
    );
  }

  if (tranche.status !== EXECUTABLE_TRANCHE_STATUS.ELIGIBLE) {
    throw new Error(
      `[TREASURY_EXECUTION_INSTANTIATION_TRANCHE_NOT_ELIGIBLE] ${tranche.status}`,
    );
  }

  return createTreasuryExecution({
    executionId,

    reference,

    command: {
      context: command.context,

      payload: {
        programId: transfer.programId,

        allocationId: tranche.allocationId,

        instructionId: tranche.instructionId,

        kind: tranche.executionKind,

        beneficiaryProfileId: tranche.beneficiaryProfileId,

        settlementEndpointId: tranche.settlementEndpointId,

        amount: tranche.amount,

        purpose: tranche.purpose,
      },
    },
  });
}
