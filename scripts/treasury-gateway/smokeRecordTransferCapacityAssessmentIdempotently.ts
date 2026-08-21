import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { persistTreasuryGatewayCommandReceiptWithClient } from "../../src/domains/treasury/gateway/commands/persistence/persistTreasuryGatewayCommandReceiptWithClient";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { recordTransferCapacityAssessmentIdempotentlyWithClient } from "../../src/domains/treasury/gateway/transfer-capacity-assessments/application/recordTransferCapacityAssessmentIdempotentlyWithClient";

import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
} from "../../src/domains/treasury/gateway/transfer-capacity-assessments/contracts";

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

  client: TransactionClient;
}): Promise<void> {
  const { transferId, suffix, fixtureId, client } = params;

  await originateTreasuryTransferDurablyWithClient({
    request: {
      transferId,

      reference: `AXPT-CAPACITY-IDEMPOTENT-${suffix}-${fixtureId}`,

      eventId: `capacity-idempotent-transfer-created-${suffix}-${fixtureId}`,

      context: {
        commandId: `capacity-idempotent-transfer-create-command-${suffix}-${fixtureId}`,

        actorId: `capacity-idempotent-transfer-creator-${fixtureId}`,

        correlationId: `capacity-idempotent-transfer-create-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-21T20:00:00.000Z"),

        idempotencyKey: `capacity-idempotent-transfer-create-${suffix}-${fixtureId}`,
      },

      payload: {
        programId: `capacity-idempotent-program-${fixtureId}`,

        source: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

          programAccountId: `capacity-idempotent-source-${fixtureId}`,
        },

        destination: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

          settlementEndpointId: `capacity-idempotent-destination-${fixtureId}`,
        },

        requestedAmount: {
          amount: "1000000.00",

          currency: "USD",
        },

        destinationCurrency: "USD",

        purpose: `Idempotent Capacity Assessment smoke ${suffix}.`,
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

    eventId: `capacity-idempotent-review-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `capacity-idempotent-review-command-${suffix}-${fixtureId}`,

      actorId: `capacity-idempotent-reviewer-${fixtureId}`,

      correlationId: `capacity-idempotent-review-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-21T20:01:00.000Z"),

      idempotencyKey: `capacity-idempotent-review-${suffix}-${fixtureId}`,
    },

    client,
  });

  const authorityAssessmentId = `capacity-idempotent-authority-assessment-${suffix}-${fixtureId}`;

  await recordTransferAuthorityAssessmentDurablyWithClient({
    request: {
      assessmentId: authorityAssessmentId,

      eventId: `capacity-idempotent-authority-assessment-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `capacity-idempotent-authority-assessment-command-${suffix}-${fixtureId}`,

        actorId: `capacity-idempotent-authority-assessor-${fixtureId}`,

        correlationId: `capacity-idempotent-authority-assessment-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-21T20:02:00.000Z"),

        idempotencyKey: `capacity-idempotent-authority-assessment-${suffix}-${fixtureId}`,
      },

      payload: {
        transferId,

        result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,

        evidenceArtifactIds: [
          `capacity-idempotent-authority-evidence-${suffix}-${fixtureId}`,
        ],

        assessedAt: new Date("2026-08-21T20:01:30.000Z"),
      },
    },

    client,
  });

  await applyTreasuryTransferAuthorityAssessmentDurablyWithClient({
    transferId,

    assessmentId: authorityAssessmentId,

    eventId: `capacity-idempotent-authority-application-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `capacity-idempotent-authority-application-command-${suffix}-${fixtureId}`,

      actorId: `capacity-idempotent-authority-applicator-${fixtureId}`,

      correlationId: `capacity-idempotent-authority-application-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-21T20:03:00.000Z"),

      idempotencyKey: `capacity-idempotent-authority-application-${suffix}-${fixtureId}`,
    },

    client,
  });
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const transferId = `capacity-idempotent-transfer-${fixtureId}`;

  const atomicityTransferId = `capacity-idempotent-atomic-transfer-${fixtureId}`;

  const assessmentId = `capacity-idempotent-assessment-${fixtureId}`;

  const atomicityAssessmentId = `capacity-idempotent-atomic-assessment-${fixtureId}`;

  const actorId = `capacity-idempotent-assessor-${fixtureId}`;

  const idempotencyKey = `capacity-idempotent-assessment-${fixtureId}`;

  const atomicityIdempotencyKey = `capacity-idempotent-atomic-key-${fixtureId}`;

  const conflictingCommandId = `capacity-idempotent-conflicting-command-${fixtureId}`;

  const seedReceiptKey = `capacity-idempotent-seed-receipt-${fixtureId}`;

  const evidenceReferenceIds = [
    `capacity-idempotent-source-evidence-${fixtureId}`,
    `capacity-idempotent-rail-evidence-${fixtureId}`,
  ] as const;

  const baseRequest = {
    assessmentId,

    eventId: `capacity-idempotent-assessment-event-${fixtureId}`,

    context: {
      commandId: `capacity-idempotent-assessment-command-${fixtureId}`,

      actorId,

      correlationId: `capacity-idempotent-assessment-correlation-${fixtureId}`,

      requestedAt: new Date("2026-08-21T20:04:00.000Z"),

      idempotencyKey,
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

      assessedAt: new Date("2026-08-21T20:03:30.000Z"),

      notes: "Idempotent Capacity Assessment smoke.",
    },
  } as const;

  try {
    /*
     * Both Capacity Assessment targets independently earn
     * AUTHORIZED posture through the canonical Transfer lifecycle.
     */
    await prisma.$transaction(async (tx: TransactionClient) => {
      await originateTransfer({
        transferId,

        suffix: "primary",

        fixtureId,

        client: tx,
      });

      await authorizeTransfer({
        transferId,

        suffix: "primary",

        fixtureId,

        client: tx,
      });

      await originateTransfer({
        transferId: atomicityTransferId,

        suffix: "atomicity",

        fixtureId,

        client: tx,
      });

      await authorizeTransfer({
        transferId: atomicityTransferId,

        suffix: "atomicity",

        fixtureId,

        client: tx,
      });
    });

    const targetTransfer = await prisma.treasuryGatewayAggregate.findUnique({
      where: {
        aggregateType_aggregateId: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

          aggregateId: transferId,
        },
      },
    });

    assert(targetTransfer);

    assert.equal(targetTransfer.status, TREASURY_TRANSFER_STATUS.AUTHORIZED);

    assert.equal(targetTransfer.version, 3);

    /*
     * First substantive Capacity finding.
     */
    const first = await prisma.$transaction(async (tx: TransactionClient) =>
      recordTransferCapacityAssessmentIdempotentlyWithClient({
        request: baseRequest,

        client: tx,
      }),
    );

    assert.equal(first.disposition, "RECORDED");

    assert.equal(first.aggregate.id, assessmentId);

    assert.equal(first.aggregate.transferId, transferId);

    assert.equal(first.aggregate.metadata.version, 1);

    assert.deepEqual(first.aggregate.executableNow, {
      amount: "600000.00",

      currency: "USD",
    });

    /*
     * Exact retry deliberately proposes a different generated
     * assessment identity.
     *
     * Treasury must resolve the accepted command receipt and
     * return the original canonical Capacity Assessment.
     */
    const proposedRetryAssessmentId = `capacity-idempotent-retry-proposed-assessment-${fixtureId}`;

    const retry = await prisma.$transaction(async (tx: TransactionClient) =>
      recordTransferCapacityAssessmentIdempotentlyWithClient({
        request: {
          ...baseRequest,

          assessmentId: proposedRetryAssessmentId,

          eventId: `capacity-idempotent-retry-event-${fixtureId}`,

          context: {
            ...baseRequest.context,

            commandId: `capacity-idempotent-retry-command-${fixtureId}`,

            correlationId: `capacity-idempotent-retry-correlation-${fixtureId}`,

            requestedAt: new Date("2026-08-21T20:05:00.000Z"),
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

    assert.deepEqual(retry.aggregate.executableNow, {
      amount: "600000.00",

      currency: "USD",
    });

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

    const receiptCount = await prisma.treasuryGatewayCommandReceipt.count({
      where: {
        idempotencyKey,
      },
    });

    assert.equal(aggregateCount, 1);

    assert.equal(eventCount, 1);

    assert.equal(receiptCount, 1);

    /*
     * Same idempotency key with materially altered Capacity
     * judgment must be rejected.
     */
    const collisionRequests = [
      {
        label: "constraint-status",

        request: {
          ...baseRequest,

          payload: {
            ...baseRequest.payload,

            constraints: [
              {
                ...baseRequest.payload.constraints[0],

                status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.NOT_REQUIRED,
              },

              baseRequest.payload.constraints[1],

              baseRequest.payload.constraints[2],
            ],
          },
        },
      },

      {
        label: "constraint-limit",

        request: {
          ...baseRequest,

          payload: {
            ...baseRequest.payload,

            constraints: [
              baseRequest.payload.constraints[0],

              {
                ...baseRequest.payload.constraints[1],

                limit: {
                  amount: "500000.00",

                  currency: "USD",
                },
              },

              baseRequest.payload.constraints[2],
            ],
          },
        },
      },

      {
        label: "evidence",

        request: {
          ...baseRequest,

          payload: {
            ...baseRequest.payload,

            constraints: [
              {
                ...baseRequest.payload.constraints[0],

                evidenceReferenceIds: [
                  evidenceReferenceIds[0],

                  `capacity-idempotent-changed-evidence-${fixtureId}`,
                ],
              },

              baseRequest.payload.constraints[1],

              baseRequest.payload.constraints[2],
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

            notes: "Materially changed Capacity Assessment notes.",
          },
        },
      },

      {
        label: "actor",

        request: {
          ...baseRequest,

          context: {
            ...baseRequest.context,

            actorId: `capacity-idempotent-different-assessor-${fixtureId}`,
          },
        },
      },
    ] as const;

    for (const collisionCase of collisionRequests) {
      let collisionError: unknown;

      try {
        await prisma.$transaction(async (tx: TransactionClient) =>
          recordTransferCapacityAssessmentIdempotentlyWithClient({
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
          aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_CAPACITY_ASSESSMENT,

          aggregateId: assessmentId,
        },
      });

    const eventCountAfterCollisions = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_CAPACITY_ASSESSMENT,

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
     * The atomicity Transfer has independently reached AUTHORIZED,
     * so Capacity lifecycle validation will pass.
     *
     * Seed a command receipt using the commandId that the new
     * Capacity Assessment will attempt to use.
     *
     * Assessment aggregate and event persistence happen before
     * command-receipt persistence. Receipt persistence must fail
     * on commandId uniqueness.
     *
     * Because assessment + event + receipt share one Prisma
     * transaction, the new assessment and event must roll back.
     */
    await prisma.$transaction(async (tx: TransactionClient) =>
      persistTreasuryGatewayCommandReceiptWithClient({
        receipt: {
          idempotencyKey: seedReceiptKey,

          commandId: conflictingCommandId,

          commandKind: "ATOMICITY_SEED",

          aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_CAPACITY_ASSESSMENT,

          aggregateId: `capacity-idempotent-atomicity-seed-${fixtureId}`,

          actorId,

          correlationId: `capacity-idempotent-atomicity-seed-correlation-${fixtureId}`,

          requestFingerprint: `capacity-idempotent-atomicity-seed-fingerprint-${fixtureId}`,
        },

        client: tx,
      }),
    );

    let atomicityError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        recordTransferCapacityAssessmentIdempotentlyWithClient({
          request: {
            ...baseRequest,

            assessmentId: atomicityAssessmentId,

            eventId: `capacity-idempotent-atomic-event-${fixtureId}`,

            context: {
              ...baseRequest.context,

              commandId: conflictingCommandId,

              correlationId: `capacity-idempotent-atomic-correlation-${fixtureId}`,

              idempotencyKey: atomicityIdempotencyKey,
            },

            payload: {
              ...baseRequest.payload,

              transferId: atomicityTransferId,

              assessedAt: new Date("2026-08-21T20:06:00.000Z"),

              notes: "Capacity Assessment atomic rollback proof.",
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
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_CAPACITY_ASSESSMENT,

        aggregateId: atomicityAssessmentId,
      },
    });

    const atomicEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_CAPACITY_ASSESSMENT,

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
     * The failed Capacity Assessment transaction must not disturb
     * the already-authorized Transfer it was attempting to assess.
     */
    const atomicityTransfer = await prisma.treasuryGatewayAggregate.findUnique({
      where: {
        aggregateType_aggregateId: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

          aggregateId: atomicityTransferId,
        },
      },
    });

    assert(atomicityTransfer);

    assert.equal(atomicityTransfer.status, TREASURY_TRANSFER_STATUS.AUTHORIZED);

    assert.equal(atomicityTransfer.version, 3);

    console.log(
      "✓ Idempotent Transfer Capacity Assessment recording smoke test passed",
    );

    console.log({
      assessmentId,

      firstDisposition: first.disposition,

      retryDisposition: retry.disposition,

      targetTransfer: {
        id: transferId,

        status: targetTransfer.status,

        version: targetTransfer.version,
      },

      executableNow: retry.aggregate.executableNow,

      durableState: {
        aggregates: aggregateCountAfterCollisions,

        events: eventCountAfterCollisions,

        receipts: receiptCountAfterCollisions,
      },

      atomicFailureState: {
        aggregates: atomicAggregateCount,

        events: atomicEventCount,

        receipts: atomicReceiptCount,

        targetTransferStatus: atomicityTransfer.status,

        targetTransferVersion: atomicityTransfer.version,
      },

      invariants: {
        authorizedTransferRequiredForCapacityAssessment: true,

        firstFindingRecorded: true,

        commandReceiptPersisted: true,

        exactRetryReplayed: true,

        retryReturnsOriginalCanonicalAssessmentIdentity: true,

        executableCapacityStableAcrossReplay: true,

        exactRetryCreatesNoAggregate: true,

        exactRetryAppendsNoEvent: true,

        changedConstraintStatusRejected: true,

        changedConstraintLimitRejected: true,

        changedEvidenceRejected: true,

        changedNotesRejected: true,

        changedAssessorRejected: true,

        failedCollisionsChangeNothingDurable: true,

        atomicityFixturePassedLifecycleValidation: true,

        assessmentEventAndReceiptCommitAtomically: true,

        failedAtomicAssessmentLeavesAuthorizedTransferIntact: true,
      },
    });
  } finally {
    /*
     * Idempotency receipts, including the deliberate atomicity seed.
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
     * Authority findings used to earn AUTHORIZED posture for both
     * canonical Transfer fixtures.
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
