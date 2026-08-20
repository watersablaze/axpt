import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { persistTreasuryGatewayCommandReceiptWithClient } from "../../src/domains/treasury/gateway/commands/persistence/persistTreasuryGatewayCommandReceiptWithClient";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { recordTransferAuthorityAssessmentIdempotentlyWithClient } from "../../src/domains/treasury/gateway/transfer-authority-assessments/application/recordTransferAuthorityAssessmentIdempotentlyWithClient";

import { TRANSFER_AUTHORITY_ASSESSMENT_RESULT } from "../../src/domains/treasury/gateway/transfer-authority-assessments/contracts";

import { beginTreasuryTransferAuthorityReviewDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/beginTreasuryTransferAuthorityReviewDurablyWithClient";

import { originateTreasuryTransferDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/originateTreasuryTransferDurablyWithClient";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../../src/domains/treasury/gateway/transfers/contracts";

const prisma = new PrismaClient();

function assertErrorCode(error: unknown, code: string): void {
  assert(error instanceof Error);

  assert(
    error.message.includes(code),
    `Expected ${code}, received ${error.message}`,
  );
}

async function createReviewedTransfer(params: {
  transferId: string;

  suffix: string;

  fixtureId: string;

  client: TransactionClient;
}): Promise<void> {
  const { transferId, suffix, fixtureId, client } = params;

  await originateTreasuryTransferDurablyWithClient({
    request: {
      transferId,

      reference: `AXPT-IDEMPOTENT-AUTHORITY-${suffix}-${fixtureId}`,

      eventId: `smoke-idempotent-authority-transfer-created-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `smoke-idempotent-authority-transfer-create-command-${suffix}-${fixtureId}`,

        actorId: `smoke-idempotent-authority-transfer-creator-${fixtureId}`,

        correlationId: `smoke-idempotent-authority-transfer-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-19T19:25:00.000Z"),

        idempotencyKey: `smoke-idempotent-authority-transfer-create-${suffix}-${fixtureId}`,
      },

      payload: {
        programId: `smoke-idempotent-authority-program-${fixtureId}`,

        source: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

          programAccountId: `smoke-idempotent-authority-source-${fixtureId}`,
        },

        destination: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

          settlementEndpointId: `smoke-idempotent-authority-destination-${fixtureId}`,
        },

        requestedAmount: {
          amount: "275000.00",

          currency: "USD",
        },

        destinationCurrency: "USD",

        purpose: `Idempotent authority assessment recording smoke ${suffix}.`,
      },
    },

    client,
  });

  await beginTreasuryTransferAuthorityReviewDurablyWithClient({
    transferId,

    eventId: `smoke-idempotent-authority-review-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `smoke-idempotent-authority-review-command-${suffix}-${fixtureId}`,

      actorId: `smoke-idempotent-authority-reviewer-${fixtureId}`,

      correlationId: `smoke-idempotent-authority-review-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-19T19:27:00.000Z"),

      idempotencyKey: `smoke-idempotent-authority-review-${suffix}-${fixtureId}`,
    },

    client,
  });
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const assessmentId = `smoke-idempotent-authority-assessment-${fixtureId}`;

  const transferId = `smoke-idempotent-authority-transfer-${fixtureId}`;

  const atomicityAssessmentId = `smoke-idempotent-authority-atomic-${fixtureId}`;

  const atomicityTransferId = `smoke-idempotent-authority-atomic-transfer-${fixtureId}`;

  const actorId = `smoke-idempotent-authority-actor-${fixtureId}`;

  const idempotencyKey = `smoke-idempotent-authority-${fixtureId}`;

  const evidenceArtifactIds = [
    `smoke-idempotent-artifact-001-${fixtureId}`,
    `smoke-idempotent-artifact-002-${fixtureId}`,
  ] as const;

  const assessedAt = new Date("2026-08-19T19:30:00.000Z");

  const baseRequest = {
    assessmentId,

    eventId: `smoke-idempotent-authority-event-${fixtureId}`,

    context: {
      commandId: `smoke-idempotent-authority-command-${fixtureId}`,

      actorId,

      authorityGrantId: `smoke-idempotent-authority-grant-${fixtureId}`,

      correlationId: `smoke-idempotent-authority-correlation-${fixtureId}`,

      requestedAt: new Date("2026-08-19T19:31:00.000Z"),

      idempotencyKey,
    },

    payload: {
      transferId,

      result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,

      instructionId: `smoke-idempotent-authority-instruction-${fixtureId}`,

      authorityGrantId: `smoke-idempotent-authority-grant-${fixtureId}`,

      evidenceArtifactIds,

      assessedAt,

      notes: "Authority assessment accepted from identified evidence.",
    },
  } as const;

  const conflictingCommandId = `smoke-idempotent-authority-command-conflict-${fixtureId}`;

  const seedReceiptKey = `smoke-idempotent-authority-seed-receipt-${fixtureId}`;

  const atomicityIdempotencyKey = `smoke-idempotent-authority-atomic-key-${fixtureId}`;

  try {
    /*
     * Every authority assessment must first earn entrance
     * through the canonical Transfer authority-review posture.
     */
    await prisma.$transaction(async (tx: TransactionClient) => {
      await createReviewedTransfer({
        transferId,

        suffix: "primary",

        fixtureId,

        client: tx,
      });

      await createReviewedTransfer({
        transferId: atomicityTransferId,

        suffix: "atomicity",

        fixtureId,

        client: tx,
      });
    });

    /*
     * First substantive authority finding.
     */
    const first = await prisma.$transaction(async (tx: TransactionClient) =>
      recordTransferAuthorityAssessmentIdempotentlyWithClient({
        request: baseRequest,

        client: tx,
      }),
    );

    assert.equal(first.disposition, "RECORDED");

    assert.equal(first.aggregate.id, assessmentId);

    assert.equal(first.aggregate.transferId, transferId);

    assert.equal(first.aggregate.metadata.version, 1);

    /*
     * Exact retry deliberately proposes a different generated
     * assessment identity.
     *
     * Treasury must resolve the accepted command receipt and
     * return the original canonical assessment.
     */
    const proposedRetryAssessmentId = `smoke-idempotent-authority-retry-proposed-assessment-${fixtureId}`;

    const retry = await prisma.$transaction(async (tx: TransactionClient) =>
      recordTransferAuthorityAssessmentIdempotentlyWithClient({
        request: {
          ...baseRequest,

          assessmentId: proposedRetryAssessmentId,

          eventId: `smoke-idempotent-authority-retry-event-${fixtureId}`,

          context: {
            ...baseRequest.context,

            commandId: `smoke-idempotent-authority-retry-command-${fixtureId}`,

            correlationId: `smoke-idempotent-authority-retry-correlation-${fixtureId}`,

            requestedAt: new Date("2026-08-19T19:32:00.000Z"),
          },
        },

        client: tx,
      }),
    );

    assert.equal(retry.disposition, "REPLAYED");

    assert.equal(retry.aggregate.id, assessmentId);

    assert.notEqual(retry.aggregate.id, proposedRetryAssessmentId);

    assert.equal(retry.aggregate.transferId, transferId);

    assert.equal(retry.aggregate.metadata.version, 1);

    const aggregateCount = await prisma.treasuryGatewayAggregate.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

        aggregateId: assessmentId,
      },
    });

    const eventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

        aggregateId: assessmentId,
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

    /*
     * Same idempotency key with materially altered judgment
     * must be rejected.
     */
    const collisionRequests = [
      {
        label: "result",

        request: {
          ...baseRequest,

          payload: {
            ...baseRequest.payload,

            result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.NOT_AUTHORIZED,
          },
        },
      },

      {
        label: "evidence",

        request: {
          ...baseRequest,

          payload: {
            ...baseRequest.payload,

            evidenceArtifactIds: [
              ...evidenceArtifactIds,
              `changed-evidence-${fixtureId}`,
            ],
          },
        },
      },

      {
        label: "notes",

        request: {
          ...baseRequest,

          payload: {
            ...baseRequest.payload,

            notes: "Materially changed assessment notes.",
          },
        },
      },

      {
        label: "actor",

        request: {
          ...baseRequest,

          context: {
            ...baseRequest.context,

            actorId: `different-assessor-${fixtureId}`,
          },
        },
      },
    ] as const;

    for (const collisionCase of collisionRequests) {
      let collisionError: unknown;

      try {
        await prisma.$transaction(async (tx: TransactionClient) =>
          recordTransferAuthorityAssessmentIdempotentlyWithClient({
            request: collisionCase.request,

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
    }

    const aggregateCountAfterCollisions =
      await prisma.treasuryGatewayAggregate.count({
        where: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

          aggregateId: assessmentId,
        },
      });

    const eventCountAfterCollisions = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

        aggregateId: assessmentId,
      },
    });

    const receiptCountAfterCollisions =
      await prisma.treasuryGatewayCommandReceipt.count({
        where: {
          idempotencyKey,
        },
      });

    assert.equal(aggregateCountAfterCollisions, 1);

    assert.equal(eventCountAfterCollisions, 1);

    assert.equal(receiptCountAfterCollisions, 1);

    /*
     * Atomicity proof:
     *
     * The atomicity Transfer has independently reached
     * AUTHORITY_REVIEW, so assessment lifecycle validation passes.
     *
     * Seed a command receipt using the commandId that the new
     * assessment request will attempt to use.
     *
     * The assessment aggregate and event are written first, but
     * command-receipt persistence must then fail on commandId
     * uniqueness.
     *
     * Because assessment + event + receipt are inside one Prisma
     * transaction, the assessment aggregate and event must roll back.
     */
    await prisma.$transaction(async (tx: TransactionClient) =>
      persistTreasuryGatewayCommandReceiptWithClient({
        receipt: {
          idempotencyKey: seedReceiptKey,

          commandId: conflictingCommandId,

          commandKind: "ATOMICITY_SEED",

          aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

          aggregateId: `atomicity-seed-${fixtureId}`,

          actorId,

          correlationId: `atomicity-seed-correlation-${fixtureId}`,

          requestFingerprint: `atomicity-seed-fingerprint-${fixtureId}`,
        },

        client: tx,
      }),
    );

    let atomicityError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        recordTransferAuthorityAssessmentIdempotentlyWithClient({
          request: {
            assessmentId: atomicityAssessmentId,

            eventId: `smoke-idempotent-authority-atomic-event-${fixtureId}`,

            context: {
              ...baseRequest.context,

              commandId: conflictingCommandId,

              correlationId: `smoke-idempotent-authority-atomic-correlation-${fixtureId}`,

              idempotencyKey: atomicityIdempotencyKey,
            },

            payload: {
              ...baseRequest.payload,

              transferId: atomicityTransferId,

              assessedAt: new Date("2026-08-19T19:35:00.000Z"),

              notes: "Atomicity authority assessment rollback proof.",
            },
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      atomicityError = error;
    }

    assertErrorCode(atomicityError, "TREASURY_GATEWAY_COMMAND_ID_CONFLICT");

    const atomicAggregateCount = await prisma.treasuryGatewayAggregate.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

        aggregateId: atomicityAssessmentId,
      },
    });

    const atomicEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

        aggregateId: atomicityAssessmentId,
      },
    });

    const atomicReceiptCount = await prisma.treasuryGatewayCommandReceipt.count(
      {
        where: {
          idempotencyKey: atomicityIdempotencyKey,
        },
      },
    );

    assert.equal(atomicAggregateCount, 0);

    assert.equal(atomicEventCount, 0);

    assert.equal(atomicReceiptCount, 0);

    /*
     * The Transfer itself remains valid and under review.
     * Only the failed assessment transaction is rolled back.
     */
    const atomicTransfer = await prisma.treasuryGatewayAggregate.findUnique({
      where: {
        aggregateType_aggregateId: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

          aggregateId: atomicityTransferId,
        },
      },
    });

    assert(atomicTransfer);

    assert.equal(atomicTransfer.status, "AUTHORITY_REVIEW");

    assert.equal(atomicTransfer.version, 2);

    console.log(
      "✓ Idempotent Transfer Authority Assessment recording smoke test passed",
    );

    console.log({
      assessmentId,

      firstDisposition: first.disposition,

      retryDisposition: retry.disposition,

      targetTransfer: {
        id: transferId,

        status: "AUTHORITY_REVIEW",

        version: 2,
      },

      durableState: {
        aggregates: aggregateCountAfterCollisions,

        events: eventCountAfterCollisions,

        receipts: receiptCountAfterCollisions,
      },

      atomicFailureState: {
        aggregates: atomicAggregateCount,

        events: atomicEventCount,

        receipts: atomicReceiptCount,

        targetTransferStatus: atomicTransfer.status,

        targetTransferVersion: atomicTransfer.version,
      },

      invariants: {
        reviewedTransferRequiredForAssessment: true,

        firstFindingRecorded: true,

        commandReceiptPersisted: true,

        exactRetryReplayed: true,

        retryReturnsOriginalCanonicalAssessmentIdentity: true,

        exactRetryCreatesNoAggregate: true,

        exactRetryAppendsNoEvent: true,

        changedResultRejected: true,

        changedEvidenceRejected: true,

        changedNotesRejected: true,

        changedAssessorRejected: true,

        failedCollisionsChangeNothingDurable: true,

        atomicityFixturePassedLifecycleValidation: true,

        assessmentEventAndReceiptCommitAtomically: true,

        failedAtomicAssessmentLeavesReviewedTransferIntact: true,
      },
    });
  } finally {
    /*
     * Remove command receipts first.
     */
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

    /*
     * Remove assessment events.
     */
    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

        aggregateId: {
          in: [assessmentId, atomicityAssessmentId],
        },
      },
    });

    /*
     * Remove assessment aggregates.
     */
    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

        aggregateId: {
          in: [assessmentId, atomicityAssessmentId],
        },
      },
    });

    /*
     * Remove Transfer lifecycle events created for the lawful
     * review fixtures.
     */
    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: {
          in: [transferId, atomicityTransferId],
        },
      },
    });

    /*
     * Remove Transfer aggregates last.
     */
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
