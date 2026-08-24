import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { persistTreasuryGatewayCommandReceiptWithClient } from "../../src/domains/treasury/gateway/commands/persistence/persistTreasuryGatewayCommandReceiptWithClient";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EXECUTION_KIND } from "../../src/domains/treasury/gateway/executions/contracts";

import { recordTreasuryExecutionPlanDurablyWithClient } from "../../src/domains/treasury/gateway/execution-plans/application/recordTreasuryExecutionPlanDurablyWithClient";

import { TREASURY_EXECUTION_PLAN_STATUS } from "../../src/domains/treasury/gateway/execution-plans/status";

import { recordTransferAuthorityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfer-authority-assessments/application/recordTransferAuthorityAssessmentDurablyWithClient";

import { TRANSFER_AUTHORITY_ASSESSMENT_RESULT } from "../../src/domains/treasury/gateway/transfer-authority-assessments/contracts";

import { recordTransferCapacityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfer-capacity-assessments/application/recordTransferCapacityAssessmentDurablyWithClient";

import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
} from "../../src/domains/treasury/gateway/transfer-capacity-assessments/contracts";

import { applyTreasuryExecutionPlanIdempotentlyWithClient } from "../../src/domains/treasury/gateway/transfers/application/applyTreasuryExecutionPlanIdempotentlyWithClient";

import { applyTreasuryTransferAuthorityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/applyTreasuryTransferAuthorityAssessmentDurablyWithClient";

import { applyTreasuryTransferCapacityAssessmentDurablyWithClient } from "../../src/domains/treasury/gateway/transfers/application/applyTreasuryTransferCapacityAssessmentDurablyWithClient";

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

      reference: `AXPT-EXECUTION-PLAN-APPLICATION-IDEMPOTENT-${suffix}-${fixtureId}`,

      eventId: `execution-plan-application-idempotent-created-${suffix}-${fixtureId}`,

      context: {
        commandId: `execution-plan-application-idempotent-create-command-${suffix}-${fixtureId}`,

        actorId: `execution-plan-application-idempotent-creator-${fixtureId}`,

        correlationId: `execution-plan-application-idempotent-create-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-24T20:00:00.000Z"),

        idempotencyKey: `execution-plan-application-idempotent-create-${suffix}-${fixtureId}`,
      },

      payload: {
        programId: `execution-plan-application-idempotent-program-${fixtureId}`,

        source: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

          programAccountId: `execution-plan-application-idempotent-source-${fixtureId}`,
        },

        destination: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

          settlementEndpointId: `execution-plan-application-idempotent-destination-${fixtureId}`,
        },

        requestedAmount: {
          amount: "1000000.00",

          currency: "USD",
        },

        destinationCurrency: "USD",

        purpose: `Idempotent Execution Plan application ${suffix}.`,
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

    eventId: `execution-plan-application-idempotent-review-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `execution-plan-application-idempotent-review-command-${suffix}-${fixtureId}`,

      actorId: `execution-plan-application-idempotent-reviewer-${fixtureId}`,

      correlationId: `execution-plan-application-idempotent-review-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-24T20:01:00.000Z"),

      idempotencyKey: `execution-plan-application-idempotent-review-${suffix}-${fixtureId}`,
    },

    client,
  });

  const authorityAssessmentId = `execution-plan-application-idempotent-authority-${suffix}-${fixtureId}`;

  await recordTransferAuthorityAssessmentDurablyWithClient({
    request: {
      assessmentId: authorityAssessmentId,

      eventId: `execution-plan-application-idempotent-authority-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `execution-plan-application-idempotent-authority-command-${suffix}-${fixtureId}`,

        actorId: `execution-plan-application-idempotent-authority-assessor-${fixtureId}`,

        correlationId: `execution-plan-application-idempotent-authority-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-24T20:02:00.000Z"),

        idempotencyKey: `execution-plan-application-idempotent-authority-${suffix}-${fixtureId}`,
      },

      payload: {
        transferId,

        result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,

        evidenceArtifactIds: [
          `execution-plan-application-idempotent-authority-evidence-${suffix}-${fixtureId}`,
        ],

        assessedAt: new Date("2026-08-24T20:01:30.000Z"),
      },
    },

    client,
  });

  await applyTreasuryTransferAuthorityAssessmentDurablyWithClient({
    transferId,

    assessmentId: authorityAssessmentId,

    eventId: `execution-plan-application-idempotent-authority-apply-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `execution-plan-application-idempotent-authority-apply-command-${suffix}-${fixtureId}`,

      actorId: `execution-plan-application-idempotent-authority-applicator-${fixtureId}`,

      correlationId: `execution-plan-application-idempotent-authority-apply-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-24T20:03:00.000Z"),

      idempotencyKey: `execution-plan-application-idempotent-authority-apply-${suffix}-${fixtureId}`,
    },

    client,
  });
}

async function createCapacityAssessedTransfer(params: {
  transferId: string;
  capacityAssessmentId: string;
  suffix: string;
  fixtureId: string;
  client: TransactionClient;
}): Promise<void> {
  const { transferId, capacityAssessmentId, suffix, fixtureId, client } =
    params;

  await originateTransfer({
    transferId,

    suffix,

    fixtureId,

    client,
  });

  await authorizeTransfer({
    transferId,

    suffix,

    fixtureId,

    client,
  });

  await recordTransferCapacityAssessmentDurablyWithClient({
    request: {
      assessmentId: capacityAssessmentId,

      eventId: `execution-plan-application-idempotent-capacity-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `execution-plan-application-idempotent-capacity-command-${suffix}-${fixtureId}`,

        actorId: `execution-plan-application-idempotent-capacity-assessor-${fixtureId}`,

        correlationId: `execution-plan-application-idempotent-capacity-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-24T20:04:00.000Z"),

        idempotencyKey: `execution-plan-application-idempotent-capacity-${suffix}-${fixtureId}`,
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
              `execution-plan-application-idempotent-source-evidence-${suffix}-${fixtureId}`,
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
              `execution-plan-application-idempotent-rail-evidence-${suffix}-${fixtureId}`,
            ],
          },
        ],

        assessedAt: new Date("2026-08-24T20:03:30.000Z"),

        notes: `Execution Plan application Capacity fixture ${suffix}.`,
      },
    },

    client,
  });

  await applyTreasuryTransferCapacityAssessmentDurablyWithClient({
    transferId,

    assessmentId: capacityAssessmentId,

    eventId: `execution-plan-application-idempotent-capacity-apply-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `execution-plan-application-idempotent-capacity-apply-command-${suffix}-${fixtureId}`,

      actorId: `execution-plan-application-idempotent-capacity-applicator-${fixtureId}`,

      correlationId: `execution-plan-application-idempotent-capacity-apply-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-24T20:05:00.000Z"),

      idempotencyKey: `execution-plan-application-idempotent-capacity-apply-${suffix}-${fixtureId}`,
    },

    client,
  });
}

async function recordPlan(params: {
  planId: string;
  transferId: string;
  capacityAssessmentId: string;
  suffix: string;
  fixtureId: string;
  actorId: string;
  client: TransactionClient;
}): Promise<void> {
  const {
    planId,
    transferId,
    capacityAssessmentId,
    suffix,
    fixtureId,
    actorId,
    client,
  } = params;

  const recorded = await recordTreasuryExecutionPlanDurablyWithClient({
    request: {
      planId,

      eventId: `execution-plan-application-idempotent-plan-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `execution-plan-application-idempotent-plan-command-${suffix}-${fixtureId}`,

        actorId,

        correlationId: `execution-plan-application-idempotent-plan-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-24T20:06:00.000Z"),

        idempotencyKey: `execution-plan-application-idempotent-plan-${suffix}-${fixtureId}`,
      },

      payload: {
        transferId,

        capacityAssessmentId,

        plannedAmount: {
          amount: "600000.00",

          currency: "USD",
        },

        destinationCurrency: "USD",

        tranches: [
          {
            trancheId: `execution-plan-application-idempotent-tranche-${suffix}-${fixtureId}`,

            sequence: 1,

            amount: {
              amount: "600000.00",

              currency: "USD",
            },

            executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

            allocationId: `execution-plan-application-idempotent-allocation-${suffix}-${fixtureId}`,

            settlementEndpointId: `execution-plan-application-idempotent-destination-${fixtureId}`,

            purpose: `Execution Plan application tranche ${suffix}.`,
          },
        ],

        plannedAt: new Date("2026-08-24T20:05:30.000Z"),

        notes: `Execution Plan application ${suffix}.`,
      },
    },

    client,
  });

  assert.equal(
    recorded.aggregate.status,
    TREASURY_EXECUTION_PLAN_STATUS.RECORDED,
  );
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const transferId = `execution-plan-application-idempotent-transfer-${fixtureId}`;

  const capacityAssessmentId = `execution-plan-application-idempotent-capacity-${fixtureId}`;

  const planId = `execution-plan-application-idempotent-plan-${fixtureId}`;

  const otherPlanId = `execution-plan-application-idempotent-other-plan-${fixtureId}`;

  const atomicityTransferId = `execution-plan-application-idempotent-atomic-transfer-${fixtureId}`;

  const atomicityCapacityAssessmentId = `execution-plan-application-idempotent-atomic-capacity-${fixtureId}`;

  const atomicityPlanId = `execution-plan-application-idempotent-atomic-plan-${fixtureId}`;

  const actorId = `execution-plan-application-idempotent-applicator-${fixtureId}`;

  const idempotencyKey = `execution-plan-application-idempotent-key-${fixtureId}`;

  const atomicityIdempotencyKey = `execution-plan-application-idempotent-atomic-key-${fixtureId}`;

  const seedReceiptKey = `execution-plan-application-idempotent-seed-${fixtureId}`;

  const conflictingCommandId = `execution-plan-application-idempotent-conflicting-command-${fixtureId}`;

  try {
    /*
     * Both targets independently reach CAPACITY_ASSESSED @ v4
     * and receive canonical RECORDED Plans.
     */
    await prisma.$transaction(async (tx: TransactionClient) => {
      await createCapacityAssessedTransfer({
        transferId,

        capacityAssessmentId,

        suffix: "primary",

        fixtureId,

        client: tx,
      });

      await recordPlan({
        planId,

        transferId,

        capacityAssessmentId,

        suffix: "primary",

        fixtureId,

        actorId,

        client: tx,
      });

      /*
       * A second valid Plan for the same Transfer exists only
       * to test changed-plan collision under the same application key.
       */
      await recordPlan({
        planId: otherPlanId,

        transferId,

        capacityAssessmentId,

        suffix: "other",

        fixtureId,

        actorId,

        client: tx,
      });

      await createCapacityAssessedTransfer({
        transferId: atomicityTransferId,

        capacityAssessmentId: atomicityCapacityAssessmentId,

        suffix: "atomicity",

        fixtureId,

        client: tx,
      });

      await recordPlan({
        planId: atomicityPlanId,

        transferId: atomicityTransferId,

        capacityAssessmentId: atomicityCapacityAssessmentId,

        suffix: "atomicity",

        fixtureId,

        actorId,

        client: tx,
      });
    });

    /*
     * First application.
     */
    const first = await prisma.$transaction(async (tx: TransactionClient) =>
      applyTreasuryExecutionPlanIdempotentlyWithClient({
        transferId,

        planId,

        eventId: `execution-plan-application-idempotent-apply-event-${fixtureId}`,

        context: {
          commandId: `execution-plan-application-idempotent-apply-command-${fixtureId}`,

          actorId,

          correlationId: `execution-plan-application-idempotent-apply-correlation-${fixtureId}`,

          requestedAt: new Date("2026-08-24T20:07:00.000Z"),

          idempotencyKey,
        },

        client: tx,
      }),
    );

    assert.equal(first.disposition, "APPLIED");

    assert.equal(first.aggregate.status, TREASURY_TRANSFER_STATUS.PLANNED);

    assert.equal(first.aggregate.metadata.version, 5);

    /*
     * Exact retry carries fresh transport identity but the
     * same material application: actor + transferId + planId.
     */
    const retry = await prisma.$transaction(async (tx: TransactionClient) =>
      applyTreasuryExecutionPlanIdempotentlyWithClient({
        transferId,

        planId,

        eventId: `execution-plan-application-idempotent-retry-event-${fixtureId}`,

        context: {
          commandId: `execution-plan-application-idempotent-retry-command-${fixtureId}`,

          actorId,

          correlationId: `execution-plan-application-idempotent-retry-correlation-${fixtureId}`,

          requestedAt: new Date("2026-08-24T20:08:00.000Z"),

          idempotencyKey,
        },

        client: tx,
      }),
    );

    assert.equal(retry.disposition, "REPLAYED");

    assert.equal(retry.aggregate.status, TREASURY_TRANSFER_STATUS.PLANNED);

    assert.equal(retry.aggregate.metadata.version, 5);

    const transferEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: transferId,
      },
    });

    const plannedEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: transferId,

        eventType: "TREASURY_TRANSFER_PLANNED",
      },
    });

    const receiptCount = await prisma.treasuryGatewayCommandReceipt.count({
      where: {
        idempotencyKey,
      },
    });

    assert.equal(transferEventCount, 5);

    assert.equal(plannedEventCount, 1);

    assert.equal(receiptCount, 1);

    /*
     * Same key + different Plan is a different material command.
     */
    let planCollisionError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        applyTreasuryExecutionPlanIdempotentlyWithClient({
          transferId,

          planId: otherPlanId,

          eventId: `execution-plan-application-idempotent-plan-collision-event-${fixtureId}`,

          context: {
            commandId: `execution-plan-application-idempotent-plan-collision-command-${fixtureId}`,

            actorId,

            correlationId: `execution-plan-application-idempotent-plan-collision-correlation-${fixtureId}`,

            requestedAt: new Date("2026-08-24T20:09:00.000Z"),

            idempotencyKey,
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      planCollisionError = error;
    }

    assertErrorCode(
      planCollisionError,
      "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION",
    );

    /*
     * Same key + different authenticated actor is also different.
     */
    let actorCollisionError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        applyTreasuryExecutionPlanIdempotentlyWithClient({
          transferId,

          planId,

          eventId: `execution-plan-application-idempotent-actor-collision-event-${fixtureId}`,

          context: {
            commandId: `execution-plan-application-idempotent-actor-collision-command-${fixtureId}`,

            actorId: `execution-plan-application-idempotent-other-applicator-${fixtureId}`,

            correlationId: `execution-plan-application-idempotent-actor-collision-correlation-${fixtureId}`,

            requestedAt: new Date("2026-08-24T20:09:30.000Z"),

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

    assert.equal(transferEventCountAfterCollisions, 5);

    assert.equal(receiptCountAfterCollisions, 1);

    /*
     * Atomicity proof.
     *
     * Seed a receipt using the commandId the Plan application
     * will attempt to persist.
     *
     * The Transfer transition to PLANNED occurs before command
     * receipt persistence inside the caller's Prisma transaction.
     * Receipt failure must roll the Transfer transition back.
     */
    await prisma.$transaction(async (tx: TransactionClient) =>
      persistTreasuryGatewayCommandReceiptWithClient({
        receipt: {
          idempotencyKey: seedReceiptKey,

          commandId: conflictingCommandId,

          commandKind: "ATOMICITY_SEED",

          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

          aggregateId: `execution-plan-application-idempotent-atomicity-seed-${fixtureId}`,

          actorId,

          correlationId: `execution-plan-application-idempotent-atomicity-seed-correlation-${fixtureId}`,

          requestFingerprint: `execution-plan-application-idempotent-atomicity-seed-fingerprint-${fixtureId}`,
        },

        client: tx,
      }),
    );

    let atomicityError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        applyTreasuryExecutionPlanIdempotentlyWithClient({
          transferId: atomicityTransferId,

          planId: atomicityPlanId,

          eventId: `execution-plan-application-idempotent-atomic-event-${fixtureId}`,

          context: {
            commandId: conflictingCommandId,

            actorId,

            correlationId: `execution-plan-application-idempotent-atomic-correlation-${fixtureId}`,

            requestedAt: new Date("2026-08-24T20:10:00.000Z"),

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

    assert.equal(
      atomicTransfer.status,
      TREASURY_TRANSFER_STATUS.CAPACITY_ASSESSED,
    );

    assert.equal(atomicTransfer.version, 4);

    const atomicTransferEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: atomicityTransferId,
      },
    });

    const atomicPlannedEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: atomicityTransferId,

        eventType: "TREASURY_TRANSFER_PLANNED",
      },
    });

    const atomicReceiptCount = await prisma.treasuryGatewayCommandReceipt.count(
      {
        where: {
          idempotencyKey: atomicityIdempotencyKey,
        },
      },
    );

    assert.equal(atomicTransferEventCount, 4);

    assert.equal(atomicPlannedEventCount, 0);

    assert.equal(atomicReceiptCount, 0);

    console.log(
      "✓ Idempotent Treasury Execution Plan application smoke test passed",
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

        plannedEvents: plannedEventCount,

        applicationReceipts: receiptCountAfterCollisions,
      },

      atomicFailureState: {
        transferStatus: atomicTransfer.status,

        transferVersion: atomicTransfer.version,

        transferEvents: atomicTransferEventCount,

        plannedEvents: atomicPlannedEventCount,

        applicationReceipts: atomicReceiptCount,
      },

      invariants: {
        firstApplicationApplied: true,

        exactRetryReplayed: true,

        exactRetryReturnsCanonicalTransfer: true,

        exactRetryDoesNotAdvanceVersion: true,

        exactRetryAppendsNoDuplicateTransferEvent: true,

        exactRetryAppendsNoDuplicatePlanningEvent: true,

        changedPlanWithSameKeyRejected: true,

        changedActorWithSameKeyRejected: true,

        failedCollisionsChangeNothingDurable: true,

        durableApplicationReceiptRetained: true,

        applicationTransitionAndReceiptCommitAtomically: true,

        failedAtomicApplicationLeavesTransferCapacityAssessed: true,

        failedAtomicApplicationAppendsNoPlanningEvent: true,
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
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

        aggregateId: {
          contains: fixtureId,
        },
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

        aggregateId: {
          contains: fixtureId,
        },
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
