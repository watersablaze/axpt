import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { persistTreasuryGatewayCommandReceiptWithClient } from "../../src/domains/treasury/gateway/commands/persistence/persistTreasuryGatewayCommandReceiptWithClient";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { recordTransferAuthorityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfer-authority-assessments/application/recordTransferAuthorityAssessmentDurablyWithClient";

import { TRANSFER_AUTHORITY_ASSESSMENT_RESULT } from "../../src/domains/treasury/gateway/transfer-authority-assessments/contracts";

import { recordTransferCapacityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfer-capacity-assessments/application/recordTransferCapacityAssessmentDurablyWithClient";

import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
} from "../../src/domains/treasury/gateway/transfer-capacity-assessments/contracts";

import { applyTreasuryTransferAuthorityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/applyTreasuryTransferAuthorityAssessmentDurablyWithClient";

import { applyTreasuryTransferCapacityAssessmentIdempotentlyWithClient } from "../../src/domains/treasury/gateway/transfers/application/applyTreasuryTransferCapacityAssessmentIdempotentlyWithClient";

import { beginTreasuryTransferAuthorityReviewDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/beginTreasuryTransferAuthorityReviewDurablyWithClient";

import { originateTreasuryTransferDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/originateTreasuryTransferDurablyWithClient";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../../src/domains/treasury/gateway/transfers/contracts";

import { TREASURY_TRANSFER_STATUS } from "../../src/domains/treasury/gateway/transfers/status";

const prisma = new PrismaClient();

function assertErrorCode(error: unknown, code: string): void {
  assert(error instanceof Error);

  assert(
    error.message.includes(code),
    `Expected ${code}, received ${error.message}`,
  );
}

async function createAuthorizedTransfer(params: {
  transferId: string;

  suffix: string;

  fixtureId: string;

  client: TransactionClient;
}): Promise<void> {
  const { transferId, suffix, fixtureId, client } = params;

  await originateTreasuryTransferDurablyWithClient({
    request: {
      transferId,

      reference: `AXPT-CAPACITY-APPLICATION-IDEMPOTENT-${suffix}-${fixtureId}`,

      eventId: `capacity-application-idempotent-created-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `capacity-application-idempotent-create-command-${suffix}-${fixtureId}`,

        actorId: `capacity-application-idempotent-creator-${fixtureId}`,

        correlationId: `capacity-application-idempotent-create-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-21T22:00:00.000Z"),

        idempotencyKey: `capacity-application-idempotent-create-${suffix}-${fixtureId}`,
      },

      payload: {
        programId: `capacity-application-idempotent-program-${fixtureId}`,

        source: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

          programAccountId: `capacity-application-idempotent-source-${fixtureId}`,
        },

        destination: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

          settlementEndpointId: `capacity-application-idempotent-destination-${fixtureId}`,
        },

        requestedAmount: {
          amount: "1000000.00",

          currency: "USD",
        },

        destinationCurrency: "USD",

        purpose: `Idempotent Capacity application smoke ${suffix}.`,
      },
    },

    client,
  });

  await beginTreasuryTransferAuthorityReviewDurablyWithClient({
    transferId,

    eventId: `capacity-application-idempotent-review-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `capacity-application-idempotent-review-command-${suffix}-${fixtureId}`,

      actorId: `capacity-application-idempotent-reviewer-${fixtureId}`,

      correlationId: `capacity-application-idempotent-review-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-21T22:01:00.000Z"),

      idempotencyKey: `capacity-application-idempotent-review-${suffix}-${fixtureId}`,
    },

    client,
  });

  const authorityAssessmentId = `capacity-application-idempotent-authority-assessment-${suffix}-${fixtureId}`;

  await recordTransferAuthorityAssessmentDurablyWithClient({
    request: {
      assessmentId: authorityAssessmentId,

      eventId: `capacity-application-idempotent-authority-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `capacity-application-idempotent-authority-command-${suffix}-${fixtureId}`,

        actorId: `capacity-application-idempotent-authority-assessor-${fixtureId}`,

        correlationId: `capacity-application-idempotent-authority-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-21T22:02:00.000Z"),

        idempotencyKey: `capacity-application-idempotent-authority-${suffix}-${fixtureId}`,
      },

      payload: {
        transferId,

        result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,

        evidenceArtifactIds: [
          `capacity-application-idempotent-authority-evidence-${suffix}-${fixtureId}`,
        ],

        assessedAt: new Date("2026-08-21T22:01:30.000Z"),
      },
    },

    client,
  });

  await applyTreasuryTransferAuthorityAssessmentDurablyWithClient({
    transferId,

    assessmentId: authorityAssessmentId,

    eventId: `capacity-application-idempotent-authority-application-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `capacity-application-idempotent-authority-application-command-${suffix}-${fixtureId}`,

      actorId: `capacity-application-idempotent-authority-applicator-${fixtureId}`,

      correlationId: `capacity-application-idempotent-authority-application-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-21T22:03:00.000Z"),

      idempotencyKey: `capacity-application-idempotent-authority-application-${suffix}-${fixtureId}`,
    },

    client,
  });
}

async function recordCapacityAssessment(params: {
  transferId: string;

  assessmentId: string;

  suffix: string;

  fixtureId: string;

  client: TransactionClient;
}): Promise<void> {
  const { transferId, assessmentId, suffix, fixtureId, client } = params;

  await recordTransferCapacityAssessmentDurablyWithClient({
    request: {
      assessmentId,

      eventId: `capacity-application-idempotent-assessment-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `capacity-application-idempotent-assessment-command-${suffix}-${fixtureId}`,

        actorId: `capacity-application-idempotent-assessor-${fixtureId}`,

        correlationId: `capacity-application-idempotent-assessment-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-21T22:04:00.000Z"),

        idempotencyKey: `capacity-application-idempotent-assessment-${suffix}-${fixtureId}`,
      },

      payload: {
        transferId,

        requestedAmount: {
          amount: "1000000.00",

          currency: "USD",
        },

        constraints: [
          {
            type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.SOURCE_FUNDS,

            status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

            limit: {
              amount: "850000.00",

              currency: "USD",
            },

            evidenceReferenceIds: [
              `capacity-application-idempotent-source-evidence-${suffix}-${fixtureId}`,
            ],
          },

          {
            type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.RAIL,

            status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

            limit: {
              amount: "600000.00",

              currency: "USD",
            },

            evidenceReferenceIds: [
              `capacity-application-idempotent-rail-evidence-${suffix}-${fixtureId}`,
            ],
          },
        ],

        assessedAt: new Date("2026-08-21T22:03:30.000Z"),

        notes: `Idempotent Capacity application assessment ${suffix}.`,
      },
    },

    client,
  });
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const transferId = `capacity-application-idempotent-transfer-${fixtureId}`;

  const atomicityTransferId = `capacity-application-idempotent-atomic-transfer-${fixtureId}`;

  const assessmentId = `capacity-application-idempotent-assessment-${fixtureId}`;

  const atomicityAssessmentId = `capacity-application-idempotent-atomic-assessment-${fixtureId}`;

  const otherAssessmentId = `capacity-application-idempotent-other-assessment-${fixtureId}`;

  const actorId = `capacity-application-idempotent-applicator-${fixtureId}`;

  const idempotencyKey = `capacity-application-idempotent-apply-${fixtureId}`;

  const atomicityIdempotencyKey = `capacity-application-idempotent-atomic-key-${fixtureId}`;

  const seedReceiptKey = `capacity-application-idempotent-seed-${fixtureId}`;

  const conflictingCommandId = `capacity-application-idempotent-conflicting-command-${fixtureId}`;

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await createAuthorizedTransfer({
        transferId,

        suffix: "primary",

        fixtureId,

        client: tx,
      });

      await recordCapacityAssessment({
        transferId,

        assessmentId,

        suffix: "primary",

        fixtureId,

        client: tx,
      });

      await createAuthorizedTransfer({
        transferId: atomicityTransferId,

        suffix: "atomicity",

        fixtureId,

        client: tx,
      });

      await recordCapacityAssessment({
        transferId: atomicityTransferId,

        assessmentId: atomicityAssessmentId,

        suffix: "atomicity",

        fixtureId,

        client: tx,
      });

      /*
       * A second valid assessment exists only so we can prove
       * that changing assessment identity under the same
       * application idempotency key is a collision.
       */
      await recordCapacityAssessment({
        transferId,

        assessmentId: otherAssessmentId,

        suffix: "other",

        fixtureId,

        client: tx,
      });
    });

    const first = await prisma.$transaction(async (tx: TransactionClient) =>
      applyTreasuryTransferCapacityAssessmentIdempotentlyWithClient({
        transferId,

        assessmentId,

        eventId: `capacity-application-idempotent-outcome-event-${fixtureId}`,

        context: {
          commandId: `capacity-application-idempotent-outcome-command-${fixtureId}`,

          actorId,

          correlationId: `capacity-application-idempotent-outcome-correlation-${fixtureId}`,

          requestedAt: new Date("2026-08-21T22:05:00.000Z"),

          idempotencyKey,
        },

        client: tx,
      }),
    );

    assert.equal(first.disposition, "APPLIED");

    assert.equal(
      first.aggregate.status,
      TREASURY_TRANSFER_STATUS.CAPACITY_ASSESSED,
    );

    assert.equal(first.aggregate.metadata.version, 4);

    /*
     * Exact retry may carry fresh generated transport identity,
     * but the material application remains identical.
     */
    const retry = await prisma.$transaction(async (tx: TransactionClient) =>
      applyTreasuryTransferCapacityAssessmentIdempotentlyWithClient({
        transferId,

        assessmentId,

        eventId: `capacity-application-idempotent-retry-event-${fixtureId}`,

        context: {
          commandId: `capacity-application-idempotent-retry-command-${fixtureId}`,

          actorId,

          correlationId: `capacity-application-idempotent-retry-correlation-${fixtureId}`,

          requestedAt: new Date("2026-08-21T22:06:00.000Z"),

          idempotencyKey,
        },

        client: tx,
      }),
    );

    assert.equal(retry.disposition, "REPLAYED");

    assert.equal(
      retry.aggregate.status,
      TREASURY_TRANSFER_STATUS.CAPACITY_ASSESSED,
    );

    assert.equal(retry.aggregate.metadata.version, 4);

    const transferEventCount = await prisma.treasuryGatewayEvent.count({
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

    assert.equal(transferEventCount, 4);

    assert.equal(receiptCount, 1);

    /*
     * Same key, different assessment identity is a materially
     * different application command.
     */
    let assessmentCollisionError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        applyTreasuryTransferCapacityAssessmentIdempotentlyWithClient({
          transferId,

          assessmentId: otherAssessmentId,

          eventId: `capacity-application-idempotent-collision-event-${fixtureId}`,

          context: {
            commandId: `capacity-application-idempotent-collision-command-${fixtureId}`,

            actorId,

            correlationId: `capacity-application-idempotent-collision-correlation-${fixtureId}`,

            requestedAt: new Date("2026-08-21T22:07:00.000Z"),

            idempotencyKey,
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      assessmentCollisionError = error;
    }

    assertErrorCode(
      assessmentCollisionError,
      "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION",
    );

    /*
     * Same key, different authenticated actor is also a
     * materially different application command.
     */
    let actorCollisionError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        applyTreasuryTransferCapacityAssessmentIdempotentlyWithClient({
          transferId,

          assessmentId,

          eventId: `capacity-application-idempotent-actor-collision-event-${fixtureId}`,

          context: {
            commandId: `capacity-application-idempotent-actor-collision-command-${fixtureId}`,

            actorId: `capacity-application-idempotent-other-applicator-${fixtureId}`,

            correlationId: `capacity-application-idempotent-actor-collision-correlation-${fixtureId}`,

            requestedAt: new Date("2026-08-21T22:07:30.000Z"),

            idempotencyKey,
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      actorCollisionError = error;
    }

    assertErrorCode(
      actorCollisionError,
      "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION",
    );

    const transferEventCountAfterCollisions =
      await prisma.treasuryGatewayEvent.count({
        where: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

          aggregateId: transferId,
        },
      });

    const receiptCountAfterCollisions =
      await prisma.treasuryGatewayCommandReceipt.count({
        where: {
          idempotencyKey,
        },
      });

    assert.equal(transferEventCountAfterCollisions, 4);

    assert.equal(receiptCountAfterCollisions, 1);

    /*
     * Atomicity proof:
     *
     * Seed another receipt using the commandId the Capacity
     * application will attempt to persist.
     *
     * The Transfer transition to CAPACITY_ASSESSED occurs before
     * receipt persistence inside the surrounding Prisma
     * transaction. The receipt commandId conflict must therefore
     * roll the Transfer transition back.
     */
    await prisma.$transaction(async (tx: TransactionClient) =>
      persistTreasuryGatewayCommandReceiptWithClient({
        receipt: {
          idempotencyKey: seedReceiptKey,

          commandId: conflictingCommandId,

          commandKind: "ATOMICITY_SEED",

          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

          aggregateId: `capacity-application-idempotent-atomicity-seed-${fixtureId}`,

          actorId,

          correlationId: `capacity-application-idempotent-atomicity-seed-correlation-${fixtureId}`,

          requestFingerprint: `capacity-application-idempotent-atomicity-seed-fingerprint-${fixtureId}`,
        },

        client: tx,
      }),
    );

    let atomicityError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        applyTreasuryTransferCapacityAssessmentIdempotentlyWithClient({
          transferId: atomicityTransferId,

          assessmentId: atomicityAssessmentId,

          eventId: `capacity-application-idempotent-atomic-event-${fixtureId}`,

          context: {
            commandId: conflictingCommandId,

            actorId,

            correlationId: `capacity-application-idempotent-atomic-correlation-${fixtureId}`,

            requestedAt: new Date("2026-08-21T22:08:00.000Z"),

            idempotencyKey: atomicityIdempotencyKey,
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      atomicityError = error;
    }

    assertErrorCode(atomicityError, "TREASURY_GATEWAY_COMMAND_ID_CONFLICT");

    const atomicTransfer = await prisma.treasuryGatewayAggregate.findUnique({
      where: {
        aggregateType_aggregateId: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

          aggregateId: atomicityTransferId,
        },
      },
    });

    assert(atomicTransfer);

    assert.equal(atomicTransfer.status, TREASURY_TRANSFER_STATUS.AUTHORIZED);

    assert.equal(atomicTransfer.version, 3);

    const atomicTransferEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: atomicityTransferId,
      },
    });

    const atomicReceiptCount = await prisma.treasuryGatewayCommandReceipt.count(
      {
        where: {
          idempotencyKey: atomicityIdempotencyKey,
        },
      },
    );

    assert.equal(atomicTransferEventCount, 3);

    assert.equal(atomicReceiptCount, 0);

    console.log(
      "✓ Idempotent Treasury Transfer Capacity Assessment application smoke test passed",
    );

    console.log({
      firstDisposition: first.disposition,

      retryDisposition: retry.disposition,

      targetTransfer: {
        id: transferId,

        status: retry.aggregate.status,

        version: retry.aggregate.metadata.version,
      },

      durableState: {
        transferEvents: transferEventCountAfterCollisions,

        applicationReceipts: receiptCountAfterCollisions,
      },

      atomicFailureState: {
        transferStatus: atomicTransfer.status,

        transferVersion: atomicTransfer.version,

        transferEvents: atomicTransferEventCount,

        applicationReceipts: atomicReceiptCount,
      },

      invariants: {
        firstApplicationApplied: true,

        exactRetryReplayed: true,

        exactRetryReturnsCanonicalTransfer: true,

        exactRetryDoesNotAdvanceVersion: true,

        exactRetryAppendsNoDuplicateTransferEvent: true,

        changedAssessmentWithSameKeyRejected: true,

        changedActorWithSameKeyRejected: true,

        failedCollisionsChangeNothingDurable: true,

        durableApplicationReceiptRetained: true,

        applicationTransitionAndReceiptCommitAtomically: true,

        failedAtomicApplicationLeavesTransferAuthorized: true,
      },
    });
  } finally {
    await prisma.treasuryGatewayCommandReceipt.deleteMany({
      where: {
        OR: [
          {
            idempotencyKey,
          },

          {
            idempotencyKey: seedReceiptKey,
          },

          {
            idempotencyKey: atomicityIdempotencyKey,
          },
        ],
      },
    });

    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_CAPACITY_ASSESSMENT,

        aggregateId: {
          contains: fixtureId,
        },
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_CAPACITY_ASSESSMENT,

        aggregateId: {
          contains: fixtureId,
        },
      },
    });

    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

        aggregateId: {
          contains: fixtureId,
        },
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

        aggregateId: {
          contains: fixtureId,
        },
      },
    });

    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: {
          in: [transferId, atomicityTransferId],
        },
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: {
          in: [transferId, atomicityTransferId],
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
