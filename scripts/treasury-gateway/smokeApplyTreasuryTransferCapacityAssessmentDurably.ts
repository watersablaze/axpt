import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { recordTransferAuthorityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfer-authority-assessments/application/recordTransferAuthorityAssessmentDurablyWithClient";

import { TRANSFER_AUTHORITY_ASSESSMENT_RESULT } from "../../src/domains/treasury/gateway/transfer-authority-assessments/contracts";

import { recordTransferCapacityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfer-capacity-assessments/application/recordTransferCapacityAssessmentDurablyWithClient";

import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
} from "../../src/domains/treasury/gateway/transfer-capacity-assessments/contracts";

import { applyTreasuryTransferAuthorityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/applyTreasuryTransferAuthorityAssessmentDurablyWithClient";

import { applyTreasuryTransferCapacityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/applyTreasuryTransferCapacityAssessmentDurablyWithClient";

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

async function createAuthorizedTransfer(params: {
  suffix: string;

  fixtureId: string;

  client: TransactionClient;
}): Promise<string> {
  const { suffix, fixtureId, client } = params;

  const transferId = `smoke-durable-capacity-apply-transfer-${suffix}-${fixtureId}`;

  await originateTreasuryTransferDurablyWithClient({
    request: {
      transferId,

      reference: `AXPT-CAPACITY-APPLY-${suffix}-${fixtureId}`,

      eventId: `smoke-durable-capacity-apply-created-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `smoke-durable-capacity-apply-create-command-${suffix}-${fixtureId}`,

        actorId: `smoke-durable-capacity-apply-creator-${fixtureId}`,

        correlationId: `smoke-durable-capacity-apply-create-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-21T21:00:00.000Z"),

        idempotencyKey: `smoke-durable-capacity-apply-create-${suffix}-${fixtureId}`,
      },

      payload: {
        programId: `smoke-durable-capacity-apply-program-${fixtureId}`,

        source: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

          programAccountId: `smoke-durable-capacity-apply-source-${fixtureId}`,
        },

        destination: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

          settlementEndpointId: `smoke-durable-capacity-apply-destination-${fixtureId}`,
        },

        requestedAmount: {
          amount: "1000000.00",

          currency: "USD",
        },

        destinationCurrency: "USD",

        purpose: `Durable Capacity Assessment application ${suffix}`,
      },
    },

    client,
  });

  await beginTreasuryTransferAuthorityReviewDurablyWithClient({
    transferId,

    eventId: `smoke-durable-capacity-apply-review-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `smoke-durable-capacity-apply-review-command-${suffix}-${fixtureId}`,

      actorId: `smoke-durable-capacity-apply-reviewer-${fixtureId}`,

      correlationId: `smoke-durable-capacity-apply-review-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-21T21:01:00.000Z"),

      idempotencyKey: `smoke-durable-capacity-apply-review-${suffix}-${fixtureId}`,
    },

    client,
  });

  const authorityAssessmentId = `smoke-durable-capacity-apply-authority-assessment-${suffix}-${fixtureId}`;

  await recordTransferAuthorityAssessmentDurablyWithClient({
    request: {
      assessmentId: authorityAssessmentId,

      eventId: `smoke-durable-capacity-apply-authority-assessment-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `smoke-durable-capacity-apply-authority-assessment-command-${suffix}-${fixtureId}`,

        actorId: `smoke-durable-capacity-apply-authority-assessor-${fixtureId}`,

        correlationId: `smoke-durable-capacity-apply-authority-assessment-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-21T21:02:00.000Z"),

        idempotencyKey: `smoke-durable-capacity-apply-authority-assessment-${suffix}-${fixtureId}`,
      },

      payload: {
        transferId,

        result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,

        evidenceArtifactIds: [
          `smoke-durable-capacity-apply-authority-evidence-${suffix}-${fixtureId}`,
        ],

        assessedAt: new Date("2026-08-21T21:01:30.000Z"),
      },
    },

    client,
  });

  await applyTreasuryTransferAuthorityAssessmentDurablyWithClient({
    transferId,

    assessmentId: authorityAssessmentId,

    eventId: `smoke-durable-capacity-apply-authority-outcome-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `smoke-durable-capacity-apply-authority-outcome-command-${suffix}-${fixtureId}`,

      actorId: `smoke-durable-capacity-apply-authority-applicator-${fixtureId}`,

      correlationId: `smoke-durable-capacity-apply-authority-outcome-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-21T21:03:00.000Z"),

      idempotencyKey: `smoke-durable-capacity-apply-authority-outcome-${suffix}-${fixtureId}`,
    },

    client,
  });

  return transferId;
}

async function recordCapacityAssessment(params: {
  suffix: string;

  fixtureId: string;

  transferId: string;

  undetermined: boolean;

  client: TransactionClient;
}): Promise<string> {
  const { suffix, fixtureId, transferId, undetermined, client } = params;

  const assessmentId = `smoke-durable-capacity-apply-assessment-${suffix}-${fixtureId}`;

  const constraints = undetermined
    ? [
        {
          type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.SOURCE_FUNDS,

          status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

          limit: {
            amount: "850000.00",

            currency: "USD",
          },

          evidenceReferenceIds: [
            `smoke-durable-capacity-source-evidence-${suffix}-${fixtureId}`,
          ],
        },

        {
          type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.RAIL,

          status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.UNDETERMINED,

          evidenceReferenceIds: [
            `smoke-durable-capacity-rail-evidence-${suffix}-${fixtureId}`,
          ],
        },
      ]
    : [
        {
          type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.SOURCE_FUNDS,

          status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

          limit: {
            amount: "850000.00",

            currency: "USD",
          },

          evidenceReferenceIds: [
            `smoke-durable-capacity-source-evidence-${suffix}-${fixtureId}`,
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
            `smoke-durable-capacity-rail-evidence-${suffix}-${fixtureId}`,
          ],
        },
      ];

  const recorded = await recordTransferCapacityAssessmentDurablyWithClient({
    request: {
      assessmentId,

      eventId: `smoke-durable-capacity-apply-assessment-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `smoke-durable-capacity-apply-assessment-command-${suffix}-${fixtureId}`,

        actorId: `smoke-durable-capacity-assessor-${fixtureId}`,

        correlationId: `smoke-durable-capacity-apply-assessment-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-21T21:04:00.000Z"),

        idempotencyKey: `smoke-durable-capacity-apply-assessment-${suffix}-${fixtureId}`,
      },

      payload: {
        transferId,

        requestedAmount: {
          amount: "1000000.00",

          currency: "USD",
        },

        constraints,

        assessedAt: new Date("2026-08-21T21:03:30.000Z"),

        notes: `Durable Capacity Assessment application ${suffix}.`,
      },
    },

    client,
  });

  if (undetermined) {
    assert.equal(recorded.aggregate.executableNow, undefined);
  } else {
    assert.deepEqual(recorded.aggregate.executableNow, {
      amount: "600000.00",

      currency: "USD",
    });
  }

  return assessmentId;
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const transferIds: string[] = [];

  const assessmentIds: string[] = [];

  try {
    const cases = [
      {
        suffix: "determinate",

        undetermined: false,

        expectedStatus: TREASURY_TRANSFER_STATUS.CAPACITY_ASSESSED,

        expectedEvent: TREASURY_EVENT_TYPE.TREASURY_TRANSFER_CAPACITY_ASSESSED,
      },

      {
        suffix: "undetermined",

        undetermined: true,

        expectedStatus: TREASURY_TRANSFER_STATUS.CAPACITY_UNDETERMINED,

        expectedEvent:
          TREASURY_EVENT_TYPE.TREASURY_TRANSFER_CAPACITY_UNDETERMINED,
      },
    ] as const;

    const outcomes: Record<
      string,
      {
        status: string;

        version: number;
      }
    > = {};

    for (const outcomeCase of cases) {
      const result = await prisma.$transaction(
        async (tx: TransactionClient) => {
          const transferId = await createAuthorizedTransfer({
            suffix: outcomeCase.suffix,

            fixtureId,

            client: tx,
          });

          const assessmentId = await recordCapacityAssessment({
            suffix: outcomeCase.suffix,

            fixtureId,

            transferId,

            undetermined: outcomeCase.undetermined,

            client: tx,
          });

          const applied =
            await applyTreasuryTransferCapacityAssessmentDurablyWithClient({
              transferId,

              assessmentId,

              eventId: `smoke-durable-capacity-apply-outcome-event-${outcomeCase.suffix}-${fixtureId}`,

              context: {
                commandId: `smoke-durable-capacity-apply-outcome-command-${outcomeCase.suffix}-${fixtureId}`,

                actorId: `smoke-durable-capacity-outcome-operator-${fixtureId}`,

                correlationId: `smoke-durable-capacity-apply-outcome-correlation-${outcomeCase.suffix}-${fixtureId}`,

                requestedAt: new Date("2026-08-21T21:05:00.000Z"),

                idempotencyKey: `smoke-durable-capacity-apply-outcome-${outcomeCase.suffix}-${fixtureId}`,
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

      assert.equal(result.applied.aggregate.metadata.version, 4);

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

      assert.equal(loaded.aggregate.metadata.version, 4);

      outcomes[outcomeCase.suffix] = {
        status: loaded.aggregate.status,

        version: loaded.aggregate.metadata.version,
      };
    }

    /*
     * Assessment belonging to another Transfer must not be
     * applicable to the target Transfer.
     */
    const mismatchTransferId = await prisma.$transaction(
      async (tx: TransactionClient) =>
        createAuthorizedTransfer({
          suffix: "mismatch-target",

          fixtureId,

          client: tx,
        }),
    );

    transferIds.push(mismatchTransferId);

    const otherTransferId = await prisma.$transaction(
      async (tx: TransactionClient) =>
        createAuthorizedTransfer({
          suffix: "mismatch-other",

          fixtureId,

          client: tx,
        }),
    );

    transferIds.push(otherTransferId);

    const mismatchedAssessmentId = await prisma.$transaction(
      async (tx: TransactionClient) =>
        recordCapacityAssessment({
          suffix: "mismatch",

          fixtureId,

          transferId: otherTransferId,

          undetermined: false,

          client: tx,
        }),
    );

    assessmentIds.push(mismatchedAssessmentId);

    let mismatchError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        applyTreasuryTransferCapacityAssessmentDurablyWithClient({
          transferId: mismatchTransferId,

          assessmentId: mismatchedAssessmentId,

          eventId: `smoke-durable-capacity-apply-mismatch-event-${fixtureId}`,

          context: {
            commandId: `smoke-durable-capacity-apply-mismatch-command-${fixtureId}`,

            actorId: `smoke-durable-capacity-outcome-operator-${fixtureId}`,

            correlationId: `smoke-durable-capacity-apply-mismatch-correlation-${fixtureId}`,

            requestedAt: new Date("2026-08-21T21:06:00.000Z"),

            idempotencyKey: `smoke-durable-capacity-apply-mismatch-${fixtureId}`,
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      mismatchError = error;
    }

    assertErrorCode(
      mismatchError,
      "TRANSFER_CAPACITY_ASSESSMENT_TRANSFER_MISMATCH",
    );

    /*
     * Missing Capacity Assessment must be rejected before any
     * Transfer transition is attempted.
     */
    let missingAssessmentError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        applyTreasuryTransferCapacityAssessmentDurablyWithClient({
          transferId: mismatchTransferId,

          assessmentId: `missing-capacity-assessment-${fixtureId}`,

          eventId: `missing-capacity-assessment-event-${fixtureId}`,

          context: {
            commandId: `missing-capacity-assessment-command-${fixtureId}`,

            actorId: `smoke-durable-capacity-outcome-operator-${fixtureId}`,

            correlationId: `missing-capacity-assessment-correlation-${fixtureId}`,

            requestedAt: new Date("2026-08-21T21:06:30.000Z"),

            idempotencyKey: `missing-capacity-assessment-${fixtureId}`,
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      missingAssessmentError = error;
    }

    assertErrorCode(
      missingAssessmentError,
      "TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_NOT_FOUND",
    );

    /*
     * A valid Capacity Assessment with a missing target Transfer
     * must still fail at the canonical Transfer load boundary.
     */
    const missingTransferSourceId = await prisma.$transaction(
      async (tx: TransactionClient) =>
        createAuthorizedTransfer({
          suffix: "missing-transfer-source",

          fixtureId,

          client: tx,
        }),
    );

    transferIds.push(missingTransferSourceId);

    const missingTransferAssessmentId = await prisma.$transaction(
      async (tx: TransactionClient) =>
        recordCapacityAssessment({
          suffix: "missing-transfer",

          fixtureId,

          transferId: missingTransferSourceId,

          undetermined: false,

          client: tx,
        }),
    );

    assessmentIds.push(missingTransferAssessmentId);

    const missingTransferId = `missing-capacity-transfer-${fixtureId}`;

    let missingTransferError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        applyTreasuryTransferCapacityAssessmentDurablyWithClient({
          transferId: missingTransferId,

          assessmentId: missingTransferAssessmentId,

          eventId: `missing-capacity-transfer-event-${fixtureId}`,

          context: {
            commandId: `missing-capacity-transfer-command-${fixtureId}`,

            actorId: `smoke-durable-capacity-outcome-operator-${fixtureId}`,

            correlationId: `missing-capacity-transfer-correlation-${fixtureId}`,

            requestedAt: new Date("2026-08-21T21:07:00.000Z"),

            idempotencyKey: `missing-capacity-transfer-${fixtureId}`,
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
     * None of the failed application attempts may append a new
     * Transfer event.
     */
    const mismatchTransferEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: mismatchTransferId,
      },
    });

    assert.equal(mismatchTransferEventCount, 3);

    console.log(
      "✓ Durable Treasury Transfer Capacity Assessment application smoke test passed",
    );

    console.log({
      outcomes,

      invariants: {
        canonicalTransferLoaded: true,

        canonicalCapacityAssessmentLoaded: true,

        callerSuppliesAssessmentIdentityOnly: true,

        determinateCapacityProducesCapacityAssessedTransfer: true,

        undeterminedCapacityProducesCapacityUndeterminedTransfer: true,

        appliedTransferAdvancesToVersionFour: true,

        assessmentIdentityRetainedInOutcomeEvent: true,

        mismatchedAssessmentTransferRejected: true,

        missingAssessmentRejected: true,

        missingTransferRejected: true,

        failedApplicationAppendsNoTransferEvent: true,
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
     * Authority findings used to earn AUTHORIZED posture.
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
     * Transfer fixtures.
     */
    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: {
          in: transferIds,
        },
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: {
          in: transferIds,
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
