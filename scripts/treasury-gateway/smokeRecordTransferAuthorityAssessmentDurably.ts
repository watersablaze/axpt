import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { recordTransferAuthorityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfer-authority-assessments/application/recordTransferAuthorityAssessmentDurablyWithClient";

import { TRANSFER_AUTHORITY_ASSESSMENT_RESULT } from "../../src/domains/treasury/gateway/transfer-authority-assessments/contracts";

import { loadTransferAuthorityAssessmentWithClient } from "../../src/domains/treasury/gateway/transfer-authority-assessments/persistence/loadTransferAuthorityAssessmentWithClient";

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

async function originateTransfer(params: {
  transferId: string;

  suffix: string;

  fixtureId: string;

  client: TransactionClient;
}): Promise<void> {
  const { transferId, suffix, fixtureId, client } = params;

  await originateTreasuryTransferDurablyWithClient({
    request: {
      transferId,

      reference: `AXPT-AUTHORITY-ASSESSMENT-${suffix}-${fixtureId}`,

      eventId: `smoke-authority-assessment-transfer-created-${suffix}-${fixtureId}`,

      context: {
        commandId: `smoke-authority-assessment-transfer-create-command-${suffix}-${fixtureId}`,

        actorId: `smoke-authority-assessment-transfer-creator-${fixtureId}`,

        correlationId: `smoke-authority-assessment-transfer-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-19T17:55:00.000Z"),

        idempotencyKey: `smoke-authority-assessment-transfer-create-${suffix}-${fixtureId}`,
      },

      payload: {
        programId: `smoke-authority-assessment-program-${fixtureId}`,

        source: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

          programAccountId: `smoke-authority-assessment-source-${fixtureId}`,
        },

        destination: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

          settlementEndpointId: `smoke-authority-assessment-destination-${fixtureId}`,
        },

        requestedAmount: {
          amount: "250000.00",

          currency: "USD",
        },

        destinationCurrency: "USD",

        purpose: `Authority assessment durability ${suffix}`,
      },
    },

    client,
  });
}

async function beginReview(params: {
  transferId: string;

  suffix: string;

  fixtureId: string;

  client: TransactionClient;
}): Promise<void> {
  const { transferId, suffix, fixtureId, client } = params;

  await beginTreasuryTransferAuthorityReviewDurablyWithClient({
    transferId,

    eventId: `smoke-authority-assessment-review-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `smoke-authority-assessment-review-command-${suffix}-${fixtureId}`,

      actorId: `smoke-authority-assessment-reviewer-${fixtureId}`,

      correlationId: `smoke-authority-assessment-review-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-19T17:57:00.000Z"),

      idempotencyKey: `smoke-authority-assessment-review-${suffix}-${fixtureId}`,
    },

    client,
  });
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const assessmentId = `smoke-durable-authority-assessment-${fixtureId}`;

  const transferId = `smoke-durable-authority-transfer-${fixtureId}`;

  const createdOnlyTransferId = `smoke-durable-authority-created-only-${fixtureId}`;

  const missingTransferId = `smoke-durable-authority-missing-${fixtureId}`;

  const missingTransferAssessmentId = `smoke-durable-authority-missing-assessment-${fixtureId}`;

  const wrongStatusAssessmentId = `smoke-durable-authority-wrong-status-assessment-${fixtureId}`;

  const eventId = `smoke-durable-authority-event-${fixtureId}`;

  const actorId = `smoke-durable-authority-assessor-${fixtureId}`;

  const authorityGrantId = `smoke-durable-authority-grant-${fixtureId}`;

  const instructionId = `smoke-durable-authority-instruction-${fixtureId}`;

  const evidenceArtifactIds = [
    `smoke-durable-authority-artifact-001-${fixtureId}`,
    `smoke-durable-authority-artifact-002-${fixtureId}`,
  ] as const;

  const requestedAt = new Date("2026-08-19T18:00:00.000Z");

  const assessedAt = new Date("2026-08-19T17:59:30.000Z");

  const request = {
    assessmentId,

    eventId,

    context: {
      commandId: `smoke-durable-authority-command-${fixtureId}`,

      actorId,

      authorityGrantId,

      correlationId: `smoke-durable-authority-correlation-${fixtureId}`,

      requestedAt,

      idempotencyKey: `smoke-durable-authority-record-${fixtureId}`,
    },

    payload: {
      transferId,

      result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,

      instructionId,

      authorityGrantId,

      evidenceArtifactIds,

      assessedAt,

      notes: "Durable authority assessment application-service smoke.",
    },
  } as const;

  try {
    /*
     * Canonical lawful target:
     *
     * CREATED @ v1
     *      ↓
     * AUTHORITY_REVIEW @ v2
     */
    await prisma.$transaction(async (tx: TransactionClient) => {
      await originateTransfer({
        transferId,

        suffix: "reviewed",

        fixtureId,

        client: tx,
      });

      await beginReview({
        transferId,

        suffix: "reviewed",

        fixtureId,

        client: tx,
      });

      /*
       * Negative-control target:
       * exists, but remains CREATED.
       */
      await originateTransfer({
        transferId: createdOnlyTransferId,

        suffix: "created-only",

        fixtureId,

        client: tx,
      });
    });

    /*
     * Missing Transfer must not produce an assessment.
     */
    let missingTransferError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        recordTransferAuthorityAssessmentDurablyWithClient({
          request: {
            ...request,

            assessmentId: missingTransferAssessmentId,

            eventId: `smoke-durable-authority-missing-transfer-event-${fixtureId}`,

            context: {
              ...request.context,

              commandId: `smoke-durable-authority-missing-transfer-command-${fixtureId}`,

              idempotencyKey: `smoke-durable-authority-missing-transfer-${fixtureId}`,
            },

            payload: {
              ...request.payload,

              transferId: missingTransferId,
            },
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      missingTransferError = error;
    }

    assertErrorCode(
      missingTransferError,
      "TREASURY_GATEWAY_TRANSFER_NOT_FOUND",
    );

    /*
     * Existing but CREATED Transfer must not accept an authority finding.
     */
    let wrongStatusError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        recordTransferAuthorityAssessmentDurablyWithClient({
          request: {
            ...request,

            assessmentId: wrongStatusAssessmentId,

            eventId: `smoke-durable-authority-wrong-status-event-${fixtureId}`,

            context: {
              ...request.context,

              commandId: `smoke-durable-authority-wrong-status-command-${fixtureId}`,

              idempotencyKey: `smoke-durable-authority-wrong-status-${fixtureId}`,
            },

            payload: {
              ...request.payload,

              transferId: createdOnlyTransferId,
            },
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      wrongStatusError = error;
    }

    assertErrorCode(
      wrongStatusError,
      "TRANSFER_AUTHORITY_ASSESSMENT_TRANSFER_STATUS_INVALID",
    );

    /*
     * Lawful reviewed Transfer may now receive the finding.
     */
    const persisted = await prisma.$transaction(async (tx: TransactionClient) =>
      recordTransferAuthorityAssessmentDurablyWithClient({
        request,

        client: tx,
      }),
    );

    assert.equal(persisted.aggregate.id, assessmentId);

    assert.equal(persisted.aggregate.transferId, transferId);

    assert.equal(
      persisted.aggregate.result,
      TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,
    );

    assert.equal(persisted.aggregate.metadata.version, 1);

    assert.equal(persisted.aggregate.assessedByActorId, actorId);

    assert.deepEqual(
      persisted.aggregate.evidenceArtifactIds,
      evidenceArtifactIds,
    );

    assert.equal(
      persisted.event.eventType,
      TREASURY_EVENT_TYPE.TRANSFER_AUTHORITY_ASSESSMENT_RECORDED,
    );

    assert.equal(persisted.event.aggregateVersion, 1);

    assert.equal(persisted.event.actorId, actorId);

    assert.equal(persisted.event.authorityGrantId, authorityGrantId);

    const loaded = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTransferAuthorityAssessmentWithClient({
        assessmentId,

        client: tx,
      }),
    );

    assert(loaded);

    assert.equal(loaded.aggregate.id, assessmentId);

    assert.equal(loaded.aggregate.transferId, transferId);

    assert.equal(
      loaded.aggregate.result,
      TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,
    );

    assert.equal(loaded.aggregate.instructionId, instructionId);

    assert.equal(loaded.aggregate.authorityGrantId, authorityGrantId);

    assert.deepEqual(loaded.aggregate.evidenceArtifactIds, evidenceArtifactIds);

    assert.equal(loaded.aggregate.assessedByActorId, actorId);

    assert.equal(loaded.aggregate.assessedAt.getTime(), assessedAt.getTime());

    assert.equal(loaded.aggregate.notes, request.payload.notes);

    /*
     * Canonical assessment identity remains unique.
     */
    let duplicateError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        recordTransferAuthorityAssessmentDurablyWithClient({
          request: {
            ...request,

            eventId: `smoke-durable-authority-duplicate-event-${fixtureId}`,

            context: {
              ...request.context,

              commandId: `smoke-durable-authority-duplicate-command-${fixtureId}`,

              idempotencyKey: `smoke-durable-authority-duplicate-${fixtureId}`,
            },
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      duplicateError = error;
    }

    assertErrorCode(
      duplicateError,
      "TREASURY_GATEWAY_AGGREGATE_ALREADY_EXISTS",
    );

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

    const invalidAssessmentCount = await prisma.treasuryGatewayAggregate.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

        aggregateId: {
          in: [missingTransferAssessmentId, wrongStatusAssessmentId],
        },
      },
    });

    const invalidEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

        aggregateId: {
          in: [missingTransferAssessmentId, wrongStatusAssessmentId],
        },
      },
    });

    assert.equal(aggregateCount, 1);

    assert.equal(eventCount, 1);

    assert.equal(invalidAssessmentCount, 0);

    assert.equal(invalidEventCount, 0);

    console.log(
      "✓ Durable Transfer Authority Assessment recording smoke test passed",
    );

    console.log({
      assessment: {
        id: loaded.aggregate.id,

        transferId: loaded.aggregate.transferId,

        result: loaded.aggregate.result,

        version: loaded.aggregate.metadata.version,
      },

      targetTransfer: {
        status: "AUTHORITY_REVIEW",

        version: 2,
      },

      durableState: {
        assessmentAggregates: aggregateCount,

        assessmentEvents: eventCount,

        invalidAssessmentAggregates: invalidAssessmentCount,

        invalidAssessmentEvents: invalidEventCount,
      },

      invariants: {
        canonicalTransferRequired: true,

        authorityReviewPostureRequired: true,

        missingTransferRejected: true,

        createdTransferRejected: true,

        invalidTargetsCreateNoAssessment: true,

        invalidTargetsAppendNoAssessmentEvent: true,

        canonicalRecordingServiceUsed: true,

        assessmentRecordedAtVersionOne: true,

        assessmentAggregatePersisted: true,

        assessmentEventPersisted: true,

        assessorIdentityRetained: true,

        authorityGrantRetained: true,

        instructionIdentityRetained: true,

        evidenceArtifactIdentitiesRetained: true,

        assessedTimestampRetained: true,

        notesRetained: true,

        durableReloadReconstructsAssessment: true,

        duplicateAssessmentRejected: true,

        duplicateAttemptCreatesNoAggregate: true,

        duplicateAttemptAppendsNoEvent: true,
      },
    });
  } finally {
    const transferIds = [transferId, createdOnlyTransferId];

    const assessmentIds = [
      assessmentId,
      missingTransferAssessmentId,
      wrongStatusAssessmentId,
    ];

    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        OR: [
          {
            aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

            aggregateId: {
              in: transferIds,
            },
          },

          {
            aggregateType:
              TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

            aggregateId: {
              in: assessmentIds,
            },
          },
        ],
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        OR: [
          {
            aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

            aggregateId: {
              in: transferIds,
            },
          },

          {
            aggregateType:
              TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

            aggregateId: {
              in: assessmentIds,
            },
          },
        ],
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
