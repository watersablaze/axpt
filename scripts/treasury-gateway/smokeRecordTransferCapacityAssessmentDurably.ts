import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { recordTransferCapacityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfer-capacity-assessments/application/recordTransferCapacityAssessmentDurablyWithClient";

import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
} from "../../src/domains/treasury/gateway/transfer-capacity-assessments/contracts";

import { loadTransferCapacityAssessmentWithClient } from "../../src/domains/treasury/gateway/transfer-capacity-assessments/persistence/loadTransferCapacityAssessmentWithClient";

import { recordTransferAuthorityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfer-authority-assessments/application/recordTransferAuthorityAssessmentDurablyWithClient";

import { TRANSFER_AUTHORITY_ASSESSMENT_RESULT } from "../../src/domains/treasury/gateway/transfer-authority-assessments/contracts";

import { applyTreasuryTransferAuthorityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/applyTreasuryTransferAuthorityAssessmentDurablyWithClient";

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

async function originateTransfer(params: {
  transferId: string;

  suffix: string;

  fixtureId: string;

  amount?: string;

  currency?: string;

  client: TransactionClient;
}): Promise<void> {
  const {
    transferId,
    suffix,
    fixtureId,
    amount = "1000000.00",
    currency = "USD",
    client,
  } = params;

  await originateTreasuryTransferDurablyWithClient({
    request: {
      transferId,

      reference: `AXPT-CAPACITY-DURABLE-${suffix}-${fixtureId}`,

      eventId: `capacity-durable-transfer-created-${suffix}-${fixtureId}`,

      context: {
        commandId: `capacity-durable-transfer-create-command-${suffix}-${fixtureId}`,

        actorId: `capacity-durable-transfer-creator-${fixtureId}`,

        correlationId: `capacity-durable-transfer-create-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-21T19:00:00.000Z"),

        idempotencyKey: `capacity-durable-transfer-create-${suffix}-${fixtureId}`,
      },

      payload: {
        programId: `capacity-durable-program-${fixtureId}`,

        source: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

          programAccountId: `capacity-durable-source-${fixtureId}`,
        },

        destination: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

          settlementEndpointId: `capacity-durable-destination-${fixtureId}`,
        },

        requestedAmount: {
          amount,

          currency,
        },

        destinationCurrency: currency,

        purpose: `Capacity durability smoke ${suffix}`,
      },
    },

    client,
  });
}

async function authorizeTransfer(params: {
  transferId: string;

  suffix: string;

  fixtureId: string;

  client: TransactionClient;
}): Promise<void> {
  const { transferId, suffix, fixtureId, client } = params;

  await beginTreasuryTransferAuthorityReviewDurablyWithClient({
    transferId,

    eventId: `capacity-durable-review-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `capacity-durable-review-command-${suffix}-${fixtureId}`,

      actorId: `capacity-durable-reviewer-${fixtureId}`,

      correlationId: `capacity-durable-review-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-21T19:01:00.000Z"),

      idempotencyKey: `capacity-durable-review-${suffix}-${fixtureId}`,
    },

    client,
  });

  const assessmentId = `capacity-durable-authority-assessment-${suffix}-${fixtureId}`;

  await recordTransferAuthorityAssessmentDurablyWithClient({
    request: {
      assessmentId,

      eventId: `capacity-durable-authority-assessment-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `capacity-durable-authority-assessment-command-${suffix}-${fixtureId}`,

        actorId: `capacity-durable-authority-assessor-${fixtureId}`,

        correlationId: `capacity-durable-authority-assessment-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-21T19:02:00.000Z"),

        idempotencyKey: `capacity-durable-authority-assessment-${suffix}-${fixtureId}`,
      },

      payload: {
        transferId,

        result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,

        evidenceArtifactIds: [
          `capacity-durable-authority-evidence-${suffix}-${fixtureId}`,
        ],

        assessedAt: new Date("2026-08-21T19:01:30.000Z"),
      },
    },

    client,
  });

  await applyTreasuryTransferAuthorityAssessmentDurablyWithClient({
    transferId,

    assessmentId,

    eventId: `capacity-durable-authority-application-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `capacity-durable-authority-application-command-${suffix}-${fixtureId}`,

      actorId: `capacity-durable-authority-applicator-${fixtureId}`,

      correlationId: `capacity-durable-authority-application-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-21T19:03:00.000Z"),

      idempotencyKey: `capacity-durable-authority-application-${suffix}-${fixtureId}`,
    },

    client,
  });
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const authorizedTransferId = `capacity-durable-authorized-transfer-${fixtureId}`;

  const createdTransferId = `capacity-durable-created-transfer-${fixtureId}`;

  const missingTransferId = `capacity-durable-missing-transfer-${fixtureId}`;

  const assessmentId = `capacity-durable-assessment-${fixtureId}`;

  const actorId = `capacity-durable-assessor-${fixtureId}`;

  const evidenceReferenceIds = [
    `capacity-durable-source-evidence-${fixtureId}`,
    `capacity-durable-rail-evidence-${fixtureId}`,
  ] as const;

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await originateTransfer({
        transferId: authorizedTransferId,

        suffix: "authorized",

        fixtureId,

        client: tx,
      });

      await authorizeTransfer({
        transferId: authorizedTransferId,

        suffix: "authorized",

        fixtureId,

        client: tx,
      });

      await originateTransfer({
        transferId: createdTransferId,

        suffix: "created",

        fixtureId,

        client: tx,
      });
    });

    const authorizedTransfer = await prisma.treasuryGatewayAggregate.findUnique(
      {
        where: {
          aggregateType_aggregateId: {
            aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

            aggregateId: authorizedTransferId,
          },
        },
      },
    );

    assert(authorizedTransfer);

    assert.equal(
      authorizedTransfer.status,
      TREASURY_TRANSFER_STATUS.AUTHORIZED,
    );

    let missingTransferError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        recordTransferCapacityAssessmentDurablyWithClient({
          request: {
            assessmentId: `capacity-durable-missing-assessment-${fixtureId}`,

            eventId: `capacity-durable-missing-event-${fixtureId}`,

            context: {
              commandId: `capacity-durable-missing-command-${fixtureId}`,

              actorId,

              correlationId: `capacity-durable-missing-correlation-${fixtureId}`,

              requestedAt: new Date("2026-08-21T19:04:00.000Z"),

              idempotencyKey: `capacity-durable-missing-${fixtureId}`,
            },

            payload: {
              transferId: missingTransferId,

              requestedAmount: {
                amount: "1000000.00",

                currency: "USD",
              },

              constraints: [],

              assessedAt: new Date("2026-08-21T19:03:30.000Z"),
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

    let wrongPostureError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        recordTransferCapacityAssessmentDurablyWithClient({
          request: {
            assessmentId: `capacity-durable-wrong-posture-assessment-${fixtureId}`,

            eventId: `capacity-durable-wrong-posture-event-${fixtureId}`,

            context: {
              commandId: `capacity-durable-wrong-posture-command-${fixtureId}`,

              actorId,

              correlationId: `capacity-durable-wrong-posture-correlation-${fixtureId}`,

              requestedAt: new Date("2026-08-21T19:04:00.000Z"),

              idempotencyKey: `capacity-durable-wrong-posture-${fixtureId}`,
            },

            payload: {
              transferId: createdTransferId,

              requestedAmount: {
                amount: "1000000.00",

                currency: "USD",
              },

              constraints: [],

              assessedAt: new Date("2026-08-21T19:03:30.000Z"),
            },
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      wrongPostureError = error;
    }

    assertErrorCode(
      wrongPostureError,
      "TRANSFER_CAPACITY_ASSESSMENT_TRANSFER_STATUS_INVALID",
    );

    let amountMismatchError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        recordTransferCapacityAssessmentDurablyWithClient({
          request: {
            assessmentId: `capacity-durable-amount-mismatch-assessment-${fixtureId}`,

            eventId: `capacity-durable-amount-mismatch-event-${fixtureId}`,

            context: {
              commandId: `capacity-durable-amount-mismatch-command-${fixtureId}`,

              actorId,

              correlationId: `capacity-durable-amount-mismatch-correlation-${fixtureId}`,

              requestedAt: new Date("2026-08-21T19:04:00.000Z"),

              idempotencyKey: `capacity-durable-amount-mismatch-${fixtureId}`,
            },

            payload: {
              transferId: authorizedTransferId,

              requestedAmount: {
                amount: "400000.00",

                currency: "USD",
              },

              constraints: [],

              assessedAt: new Date("2026-08-21T19:03:30.000Z"),
            },
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      amountMismatchError = error;
    }

    assertErrorCode(
      amountMismatchError,
      "TRANSFER_CAPACITY_ASSESSMENT_REQUESTED_AMOUNT_MISMATCH",
    );

    const recorded = await prisma.$transaction(async (tx: TransactionClient) =>
      recordTransferCapacityAssessmentDurablyWithClient({
        request: {
          assessmentId,

          eventId: `capacity-durable-assessment-event-${fixtureId}`,

          context: {
            commandId: `capacity-durable-assessment-command-${fixtureId}`,

            actorId,

            correlationId: `capacity-durable-assessment-correlation-${fixtureId}`,

            requestedAt: new Date("2026-08-21T19:04:00.000Z"),

            idempotencyKey: `capacity-durable-assessment-${fixtureId}`,
          },

          payload: {
            transferId: authorizedTransferId,

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

                evidenceReferenceIds: [evidenceReferenceIds[0]],
              },

              {
                type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.RAIL,

                status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

                limit: {
                  amount: "600000.00",

                  currency: "USD",
                },

                evidenceReferenceIds: [evidenceReferenceIds[1]],
              },

              {
                type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.CONVERSION,

                status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.NOT_REQUIRED,

                evidenceReferenceIds: [],
              },
            ],

            assessedAt: new Date("2026-08-21T19:03:30.000Z"),

            notes: "Durable Capacity Assessment smoke.",
          },
        },

        client: tx,
      }),
    );

    assert.equal(recorded.aggregate.id, assessmentId);

    assert.equal(recorded.aggregate.transferId, authorizedTransferId);

    assert.equal(recorded.aggregate.metadata.version, 1);

    assert.equal(recorded.aggregate.assessedByActorId, actorId);

    assert.deepEqual(recorded.aggregate.requestedAmount, {
      amount: "1000000.00",

      currency: "USD",
    });

    assert.deepEqual(recorded.aggregate.executableNow, {
      amount: "600000.00",

      currency: "USD",
    });

    assert.equal(recorded.aggregate.constraints.length, 3);

    assert.equal(
      recorded.event.eventType,
      TREASURY_EVENT_TYPE.TRANSFER_CAPACITY_ASSESSMENT_RECORDED,
    );

    assert.equal(recorded.event.aggregateVersion, 1);

    const loaded = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTransferCapacityAssessmentWithClient({
        assessmentId,

        client: tx,
      }),
    );

    assert(loaded);

    assert.equal(loaded.aggregate.id, assessmentId);

    assert.equal(loaded.aggregate.transferId, authorizedTransferId);

    assert.deepEqual(
      loaded.aggregate.requestedAmount,
      recorded.aggregate.requestedAmount,
    );

    assert.deepEqual(
      loaded.aggregate.constraints,
      recorded.aggregate.constraints,
    );

    assert.deepEqual(
      loaded.aggregate.executableNow,
      recorded.aggregate.executableNow,
    );

    assert.equal(loaded.aggregate.assessedByActorId, actorId);

    assert.equal(loaded.aggregate.notes, "Durable Capacity Assessment smoke.");

    const aggregateCount = await prisma.treasuryGatewayAggregate.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_CAPACITY_ASSESSMENT,

        aggregateId: assessmentId,
      },
    });

    const eventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_CAPACITY_ASSESSMENT,

        aggregateId: assessmentId,
      },
    });

    assert.equal(aggregateCount, 1);

    assert.equal(eventCount, 1);

    const invalidAssessmentCount = await prisma.treasuryGatewayAggregate.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_CAPACITY_ASSESSMENT,

        aggregateId: {
          in: [
            `capacity-durable-missing-assessment-${fixtureId}`,
            `capacity-durable-wrong-posture-assessment-${fixtureId}`,
            `capacity-durable-amount-mismatch-assessment-${fixtureId}`,
          ],
        },
      },
    });

    const invalidEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_CAPACITY_ASSESSMENT,

        aggregateId: {
          in: [
            `capacity-durable-missing-assessment-${fixtureId}`,
            `capacity-durable-wrong-posture-assessment-${fixtureId}`,
            `capacity-durable-amount-mismatch-assessment-${fixtureId}`,
          ],
        },
      },
    });

    assert.equal(invalidAssessmentCount, 0);

    assert.equal(invalidEventCount, 0);

    console.log(
      "✓ Durable Transfer Capacity Assessment recording smoke test passed",
    );

    console.log({
      assessment: {
        id: loaded.aggregate.id,

        transferId: loaded.aggregate.transferId,

        requestedAmount: loaded.aggregate.requestedAmount,

        executableNow: loaded.aggregate.executableNow,

        version: loaded.aggregate.metadata.version,
      },

      targetTransfer: {
        status: authorizedTransfer.status,

        version: authorizedTransfer.version,
      },

      durableState: {
        assessmentAggregates: aggregateCount,

        assessmentEvents: eventCount,

        invalidAssessmentAggregates: invalidAssessmentCount,

        invalidAssessmentEvents: invalidEventCount,
      },

      invariants: {
        canonicalTransferRequired: true,

        authorizedTransferRequired: true,

        missingTransferRejected: true,

        nonAuthorizedTransferRejected: true,

        canonicalRequestedAmountRequired: true,

        alteredRequestedAmountRejected: true,

        invalidTargetsCreateNoAssessment: true,

        invalidTargetsAppendNoAssessmentEvent: true,

        canonicalRecordingServiceUsed: true,

        capacityAssessmentRecordedAtVersionOne: true,

        assessmentAggregatePersisted: true,

        assessmentEventPersisted: true,

        requestedAmountRetained: true,

        constraintsRetained: true,

        evidenceReferencesRetained: true,

        assessorIdentityRetained: true,

        executableCapacityComputedByTreasury: true,

        lowestApplicableConstraintControlsExecutableCapacity: true,

        durableReloadReconstructsAssessment: true,
      },
    });
  } finally {
    /*
     * Capacity findings.
     */
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

    /*
     * Authority findings used to place the canonical Transfer into
     * AUTHORIZED posture.
     */
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

    /*
     * Transfer lifecycle fixtures.
     */
    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: {
          in: [authorizedTransferId, createdTransferId],
        },
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: {
          in: [authorizedTransferId, createdTransferId],
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
