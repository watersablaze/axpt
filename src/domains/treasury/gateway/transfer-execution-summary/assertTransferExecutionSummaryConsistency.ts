import type { TreasuryExecutionPlan } from "../execution-plans/contracts";

import {
  EXECUTABLE_TRANCHE_STATUS,
  TREASURY_EXECUTION_PLAN_STATUS,
} from "../execution-plans/status";

import type { TreasuryExecution } from "../executions/contracts";

import { TREASURY_TRANSFER_STATUS } from "../transfers/status";

import type { TreasuryTransfer } from "../transfers/contracts";

export function assertTransferExecutionSummaryConsistency(params: {
  transfer: TreasuryTransfer;

  plan: TreasuryExecutionPlan;

  executions: readonly TreasuryExecution[];
}): void {
  const { transfer, plan, executions } = params;

  if (transfer.status !== TREASURY_TRANSFER_STATUS.PLANNED) {
    throw new Error(
      `[TRANSFER_EXECUTION_SUMMARY_TRANSFER_NOT_PLANNED] ${transfer.status}`,
    );
  }

  if (plan.status !== TREASURY_EXECUTION_PLAN_STATUS.RECORDED) {
    throw new Error(
      `[TRANSFER_EXECUTION_SUMMARY_PLAN_NOT_RECORDED] ${plan.status}`,
    );
  }

  if (plan.transferId !== transfer.id) {
    throw new Error(
      `[TRANSFER_EXECUTION_SUMMARY_PLAN_TRANSFER_MISMATCH] ${plan.transferId} -> ${transfer.id}`,
    );
  }

  const executionById = new Map<string, TreasuryExecution>();

  for (const execution of executions) {
    if (executionById.has(execution.id)) {
      throw new Error(
        `[TRANSFER_EXECUTION_SUMMARY_DUPLICATE_EXECUTION] ${execution.id}`,
      );
    }

    executionById.set(execution.id, execution);
  }

  const referencedExecutionIds = new Set<string>();

  for (const tranche of plan.tranches) {
    if (tranche.status === EXECUTABLE_TRANCHE_STATUS.BOUND_TO_EXECUTION) {
      if (!tranche.executionId) {
        throw new Error(
          `[TRANSFER_EXECUTION_SUMMARY_BOUND_TRANCHE_EXECUTION_REQUIRED] ${tranche.id}`,
        );
      }

      if (referencedExecutionIds.has(tranche.executionId)) {
        throw new Error(
          `[TRANSFER_EXECUTION_SUMMARY_EXECUTION_BOUND_MORE_THAN_ONCE] ${tranche.executionId}`,
        );
      }

      referencedExecutionIds.add(tranche.executionId);

      const execution = executionById.get(tranche.executionId);

      if (!execution) {
        throw new Error(
          `[TRANSFER_EXECUTION_SUMMARY_BOUND_EXECUTION_NOT_FOUND] ${tranche.executionId}`,
        );
      }

      if (execution.programId !== transfer.programId) {
        throw new Error(
          `[TRANSFER_EXECUTION_SUMMARY_EXECUTION_PROGRAM_MISMATCH] ${execution.programId} -> ${transfer.programId}`,
        );
      }

      if (execution.allocationId !== tranche.allocationId) {
        throw new Error(
          `[TRANSFER_EXECUTION_SUMMARY_EXECUTION_ALLOCATION_MISMATCH] ${execution.allocationId} -> ${tranche.allocationId}`,
        );
      }

      if (execution.instructionId !== tranche.instructionId) {
        throw new Error(
          `[TRANSFER_EXECUTION_SUMMARY_EXECUTION_INSTRUCTION_MISMATCH] ${String(execution.instructionId)} -> ${String(tranche.instructionId)}`,
        );
      }

      if (execution.kind !== tranche.executionKind) {
        throw new Error(
          `[TRANSFER_EXECUTION_SUMMARY_EXECUTION_KIND_MISMATCH] ${execution.kind} -> ${tranche.executionKind}`,
        );
      }

      if (execution.beneficiaryProfileId !== tranche.beneficiaryProfileId) {
        throw new Error(
          `[TRANSFER_EXECUTION_SUMMARY_EXECUTION_BENEFICIARY_MISMATCH] ${String(execution.beneficiaryProfileId)} -> ${String(tranche.beneficiaryProfileId)}`,
        );
      }

      if (execution.settlementEndpointId !== tranche.settlementEndpointId) {
        throw new Error(
          `[TRANSFER_EXECUTION_SUMMARY_EXECUTION_ENDPOINT_MISMATCH] ${String(execution.settlementEndpointId)} -> ${tranche.settlementEndpointId}`,
        );
      }

      if (
        execution.amount.amount !== tranche.amount.amount ||
        execution.amount.currency !== tranche.amount.currency
      ) {
        throw new Error(
          `[TRANSFER_EXECUTION_SUMMARY_EXECUTION_AMOUNT_MISMATCH] ${execution.id}`,
        );
      }

      if (execution.purpose !== tranche.purpose) {
        throw new Error(
          `[TRANSFER_EXECUTION_SUMMARY_EXECUTION_PURPOSE_MISMATCH] ${execution.id}`,
        );
      }

      continue;
    }

    if (tranche.executionId) {
      throw new Error(
        `[TRANSFER_EXECUTION_SUMMARY_UNBOUND_TRANCHE_HAS_EXECUTION] ${tranche.id} -> ${tranche.executionId}`,
      );
    }
  }

  for (const execution of executions) {
    if (!referencedExecutionIds.has(execution.id)) {
      throw new Error(
        `[TRANSFER_EXECUTION_SUMMARY_UNBOUND_EXECUTION] ${execution.id}`,
      );
    }
  }
}
