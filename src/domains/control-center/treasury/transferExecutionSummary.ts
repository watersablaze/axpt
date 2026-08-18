import type { TransferExecutionSummary } from "../../treasury/gateway/transfer-execution-summary/contracts";

export type ControlCenterTransferExecutionSummary = Readonly<{
  transferId: string;

  transferStatus: string;

  transferVersion: number;

  planId: string;

  planStatus: string;

  planVersion: number;

  trancheCounts: Readonly<{
    total: number;

    planned: number;

    eligible: number;

    ineligible: number;

    requiresClarification: number;

    boundToExecution: number;
  }>;

  executionCounts: Readonly<Record<string, number>>;

  amounts: Readonly<{
    planned: Readonly<{
      amount: string;

      currency: string;
    }>;

    bound: Readonly<{
      amount: string;

      currency: string;
    }>;

    confirmed: Readonly<{
      amount: string;

      currency: string;
    }>;

    failed: Readonly<{
      amount: string;

      currency: string;
    }>;

    remainingUnbound: Readonly<{
      amount: string;

      currency: string;
    }>;
  }>;

  lastUpdatedAt: string;
}>;

export function toControlCenterTransferExecutionSummary(
  summary: TransferExecutionSummary,
): ControlCenterTransferExecutionSummary {
  return {
    transferId: summary.transferId,

    transferStatus: summary.transferStatus,

    transferVersion: summary.transferVersion,

    planId: summary.planId,

    planStatus: summary.planStatus,

    planVersion: summary.planVersion,

    trancheCounts: {
      ...summary.trancheCounts,
    },

    executionCounts: {
      ...summary.executionCounts,
    },

    amounts: {
      planned: {
        ...summary.amounts.planned,
      },

      bound: {
        ...summary.amounts.bound,
      },

      confirmed: {
        ...summary.amounts.confirmed,
      },

      failed: {
        ...summary.amounts.failed,
      },

      remainingUnbound: {
        ...summary.amounts.remainingUnbound,
      },
    },

    lastUpdatedAt: summary.lastUpdatedAt.toISOString(),
  };
}
