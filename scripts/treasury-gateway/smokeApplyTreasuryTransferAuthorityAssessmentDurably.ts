import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { recordTransferAuthorityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfer-authority-assessments/application/recordTransferAuthorityAssessmentDurablyWithClient";

import { TRANSFER_AUTHORITY_ASSESSMENT_RESULT } from "../../src/domains/treasury/gateway/transfer-authority-assessments/contracts";

import { applyTreasuryTransferAuthorityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/applyTreasuryTransferAuthorityAssessmentDurablyWithClient";

import { beginTreasuryTransferAuthorityReviewDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/beginTreasuryTransferAuthorityReviewDurablyWithClient";

import { originateTreasuryTransferDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/originateTreasuryTransferDurablyWithClient";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../../src/domains/treasury/gateway/transfers/contracts";

import { loadTreasuryTransferWithClient } from "../../src/domains/treasury/gateway/transfers/persistence/loadTreasuryTransferWithClient";

import { TREASURY_TRANSFER_STATUS } from "../../src/domains/treasury/gateway/transfers/status";

const prisma = new PrismaClient();

function assertErrorCode(error: unknown, code: string): void {
  assert(error instanceof Error);

  assert(
    error.message.includes(code),
    `Expected ${code}, received ${error.message}`,
  );
}

async function createReviewedTransfer(params: {
  suffix: string;

  fixtureId: string;

  client: TransactionClient;
}) {
  const { suffix, fixtureId, client } = params;

  const transferId = `smoke-durable-authority-apply-transfer-${suffix}-${fixtureId}`;

  const actorId = `smoke-durable-authority-apply-actor-${fixtureId}`;

  await originateTreasuryTransferDurablyWithClient({
    request: {
      transferId,

      reference: `AXPT-AUTHORITY-APPLY-${suffix}-${fixtureId}`,

      eventId: `smoke-durable-authority-apply-created-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `smoke-durable-authority-apply-create-command-${suffix}-${fixtureId}`,

        actorId,

        correlationId: `smoke-durable-authority-apply-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-19T20:00:00.000Z"),

        idempotencyKey: `smoke-durable-authority-apply-create-${suffix}-${fixtureId}`,
      },

      payload: {
        programId: `smoke-durable-authority-apply-program-${fixtureId}`,

        source: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

          programAccountId: `smoke-durable-authority-apply-account-${fixtureId}`,
        },

        destination: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

          settlementEndpointId: `smoke-durable-authority-apply-endpoint-${fixtureId}`,
        },

        requestedAmount: {
          amount: "300000.00",

          currency: "USD",
        },

        destinationCurrency: "USD",

        purpose: `Durable authority assessment application ${suffix}`,
      },
    },

    client,
  });

  await beginTreasuryTransferAuthorityReviewDurablyWithClient({
    transferId,

    eventId: `smoke-durable-authority-apply-review-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `smoke-durable-authority-apply-review-command-${suffix}-${fixtureId}`,

      actorId,

      correlationId: `smoke-durable-authority-apply-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-19T20:01:00.000Z"),

      idempotencyKey: `smoke-durable-authority-apply-review-${suffix}-${fixtureId}`,
    },

    client,
  });

  return transferId;
}

async function recordAssessment(params: {
  suffix: string;

  fixtureId: string;

  transferId: string;

  result: (typeof TRANSFER_AUTHORITY_ASSESSMENT_RESULT)[keyof typeof TRANSFER_AUTHORITY_ASSESSMENT_RESULT];

  client: TransactionClient;
}) {
  const { suffix, fixtureId, transferId, result, client } = params;

  const assessmentId = `smoke-durable-authority-apply-assessment-${suffix}-${fixtureId}`;

  await recordTransferAuthorityAssessmentDurablyWithClient({
    request: {
      assessmentId,

      eventId: `smoke-durable-authority-apply-assessment-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `smoke-durable-authority-apply-assessment-command-${suffix}-${fixtureId}`,

        actorId: `smoke-durable-authority-assessor-${fixtureId}`,

        correlationId: `smoke-durable-authority-apply-assessment-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-19T20:02:00.000Z"),

        idempotencyKey: `smoke-durable-authority-apply-assessment-${suffix}-${fixtureId}`,
      },

      payload: {
        transferId,

        result,

        evidenceArtifactIds: [
          `smoke-durable-authority-apply-artifact-${suffix}-${fixtureId}`,
        ],

        assessedAt: new Date("2026-08-19T20:01:30.000Z"),

        notes: `Authority assessment ${suffix}`,
      },
    },

    client,
  });

  return assessmentId;
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const transferIds: string[] = [];

  const assessmentIds: string[] = [];

  try {
    const cases = [
      {
        suffix: "authorized",

        result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,

        expectedStatus: TREASURY_TRANSFER_STATUS.AUTHORIZED,

        expectedEvent: TREASURY_EVENT_TYPE.TREASURY_TRANSFER_AUTHORIZED,
      },

      {
        suffix: "clarification",

        result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.REQUIRES_CLARIFICATION,

        expectedStatus: TREASURY_TRANSFER_STATUS.REQUIRES_CLARIFICATION,

        expectedEvent:
          TREASURY_EVENT_TYPE.TREASURY_TRANSFER_AUTHORITY_CLARIFICATION_REQUIRED,
      },

      {
        suffix: "rejected",

        result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.NOT_AUTHORIZED,

        expectedStatus: TREASURY_TRANSFER_STATUS.REJECTED,

        expectedEvent: TREASURY_EVENT_TYPE.TREASURY_TRANSFER_REJECTED,
      },
    ] as const;

    for (const outcomeCase of cases) {
      const result = await prisma.$transaction(
        async (tx: TransactionClient) => {
          const transferId = await createReviewedTransfer({
            suffix: outcomeCase.suffix,

            fixtureId,

            client: tx,
          });

          const assessmentId = await recordAssessment({
            suffix: outcomeCase.suffix,

            fixtureId,

            transferId,

            result: outcomeCase.result,

            client: tx,
          });

          const applied =
            await applyTreasuryTransferAuthorityAssessmentDurablyWithClient({
              transferId,

              assessmentId,

              eventId: `smoke-durable-authority-apply-outcome-event-${outcomeCase.suffix}-${fixtureId}`,

              context: {
                commandId: `smoke-durable-authority-apply-outcome-command-${outcomeCase.suffix}-${fixtureId}`,

                actorId: `smoke-durable-authority-outcome-operator-${fixtureId}`,

                correlationId: `smoke-durable-authority-apply-outcome-correlation-${outcomeCase.suffix}-${fixtureId}`,

                requestedAt: new Date("2026-08-19T20:03:00.000Z"),

                idempotencyKey: `smoke-durable-authority-apply-outcome-${outcomeCase.suffix}-${fixtureId}`,
              },

              client: tx,
            });

          return {
            transferId,

            assessmentId,

            applied,
          };
        },
      );

      transferIds.push(result.transferId);

      assessmentIds.push(result.assessmentId);

      assert.equal(result.applied.aggregate.status, outcomeCase.expectedStatus);

      assert.equal(result.applied.aggregate.metadata.version, 3);

      assert.equal(result.applied.event.eventType, outcomeCase.expectedEvent);

      assert.equal(
        result.applied.event.payload.assessmentId,
        result.assessmentId,
      );

      const loaded = await prisma.$transaction(async (tx: TransactionClient) =>
        loadTreasuryTransferWithClient({
          transferId: result.transferId,

          client: tx,
        }),
      );

      assert(loaded);

      assert.equal(loaded.aggregate.status, outcomeCase.expectedStatus);

      assert.equal(loaded.aggregate.metadata.version, 3);
    }

    const mismatchTransferId = await prisma.$transaction(
      async (tx: TransactionClient) =>
        createReviewedTransfer({
          suffix: "mismatch",

          fixtureId,

          client: tx,
        }),
    );

    transferIds.push(mismatchTransferId);

    const otherTransferId = await prisma.$transaction(
      async (tx: TransactionClient) =>
        createReviewedTransfer({
          suffix: "other",

          fixtureId,

          client: tx,
        }),
    );

    transferIds.push(otherTransferId);

    const mismatchedAssessmentId = await prisma.$transaction(
      async (tx: TransactionClient) =>
        recordAssessment({
          suffix: "mismatch",

          fixtureId,

          transferId: otherTransferId,

          result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,

          client: tx,
        }),
    );

    assessmentIds.push(mismatchedAssessmentId);

    let mismatchError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        applyTreasuryTransferAuthorityAssessmentDurablyWithClient({
          transferId: mismatchTransferId,

          assessmentId: mismatchedAssessmentId,

          eventId: `smoke-durable-authority-apply-mismatch-event-${fixtureId}`,

          context: {
            commandId: `smoke-durable-authority-apply-mismatch-command-${fixtureId}`,

            actorId: `smoke-durable-authority-outcome-operator-${fixtureId}`,

            correlationId: `smoke-durable-authority-apply-mismatch-correlation-${fixtureId}`,

            requestedAt: new Date(),

            idempotencyKey: `smoke-durable-authority-apply-mismatch-${fixtureId}`,
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      mismatchError = error;
    }

    assertErrorCode(
      mismatchError,
      "TRANSFER_AUTHORITY_ASSESSMENT_TRANSFER_MISMATCH",
    );

    let missingAssessmentError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        applyTreasuryTransferAuthorityAssessmentDurablyWithClient({
          transferId: mismatchTransferId,

          assessmentId: `missing-authority-assessment-${fixtureId}`,

          eventId: `missing-authority-assessment-event-${fixtureId}`,

          context: {
            commandId: `missing-authority-assessment-command-${fixtureId}`,

            actorId: `smoke-durable-authority-outcome-operator-${fixtureId}`,

            correlationId: `missing-authority-assessment-correlation-${fixtureId}`,

            requestedAt: new Date(),

            idempotencyKey: `missing-authority-assessment-${fixtureId}`,
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      missingAssessmentError = error;
    }

    assertErrorCode(
      missingAssessmentError,
      "TREASURY_GATEWAY_TRANSFER_AUTHORITY_ASSESSMENT_NOT_FOUND",
    );

    const missingTransferId = `missing-transfer-${fixtureId}`;

    let missingTransferError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        applyTreasuryTransferAuthorityAssessmentDurablyWithClient({
          transferId: missingTransferId,

          assessmentId: mismatchedAssessmentId,

          eventId: `missing-transfer-outcome-event-${fixtureId}`,

          context: {
            commandId: `missing-transfer-outcome-command-${fixtureId}`,

            actorId: `smoke-durable-authority-outcome-operator-${fixtureId}`,

            correlationId: `missing-transfer-outcome-correlation-${fixtureId}`,

            requestedAt: new Date(),

            idempotencyKey: `missing-transfer-outcome-${fixtureId}`,
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

    const mismatchEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: mismatchTransferId,
      },
    });

    assert.equal(mismatchEventCount, 2);

    console.log(
      "✓ Durable Treasury Transfer authority assessment application smoke test passed",
    );

    console.log({
      outcomes: {
        authorized: {
          status: TREASURY_TRANSFER_STATUS.AUTHORIZED,

          version: 3,
        },

        clarification: {
          status: TREASURY_TRANSFER_STATUS.REQUIRES_CLARIFICATION,

          version: 3,
        },

        rejected: {
          status: TREASURY_TRANSFER_STATUS.REJECTED,

          version: 3,
        },
      },

      invariants: {
        canonicalTransferLoaded: true,

        canonicalAssessmentLoaded: true,

        callerSuppliesAssessmentIdentityOnly: true,

        authorizedFindingProducesAuthorizedTransfer: true,

        clarificationFindingProducesClarificationTransfer: true,

        notAuthorizedFindingProducesRejectedTransfer: true,

        appliedTransferAdvancesToVersionThree: true,

        assessmentIdentityRetainedInOutcomeEvent: true,

        mismatchedAssessmentTransferRejected: true,

        missingAssessmentRejected: true,

        missingTransferRejected: true,

        failedApplicationAppendsNoTransferEvent: true,
      },
    });
  } finally {
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
