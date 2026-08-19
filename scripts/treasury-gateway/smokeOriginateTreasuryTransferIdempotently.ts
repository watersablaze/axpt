import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { originateTreasuryTransferDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/originateTreasuryTransferDurablyWithClient";

import { originateTreasuryTransferIdempotentlyWithClient } from "../../src/domains/treasury/gateway/transfers/application/originateTreasuryTransferIdempotentlyWithClient";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../../src/domains/treasury/gateway/transfers/contracts";

const prisma = new PrismaClient();

function assertErrorCode(error: unknown, code: string): void {
  assert(error instanceof Error);

  assert(
    error.message.includes(code),
    `Expected ${code}, received ${error.message}`,
  );
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const transferId = `smoke-idempotent-transfer-${fixtureId}`;

  const failedTransferId = `smoke-idempotent-failed-transfer-${fixtureId}`;

  const idempotencyKey = `smoke-idempotent-key-${fixtureId}`;

  const failedIdempotencyKey = `smoke-idempotent-failed-key-${fixtureId}`;

  const baseRequest = {
    transferId,

    reference: `AXPT-IDEMPOTENT-TRANSFER-${fixtureId}`,

    eventId: `smoke-idempotent-event-${fixtureId}`,

    context: {
      commandId: `smoke-idempotent-command-${fixtureId}`,

      actorId: `smoke-idempotent-actor-${fixtureId}`,

      correlationId: `smoke-idempotent-correlation-${fixtureId}`,

      requestedAt: new Date(),

      idempotencyKey,
    },

    payload: {
      programId: `smoke-idempotent-program-${fixtureId}`,

      source: {
        kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

        programAccountId: `smoke-idempotent-program-account-${fixtureId}`,
      },

      destination: {
        kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

        settlementEndpointId: `smoke-idempotent-endpoint-${fixtureId}`,
      },

      requestedAmount: {
        amount: "250000.00",

        currency: "USD",
      },

      destinationCurrency: "USD",

      purpose: "Idempotent Treasury Transfer origination smoke",
    },
  } as const;

  try {
    const first = await prisma.$transaction(async (tx: TransactionClient) =>
      originateTreasuryTransferIdempotentlyWithClient({
        request: baseRequest,

        client: tx,
      }),
    );

    assert.equal(first.disposition, "CREATED");

    assert.equal(first.aggregate.id, transferId);

    const retry = await prisma.$transaction(async (tx: TransactionClient) =>
      originateTreasuryTransferIdempotentlyWithClient({
        request: {
          ...baseRequest,

          eventId: `smoke-idempotent-retry-event-${fixtureId}`,

          context: {
            ...baseRequest.context,

            commandId: `smoke-idempotent-retry-command-${fixtureId}`,

            correlationId: `smoke-idempotent-retry-correlation-${fixtureId}`,

            requestedAt: new Date(),
          },
        },

        client: tx,
      }),
    );

    assert.equal(retry.disposition, "REPLAYED");

    assert.equal(retry.aggregate.id, transferId);

    assert.equal(retry.receipt.idempotencyKey, idempotencyKey);

    const aggregateCount = await prisma.treasuryGatewayAggregate.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: transferId,
      },
    });

    const eventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: transferId,
      },
    });

    const receiptCount = await prisma.treasuryGatewayCommandReceipt.count({
      where: {
        idempotencyKey,
      },
    });

    assert.equal(aggregateCount, 1);

    assert.equal(eventCount, 1);

    assert.equal(receiptCount, 1);

    let collisionError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        originateTreasuryTransferIdempotentlyWithClient({
          request: {
            ...baseRequest,

            context: {
              ...baseRequest.context,

              commandId: `smoke-idempotent-collision-command-${fixtureId}`,

              requestedAt: new Date(),
            },

            payload: {
              ...baseRequest.payload,

              purpose: "Materially different Treasury request",
            },
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      collisionError = error;
    }

    assertErrorCode(
      collisionError,
      "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION",
    );

    /*
     * Establish an aggregate whose identity will cause
     * the following idempotent origination to fail before
     * a command receipt can be committed.
     */
    await prisma.$transaction(async (tx: TransactionClient) =>
      originateTreasuryTransferDurablyWithClient({
        request: {
          ...baseRequest,

          transferId: failedTransferId,

          reference: `AXPT-IDEMPOTENT-FAILED-${fixtureId}`,

          eventId: `smoke-idempotent-failed-prerequisite-event-${fixtureId}`,

          context: {
            ...baseRequest.context,

            commandId: `smoke-idempotent-failed-prerequisite-command-${fixtureId}`,

            correlationId: `smoke-idempotent-failed-prerequisite-correlation-${fixtureId}`,

            idempotencyKey: `smoke-idempotent-prerequisite-${fixtureId}`,

            requestedAt: new Date(),
          },
        },

        client: tx,
      }),
    );

    let failedOriginationError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        originateTreasuryTransferIdempotentlyWithClient({
          request: {
            ...baseRequest,

            transferId: failedTransferId,

            reference: `AXPT-IDEMPOTENT-FAILED-${fixtureId}`,

            eventId: `smoke-idempotent-failed-event-${fixtureId}`,

            context: {
              ...baseRequest.context,

              commandId: `smoke-idempotent-failed-command-${fixtureId}`,

              correlationId: `smoke-idempotent-failed-correlation-${fixtureId}`,

              idempotencyKey: failedIdempotencyKey,

              requestedAt: new Date(),
            },
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      failedOriginationError = error;
    }

    assertErrorCode(
      failedOriginationError,
      "TREASURY_GATEWAY_AGGREGATE_ALREADY_EXISTS",
    );

    const orphanReceiptCount = await prisma.treasuryGatewayCommandReceipt.count(
      {
        where: {
          idempotencyKey: failedIdempotencyKey,
        },
      },
    );

    assert.equal(orphanReceiptCount, 0);

    console.log("✓ Idempotent Treasury Transfer origination smoke test passed");

    console.log({
      transferId,

      firstDisposition: first.disposition,

      retryDisposition: retry.disposition,

      counts: {
        aggregates: aggregateCount,

        events: eventCount,

        receipts: receiptCount,
      },

      invariants: {
        firstRequestCreatesTransfer: true,

        commandReceiptPersisted: true,

        exactRetryReturnsOriginalTransfer: true,

        exactRetryDoesNotAppendEvent: true,

        exactRetryDoesNotCreateAggregate: true,

        changedRequestWithSameKeyRejected: true,

        failedOriginationLeavesNoReceipt: true,

        receiptAndTransferCommitAtomically: true,
      },
    });
  } finally {
    await prisma.treasuryGatewayCommandReceipt.deleteMany({
      where: {
        idempotencyKey: {
          in: [idempotencyKey, failedIdempotencyKey],
        },
      },
    });

    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: {
          in: [transferId, failedTransferId],
        },
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: {
          in: [transferId, failedTransferId],
        },
      },
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
