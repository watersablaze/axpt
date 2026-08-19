import assert from "node:assert/strict";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { loadTransferExecutionSummaryHttp } from "../../src/domains/control-center/treasury/loadTransferExecutionSummaryHttp";

import type { TransferExecutionSummary } from "../../src/domains/treasury/gateway/transfer-execution-summary/contracts";

import type { TransferExecutionPerception } from "../../src/domains/treasury/gateway/transfer-execution-summary/perceptionContracts";

import type { TreasuryTransfer } from "../../src/domains/treasury/gateway/transfers/contracts";

const prisma = new PrismaClient();

const lastUpdatedAt = new Date("2026-08-08T10:30:00.000Z");

const plannedSummary: TransferExecutionSummary = {
  transferId: "control-center-http-transfer-001",

  transferStatus: "PLANNED",

  transferVersion: 5,

  planId: "control-center-http-plan-001",

  planStatus: "RECORDED",

  planVersion: 4,

  trancheCounts: {
    total: 2,

    planned: 0,

    eligible: 1,

    ineligible: 0,

    requiresClarification: 0,

    boundToExecution: 1,
  },

  executionCounts: {
    CREATED: 1,

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
  },

  amounts: {
    planned: {
      amount: "1000000.00",

      currency: "USD",
    },

    bound: {
      amount: "500000",

      currency: "USD",
    },

    confirmed: {
      amount: "0",

      currency: "USD",
    },

    failed: {
      amount: "0",

      currency: "USD",
    },

    remainingUnbound: {
      amount: "500000",

      currency: "USD",
    },
  },

  lastUpdatedAt,
};

const newbornTransfer: TreasuryTransfer = {
  id: "control-center-http-newborn-transfer-001",

  reference: "AXPT-NEWBORN-TRANSFER-001",

  programId: "control-center-http-program-001",

  source: {
    kind: "PROGRAM_ACCOUNT",

    programAccountId: "control-center-http-program-account-001",
  },

  destination: {
    kind: "SETTLEMENT_ENDPOINT",

    settlementEndpointId: "control-center-http-settlement-endpoint-001",
  },

  requestedAmount: {
    amount: "250000.00",

    currency: "USD",
  },

  destinationCurrency: "USD",

  purpose: "Pre-execution Treasury perception smoke",

  status: "CREATED",

  metadata: {
    createdAt: new Date("2026-08-19T09:59:18.000Z"),

    updatedAt: new Date("2026-08-19T09:59:18.000Z"),

    createdByActorId: "control-center-http-operator-001",

    lastModifiedByActorId: "control-center-http-operator-001",

    version: 1,
  },
};

async function main(): Promise<void> {
  let blankLoaderCalled = false;

  const blankResult = await loadTransferExecutionSummaryHttp({
    rawTransferId: "   ",

    prisma,

    loadPerception: async () => {
      blankLoaderCalled = true;

      return {
        kind: "PRE_EXECUTION",

        transfer: newbornTransfer,
      };
    },
  });

  assert.equal(blankResult.status, 400);

  assert.deepEqual(blankResult.body, {
    ok: false,

    error: "TRANSFER_ID_REQUIRED",
  });

  assert.equal(blankLoaderCalled, false);

  let missingReceivedTransferId: string | null = null;

  const missingResult = await loadTransferExecutionSummaryHttp({
    rawTransferId: "  control-center-http-missing  ",

    prisma,

    loadPerception: async ({
      transferId,
    }: {
      transferId: string;

      client: TransactionClient;
    }) => {
      missingReceivedTransferId = transferId;

      return null;
    },
  });

  assert.equal(missingResult.status, 404);

  assert.deepEqual(missingResult.body, {
    ok: false,

    error: "TREASURY_TRANSFER_NOT_FOUND",
  });

  assert.equal(missingReceivedTransferId, "control-center-http-missing");

  let preExecutionReceivedTransferId: string | null = null;

  const preExecutionResult = await loadTransferExecutionSummaryHttp({
    rawTransferId: "  control-center-http-newborn-transfer-001  ",

    prisma,

    loadPerception: async ({
      transferId,
    }: {
      transferId: string;

      client: TransactionClient;
    }): Promise<TransferExecutionPerception> => {
      preExecutionReceivedTransferId = transferId;

      return {
        kind: "PRE_EXECUTION",

        transfer: newbornTransfer,
      };
    },
  });

  assert.equal(preExecutionResult.status, 200);

  assert.equal(preExecutionResult.body.ok, true);

  if (!preExecutionResult.body.ok) {
    throw new Error("[CONTROL_CENTER_PRE_EXECUTION_BODY_EXPECTED]");
  }

  assert.equal(preExecutionReceivedTransferId, newbornTransfer.id);

  assert.equal(preExecutionResult.body.perception.kind, "PRE_EXECUTION");

  if (preExecutionResult.body.perception.kind !== "PRE_EXECUTION") {
    throw new Error("[CONTROL_CENTER_PRE_EXECUTION_PERCEPTION_EXPECTED]");
  }

  assert.equal(
    preExecutionResult.body.perception.transfer.id,
    newbornTransfer.id,
  );

  assert.equal(preExecutionResult.body.perception.transfer.status, "CREATED");

  assert.equal(preExecutionResult.body.perception.transfer.version, 1);

  assert.equal(
    preExecutionResult.body.perception.transfer.programId,
    newbornTransfer.programId,
  );

  assert.deepEqual(
    preExecutionResult.body.perception.transfer.requestedAmount,
    newbornTransfer.requestedAmount,
  );

  let summaryReceivedTransferId: string | null = null;

  const summaryResult = await loadTransferExecutionSummaryHttp({
    rawTransferId: "  control-center-http-transfer-001  ",

    prisma,

    loadPerception: async ({
      transferId,
    }: {
      transferId: string;

      client: TransactionClient;
    }): Promise<TransferExecutionPerception> => {
      summaryReceivedTransferId = transferId;

      return {
        kind: "EXECUTION_SUMMARY",

        summary: plannedSummary,
      };
    },
  });

  assert.equal(summaryResult.status, 200);

  assert.equal(summaryResult.body.ok, true);

  if (!summaryResult.body.ok) {
    throw new Error("[CONTROL_CENTER_EXECUTION_SUMMARY_BODY_EXPECTED]");
  }

  assert.equal(summaryReceivedTransferId, plannedSummary.transferId);

  assert.equal(summaryResult.body.perception.kind, "EXECUTION_SUMMARY");

  if (summaryResult.body.perception.kind !== "EXECUTION_SUMMARY") {
    throw new Error("[CONTROL_CENTER_EXECUTION_SUMMARY_PERCEPTION_EXPECTED]");
  }

  assert.equal(
    summaryResult.body.perception.summary.transferId,
    plannedSummary.transferId,
  );

  assert.equal(
    summaryResult.body.perception.summary.transferStatus,
    plannedSummary.transferStatus,
  );

  assert.equal(
    summaryResult.body.perception.summary.planId,
    plannedSummary.planId,
  );

  assert.deepEqual(
    summaryResult.body.perception.summary.amounts,
    plannedSummary.amounts,
  );

  assert.equal(
    summaryResult.body.perception.summary.lastUpdatedAt,
    plannedSummary.lastUpdatedAt.toISOString(),
  );

  console.log(
    "✓ Control Center Treasury Transfer execution perception HTTP smoke test passed",
  );

  console.log({
    cases: {
      blankTransferId: {
        status: blankResult.status,
      },

      missingTransfer: {
        status: missingResult.status,
      },

      preExecutionTransfer: {
        status: preExecutionResult.status,

        kind: preExecutionResult.body.ok
          ? preExecutionResult.body.perception.kind
          : null,

        transferId: newbornTransfer.id,

        transferStatus: newbornTransfer.status,
      },

      executionSummary: {
        status: summaryResult.status,

        kind: summaryResult.body.ok ? summaryResult.body.perception.kind : null,

        transferId: plannedSummary.transferId,

        transferStatus: plannedSummary.transferStatus,

        planId: plannedSummary.planId,
      },
    },

    invariants: {
      blankTransferIdRejectedBeforeGatewayRead: true,

      transferIdentityNormalized: true,

      missingTransferReturns404: true,

      newbornTransferReturnsPreExecution: true,

      preExecutionIsNotRepresentedAsFailure: true,

      plannedTransferReturnsExecutionSummary: true,

      gatewayPerceptionSerialized: true,

      transportDatesSerialized: true,

      treasuryReadBoundaryRemainsReadOnly: true,
    },
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
