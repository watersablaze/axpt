import { addDecimals, subtractDecimals } from "../shared/decimalAmount";

import type { TreasuryExecutionPlan } from "../execution-plans/contracts";

import { EXECUTABLE_TRANCHE_STATUS } from "../execution-plans/status";

import type { TreasuryExecution } from "../executions/contracts";

import {
  TREASURY_EXECUTION_STATUS,
  type TreasuryExecutionStatus,
} from "../executions/status";

import type { TreasuryTransfer } from "../transfers/contracts";

import { assertTransferExecutionSummaryConsistency } from "./assertTransferExecutionSummaryConsistency";

import type { TransferExecutionSummary } from "./contracts";

type MutableTransferExecutionStatusCounts = Record<
  TreasuryExecutionStatus,
  number
>;

function createExecutionCounts(): MutableTransferExecutionStatusCounts {
  return {
    CREATED: 0,

    VALIDATING: 0,

    READY_FOR_AUTHORIZATION: 0,

    AUTHORIZED: 0,

    QUEUED: 0,

    INITIATED: 0,

    PENDING_EXTERNAL_CONFIRMATION: 0,

    CONFIRMED: 0,

    FAILED: 0,

    REQUIRES_INTERVENTION: 0,

    REVERSED: 0,

    CANCELLED: 0,
  };
}

function latestDate(dates: readonly Date[]): Date {
  return new Date(Math.max(...dates.map((date) => date.getTime())));
}

export function deriveTransferExecutionSummary(params: {
  transfer: TreasuryTransfer;

  plan: TreasuryExecutionPlan;

  executions: readonly TreasuryExecution[];
}): TransferExecutionSummary {
  const { transfer, plan, executions } = params;

  assertTransferExecutionSummaryConsistency({
    transfer,

    plan,

    executions,
  });

  const trancheCounts = {
    total: plan.tranches.length,

    planned: 0,

    eligible: 0,

    ineligible: 0,

    requiresClarification: 0,

    boundToExecution: 0,
  };

  let boundAmount = "0";

  for (const tranche of plan.tranches) {
    switch (tranche.status) {
      case EXECUTABLE_TRANCHE_STATUS.PLANNED:
        trancheCounts.planned += 1;

        break;

      case EXECUTABLE_TRANCHE_STATUS.ELIGIBLE:
        trancheCounts.eligible += 1;

        break;

      case EXECUTABLE_TRANCHE_STATUS.INELIGIBLE:
        trancheCounts.ineligible += 1;

        break;

      case EXECUTABLE_TRANCHE_STATUS.REQUIRES_CLARIFICATION:
        trancheCounts.requiresClarification += 1;

        break;

      case EXECUTABLE_TRANCHE_STATUS.BOUND_TO_EXECUTION:
        trancheCounts.boundToExecution += 1;

        boundAmount = addDecimals(
          boundAmount,

          tranche.amount.amount,
        );

        break;
    }
  }

  const executionCounts = createExecutionCounts();

  let confirmedAmount = "0";

  let failedAmount = "0";

  for (const execution of executions) {
    executionCounts[execution.status] += 1;

    if (execution.status === TREASURY_EXECUTION_STATUS.CONFIRMED) {
      confirmedAmount = addDecimals(
        confirmedAmount,

        execution.amount.amount,
      );
    }

    if (execution.status === TREASURY_EXECUTION_STATUS.FAILED) {
      failedAmount = addDecimals(
        failedAmount,

        execution.amount.amount,
      );
    }
  }

  return {
    transferId: transfer.id,

    transferStatus: transfer.status,

    transferVersion: transfer.metadata.version,

    planId: plan.id,

    planStatus: plan.status,

    planVersion: plan.metadata.version,

    trancheCounts,

    executionCounts,

    amounts: {
      planned: plan.plannedAmount,

      bound: {
        amount: boundAmount,

        currency: plan.plannedAmount.currency,
      },

      confirmed: {
        amount: confirmedAmount,

        currency: plan.plannedAmount.currency,
      },

      failed: {
        amount: failedAmount,

        currency: plan.plannedAmount.currency,
      },

      remainingUnbound: {
        amount: subtractDecimals(
          plan.plannedAmount.amount,

          boundAmount,
        ),

        currency: plan.plannedAmount.currency,
      },
    },

    lastUpdatedAt: latestDate([
      transfer.metadata.updatedAt,

      plan.metadata.updatedAt,

      ...executions.map((execution) => execution.metadata.updatedAt),
    ]),
  };
}
