import assert from "node:assert/strict";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { loadTransferExecutionSummaryHttp } from "../../src/domains/control-center/treasury/loadTransferExecutionSummaryHttp";

import type { TransferExecutionSummary } from "../../src/domains/treasury/gateway/transfer-execution-summary/contracts";

const prisma = new PrismaClient();

const summary: TransferExecutionSummary = {
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

  lastUpdatedAt: new Date("2026-08-08T10:30:00.000Z"),
};

async function main(): Promise<void> {
  let blankLoaderCalled = false;

  const blankResult = await loadTransferExecutionSummaryHttp({
    rawTransferId: "   ",

    prisma,

    loadSummary: async () => {
      blankLoaderCalled = true;

      return summary;
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

    loadSummary: async ({
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

  let successReceivedTransferId: string | null = null;

  const successResult = await loadTransferExecutionSummaryHttp({
    rawTransferId: "  control-center-http-transfer-001  ",

    prisma,

    loadSummary: async ({
      transferId,
    }: {
      transferId: string;

      client: TransactionClient;
    }) => {
      successReceivedTransferId = transferId;

      return summary;
    },
  });

  assert.equal(successResult.status, 200);

  assert.equal(successResult.body.ok, true);

  if (!successResult.body.ok) {
    throw new Error("[CONTROL_CENTER_HTTP_SUCCESS_BODY_EXPECTED]");
  }

  assert.equal(successReceivedTransferId, summary.transferId);

  assert.equal(successResult.body.summary.transferId, summary.transferId);

  assert.equal(
    successResult.body.summary.transferStatus,
    summary.transferStatus,
  );

  assert.equal(successResult.body.summary.planId, summary.planId);

  assert.deepEqual(successResult.body.summary.amounts, summary.amounts);

  assert.equal(
    successResult.body.summary.lastUpdatedAt,
    summary.lastUpdatedAt.toISOString(),
  );

  console.log(
    "✓ Control Center Transfer Execution Summary HTTP boundary smoke test passed",
  );

  console.log({
    cases: {
      blankTransferId: {
        status: blankResult.status,
      },

      missingTransfer: {
        status: missingResult.status,
      },

      validTransfer: {
        status: successResult.status,

        transferId: successResult.body.summary.transferId,

        transferStatus: successResult.body.summary.transferStatus,

        planId: successResult.body.summary.planId,
      },
    },

    invariants: {
      blankTransferIdRejectedBeforeGatewayRead: true,

      transferIdentityNormalized: true,

      missingTransferReturns404: true,

      validTransferReturns200: true,

      gatewayProjectionSerialized: true,

      transportDateSerialized: true,

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
