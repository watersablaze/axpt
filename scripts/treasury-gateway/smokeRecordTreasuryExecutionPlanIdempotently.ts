import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { persistTreasuryGatewayCommandReceiptWithClient } from "../../src/domains/treasury/gateway/commands/persistence/persistTreasuryGatewayCommandReceiptWithClient";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EXECUTION_KIND } from "../../src/domains/treasury/gateway/executions/contracts";

import { recordTreasuryExecutionPlanIdempotentlyWithClient } from "../../src/domains/treasury/gateway/execution-plans/application/recordTreasuryExecutionPlanIdempotentlyWithClient";

import {
  EXECUTABLE_TRANCHE_STATUS,
  TREASURY_EXECUTION_PLAN_STATUS,
} from "../../src/domains/treasury/gateway/execution-plans/status";

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

      reference: `AXPT-EXECUTION-PLAN-IDEMPOTENT-${suffix}-${fixtureId}`,

      eventId: `execution-plan-idempotent-transfer-created-${suffix}-${fixtureId}`,

      context: {
        commandId: `execution-plan-idempotent-transfer-create-command-${suffix}-${fixtureId}`,

        actorId: `execution-plan-idempotent-transfer-creator-${fixtureId}`,

        correlationId: `execution-plan-idempotent-transfer-create-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-24T18:00:00.000Z"),

        idempotencyKey: `execution-plan-idempotent-transfer-create-${suffix}-${fixtureId}`,
      },

      payload: {
        programId: `execution-plan-idempotent-program-${fixtureId}`,

        source: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

          programAccountId: `execution-plan-idempotent-source-${fixtureId}`,
        },

        destination: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

          settlementEndpointId: `execution-plan-idempotent-destination-${fixtureId}`,
        },

        requestedAmount: {
          amount: "1000000.00",

          currency: "USD",
        },

        destinationCurrency: "USD",

        purpose: `Idempotent Execution Plan smoke ${suffix}.`,
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

    eventId: `execution-plan-idempotent-review-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `execution-plan-idempotent-review-command-${suffix}-${fixtureId}`,

      actorId: `execution-plan-idempotent-reviewer-${fixtureId}`,

      correlationId: `execution-plan-idempotent-review-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-24T18:01:00.000Z"),

      idempotencyKey: `execution-plan-idempotent-review-${suffix}-${fixtureId}`,
    },

    client,
  });

  const authorityAssessmentId = `execution-plan-idempotent-authority-assessment-${suffix}-${fixtureId}`;

  await recordTransferAuthorityAssessmentDurablyWithClient({
    request: {
      assessmentId: authorityAssessmentId,

      eventId: `execution-plan-idempotent-authority-assessment-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `execution-plan-idempotent-authority-assessment-command-${suffix}-${fixtureId}`,

        actorId: `execution-plan-idempotent-authority-assessor-${fixtureId}`,

        correlationId: `execution-plan-idempotent-authority-assessment-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-24T18:02:00.000Z"),

        idempotencyKey: `execution-plan-idempotent-authority-assessment-${suffix}-${fixtureId}`,
      },

      payload: {
        transferId,

        result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,

        evidenceArtifactIds: [
          `execution-plan-idempotent-authority-evidence-${suffix}-${fixtureId}`,
        ],

        assessedAt: new Date("2026-08-24T18:01:30.000Z"),
      },
    },

    client,
  });

  await applyTreasuryTransferAuthorityAssessmentDurablyWithClient({
    transferId,

    assessmentId: authorityAssessmentId,

    eventId: `execution-plan-idempotent-authority-application-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `execution-plan-idempotent-authority-application-command-${suffix}-${fixtureId}`,

      actorId: `execution-plan-idempotent-authority-applicator-${fixtureId}`,

      correlationId: `execution-plan-idempotent-authority-application-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-24T18:03:00.000Z"),

      idempotencyKey: `execution-plan-idempotent-authority-application-${suffix}-${fixtureId}`,
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

      eventId: `execution-plan-idempotent-capacity-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `execution-plan-idempotent-capacity-command-${suffix}-${fixtureId}`,

        actorId: `execution-plan-idempotent-capacity-assessor-${fixtureId}`,

        correlationId: `execution-plan-idempotent-capacity-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-24T18:04:00.000Z"),

        idempotencyKey: `execution-plan-idempotent-capacity-${suffix}-${fixtureId}`,
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
              `execution-plan-idempotent-source-evidence-${suffix}-${fixtureId}`,
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
              `execution-plan-idempotent-rail-evidence-${suffix}-${fixtureId}`,
            ],
          },

          {
            type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.CONVERSION,

            status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.NOT_REQUIRED,

            evidenceReferenceIds: [],
          },
        ],

        assessedAt: new Date("2026-08-24T18:03:30.000Z"),

        notes: `Idempotent Execution Plan Capacity fixture ${suffix}.`,
      },
    },

    client,
  });

  await applyTreasuryTransferCapacityAssessmentDurablyWithClient({
    transferId,

    assessmentId: capacityAssessmentId,

    eventId: `execution-plan-idempotent-capacity-application-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `execution-plan-idempotent-capacity-application-command-${suffix}-${fixtureId}`,

      actorId: `execution-plan-idempotent-capacity-applicator-${fixtureId}`,

      correlationId: `execution-plan-idempotent-capacity-application-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-24T18:05:00.000Z"),

      idempotencyKey: `execution-plan-idempotent-capacity-application-${suffix}-${fixtureId}`,
    },

    client,
  });
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const transferId = `execution-plan-idempotent-transfer-${fixtureId}`;

  const capacityAssessmentId = `execution-plan-idempotent-capacity-${fixtureId}`;

  const atomicityTransferId = `execution-plan-idempotent-atomic-transfer-${fixtureId}`;

  const atomicityCapacityAssessmentId = `execution-plan-idempotent-atomic-capacity-${fixtureId}`;

  const planId = `execution-plan-idempotent-plan-${fixtureId}`;

  const atomicityPlanId = `execution-plan-idempotent-atomic-plan-${fixtureId}`;

  const trancheId = `execution-plan-idempotent-tranche-${fixtureId}`;

  const atomicityTrancheId = `execution-plan-idempotent-atomic-tranche-${fixtureId}`;

  const actorId = `execution-plan-idempotent-planner-${fixtureId}`;

  const idempotencyKey = `execution-plan-idempotent-key-${fixtureId}`;

  const atomicityIdempotencyKey = `execution-plan-idempotent-atomic-key-${fixtureId}`;

  const conflictingCommandId = `execution-plan-idempotent-conflicting-command-${fixtureId}`;

  const seedReceiptKey = `execution-plan-idempotent-seed-receipt-${fixtureId}`;

  const baseRequest = {
    planId,

    eventId: `execution-plan-idempotent-plan-event-${fixtureId}`,

    context: {
      commandId: `execution-plan-idempotent-plan-command-${fixtureId}`,

      actorId,

      correlationId: `execution-plan-idempotent-plan-correlation-${fixtureId}`,

      requestedAt: new Date("2026-08-24T18:06:00.000Z"),

      idempotencyKey,
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
          trancheId,

          sequence: 1,

          amount: {
            amount: "600000.00",

            currency: "USD",
          },

          executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

          allocationId: `execution-plan-idempotent-allocation-${fixtureId}`,

          settlementEndpointId: `execution-plan-idempotent-destination-${fixtureId}`,

          purpose: "Idempotent Execution Plan tranche.",
        },
      ],

      plannedAt: new Date("2026-08-24T18:05:30.000Z"),

      notes: "Idempotent Treasury Execution Plan smoke.",
    },
  } as const;

  try {
    /*
     * Both target Transfers independently traverse the canonical
     * lifecycle through CAPACITY_ASSESSED @ v4.
     */
    await prisma.$transaction(async (tx: TransactionClient) => {
      await createCapacityAssessedTransfer({
        transferId,

        capacityAssessmentId,

        suffix: "primary",

        fixtureId,

        client: tx,
      });

      await createCapacityAssessedTransfer({
        transferId: atomicityTransferId,

        capacityAssessmentId: atomicityCapacityAssessmentId,

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

    assert.equal(
      targetTransfer.status,
      TREASURY_TRANSFER_STATUS.CAPACITY_ASSESSED,
    );

    assert.equal(targetTransfer.version, 4);

    /*
     * First substantive Plan recording.
     */
    const first = await prisma.$transaction(async (tx: TransactionClient) =>
      recordTreasuryExecutionPlanIdempotentlyWithClient({
        request: baseRequest,

        client: tx,
      }),
    );

    assert.equal(first.disposition, "RECORDED");

    assert.equal(first.aggregate.id, planId);

    assert.equal(first.aggregate.transferId, transferId);

    assert.equal(first.aggregate.capacityAssessmentId, capacityAssessmentId);

    assert.equal(
      first.aggregate.status,
      TREASURY_EXECUTION_PLAN_STATUS.RECORDED,
    );

    assert.equal(first.aggregate.metadata.version, 1);

    assert.deepEqual(first.aggregate.plannedAmount, {
      amount: "600000.00",

      currency: "USD",
    });

    assert.equal(first.aggregate.tranches.length, 1);

    assert.equal(
      first.aggregate.tranches[0]?.status,
      EXECUTABLE_TRANCHE_STATUS.PLANNED,
    );

    /*
     * Exact retry proposes different generated transport identities.
     *
     * Plan payload remains materially identical, including trancheId.
     * Treasury must return the original canonical Plan.
     */
    const proposedRetryPlanId = `execution-plan-idempotent-retry-proposed-plan-${fixtureId}`;

    const retry = await prisma.$transaction(async (tx: TransactionClient) =>
      recordTreasuryExecutionPlanIdempotentlyWithClient({
        request: {
          ...baseRequest,

          planId: proposedRetryPlanId,

          eventId: `execution-plan-idempotent-retry-event-${fixtureId}`,

          context: {
            ...baseRequest.context,

            commandId: `execution-plan-idempotent-retry-command-${fixtureId}`,

            correlationId: `execution-plan-idempotent-retry-correlation-${fixtureId}`,

            requestedAt: new Date("2026-08-24T18:07:00.000Z"),
          },
        },

        client: tx,
      }),
    );

    assert.equal(retry.disposition, "REPLAYED");

    assert.equal(retry.aggregate.id, planId);

    assert.notEqual(retry.aggregate.id, proposedRetryPlanId);

    assert.equal(retry.aggregate.transferId, transferId);

    assert.equal(retry.aggregate.capacityAssessmentId, capacityAssessmentId);

    assert.equal(retry.aggregate.metadata.version, 1);

    assert.deepEqual(
      retry.aggregate.plannedAmount,
      first.aggregate.plannedAmount,
    );

    assert.deepEqual(retry.aggregate.tranches, first.aggregate.tranches);

    const aggregateCount = await prisma.treasuryGatewayAggregate.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

        aggregateId: planId,
      },
    });

    const eventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

        aggregateId: planId,
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
     * Same idempotency key with materially altered Plan content
     * must be rejected.
     */
    const collisionRequests = [
      {
        label: "planned-amount",

        request: {
          ...baseRequest,

          payload: {
            ...baseRequest.payload,

            plannedAmount: {
              amount: "500000.00",

              currency: "USD",
            },

            tranches: [
              {
                ...baseRequest.payload.tranches[0],

                amount: {
                  amount: "500000.00",

                  currency: "USD",
                },
              },
            ],
          },
        },
      },

      {
        label: "tranche-id",

        request: {
          ...baseRequest,

          payload: {
            ...baseRequest.payload,

            tranches: [
              {
                ...baseRequest.payload.tranches[0],

                trancheId: `execution-plan-idempotent-changed-tranche-${fixtureId}`,
              },
            ],
          },
        },
      },

      {
        label: "tranche-amount",

        request: {
          ...baseRequest,

          payload: {
            ...baseRequest.payload,

            plannedAmount: {
              amount: "500000.00",

              currency: "USD",
            },

            tranches: [
              {
                ...baseRequest.payload.tranches[0],

                amount: {
                  amount: "500000.00",

                  currency: "USD",
                },
              },
            ],
          },
        },
      },

      {
        label: "tranche-sequence",

        request: {
          ...baseRequest,

          payload: {
            ...baseRequest.payload,

            tranches: [
              {
                ...baseRequest.payload.tranches[0],

                sequence: 2,
              },
            ],
          },
        },
      },

      {
        label: "execution-kind",

        request: {
          ...baseRequest,

          payload: {
            ...baseRequest.payload,

            tranches: [
              {
                ...baseRequest.payload.tranches[0],

                executionKind: TREASURY_EXECUTION_KIND.OTHER,
              },
            ],
          },
        },
      },

      {
        label: "allocation",

        request: {
          ...baseRequest,

          payload: {
            ...baseRequest.payload,

            tranches: [
              {
                ...baseRequest.payload.tranches[0],

                allocationId: `execution-plan-idempotent-changed-allocation-${fixtureId}`,
              },
            ],
          },
        },
      },

      {
        label: "settlement-endpoint",

        request: {
          ...baseRequest,

          payload: {
            ...baseRequest.payload,

            tranches: [
              {
                ...baseRequest.payload.tranches[0],

                settlementEndpointId: `execution-plan-idempotent-changed-endpoint-${fixtureId}`,
              },
            ],
          },
        },
      },

      {
        label: "purpose",

        request: {
          ...baseRequest,

          payload: {
            ...baseRequest.payload,

            tranches: [
              {
                ...baseRequest.payload.tranches[0],

                purpose: "Materially changed Execution Plan tranche purpose.",
              },
            ],
          },
        },
      },

      {
        label: "planned-at",

        request: {
          ...baseRequest,

          payload: {
            ...baseRequest.payload,

            plannedAt: new Date("2026-08-24T18:08:00.000Z"),
          },
        },
      },

      {
        label: "notes",

        request: {
          ...baseRequest,

          payload: {
            ...baseRequest.payload,

            notes: "Materially changed Treasury Execution Plan notes.",
          },
        },
      },

      {
        label: "actor",

        request: {
          ...baseRequest,

          context: {
            ...baseRequest.context,

            actorId: `execution-plan-idempotent-different-planner-${fixtureId}`,
          },
        },
      },
    ] as const;

    for (const collisionCase of collisionRequests) {
      let collisionError: unknown;

      try {
        await prisma.$transaction(async (tx: TransactionClient) =>
          recordTreasuryExecutionPlanIdempotentlyWithClient({
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
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

          aggregateId: planId,
        },
      });

    const eventCountAfterCollisions = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

        aggregateId: planId,
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
     * Recording or replaying a Plan must not advance Transfer posture.
     */
    const targetTransferAfter =
      await prisma.treasuryGatewayAggregate.findUnique({
        where: {
          aggregateType_aggregateId: {
            aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

            aggregateId: transferId,
          },
        },
      });

    assert(targetTransferAfter);

    assert.equal(
      targetTransferAfter.status,
      TREASURY_TRANSFER_STATUS.CAPACITY_ASSESSED,
    );

    assert.equal(targetTransferAfter.version, 4);

    /*
     * Atomicity proof.
     *
     * Seed a receipt with the commandId the next Plan request will
     * attempt to persist.
     *
     * The Plan aggregate and event are created before receipt
     * persistence. Receipt persistence must then fail on commandId
     * uniqueness.
     *
     * Because all three writes share the caller's Prisma transaction,
     * Plan aggregate + event must roll back as well.
     */
    await prisma.$transaction(async (tx: TransactionClient) =>
      persistTreasuryGatewayCommandReceiptWithClient({
        receipt: {
          idempotencyKey: seedReceiptKey,

          commandId: conflictingCommandId,

          commandKind: "ATOMICITY_SEED",

          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

          aggregateId: `execution-plan-idempotent-atomicity-seed-${fixtureId}`,

          actorId,

          correlationId: `execution-plan-idempotent-atomicity-seed-correlation-${fixtureId}`,

          requestFingerprint: `execution-plan-idempotent-atomicity-seed-fingerprint-${fixtureId}`,
        },

        client: tx,
      }),
    );

    let atomicityError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        recordTreasuryExecutionPlanIdempotentlyWithClient({
          request: {
            planId: atomicityPlanId,

            eventId: `execution-plan-idempotent-atomic-event-${fixtureId}`,

            context: {
              commandId: conflictingCommandId,

              actorId,

              correlationId: `execution-plan-idempotent-atomic-correlation-${fixtureId}`,

              requestedAt: new Date("2026-08-24T18:08:00.000Z"),

              idempotencyKey: atomicityIdempotencyKey,
            },

            payload: {
              transferId: atomicityTransferId,

              capacityAssessmentId: atomicityCapacityAssessmentId,

              plannedAmount: {
                amount: "600000.00",

                currency: "USD",
              },

              destinationCurrency: "USD",

              tranches: [
                {
                  trancheId: atomicityTrancheId,

                  sequence: 1,

                  amount: {
                    amount: "600000.00",

                    currency: "USD",
                  },

                  executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

                  allocationId: `execution-plan-idempotent-atomic-allocation-${fixtureId}`,

                  settlementEndpointId: `execution-plan-idempotent-destination-${fixtureId}`,

                  purpose: "Execution Plan atomic rollback proof.",
                },
              ],

              plannedAt: new Date("2026-08-24T18:07:30.000Z"),

              notes: "Execution Plan atomic rollback proof.",
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
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

        aggregateId: atomicityPlanId,
      },
    });

    const atomicEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

        aggregateId: atomicityPlanId,
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
     * Failed Plan transaction must leave its already-capacity-assessed
     * Transfer intact.
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

    assert.equal(
      atomicityTransfer.status,
      TREASURY_TRANSFER_STATUS.CAPACITY_ASSESSED,
    );

    assert.equal(atomicityTransfer.version, 4);

    console.log(
      "✓ Idempotent Treasury Execution Plan recording smoke test passed",
    );

    console.log({
      planId,

      firstDisposition: first.disposition,

      retryDisposition: retry.disposition,

      plan: {
        status: retry.aggregate.status,

        version: retry.aggregate.metadata.version,

        plannedAmount: retry.aggregate.plannedAmount,

        trancheStatus: retry.aggregate.tranches[0]?.status,
      },

      targetTransfer: {
        id: targetTransferAfter.aggregateId,

        status: targetTransferAfter.status,

        version: targetTransferAfter.version,
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

        targetTransferStatus: atomicityTransfer.status,

        targetTransferVersion: atomicityTransfer.version,
      },

      invariants: {
        capacityAssessedTransferRequiredForPlanning: true,

        firstPlanRecorded: true,

        commandReceiptPersisted: true,

        exactRetryReplayed: true,

        retryReturnsOriginalCanonicalPlanIdentity: true,

        exactRetryCreatesNoAggregate: true,

        exactRetryAppendsNoEvent: true,

        changedPlannedAmountRejected: true,

        changedTrancheIdentityRejected: true,

        changedTrancheAmountRejected: true,

        changedTrancheSequenceRejected: true,

        changedExecutionKindRejected: true,

        changedAllocationRejected: true,

        changedSettlementEndpointRejected: true,

        changedPurposeRejected: true,

        changedPlannedAtRejected: true,

        changedNotesRejected: true,

        changedActorRejected: true,

        failedCollisionsChangeNothingDurable: true,

        planRemainsRecordedAtVersionOne: true,

        trancheRemainsPlanned: true,

        recordingAndReplayDoNotAdvanceTransfer: true,

        planEventAndReceiptCommitAtomically: true,

        failedAtomicPlanLeavesCapacityAssessedTransferIntact: true,
      },
    });
  } finally {
    /*
     * Command receipts.
     */
    await prisma.treasuryGatewayCommandReceipt.deleteMany({
      where: {
        OR: [
          {
            idempotencyKey: {
              contains: fixtureId,
            },
          },

          {
            correlationId: {
              contains: fixtureId,
            },
          },
        ],
      },
    });

    /*
     * Execution Plans.
     */
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

    /*
     * Capacity Assessments.
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
     * Authority Assessments.
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
     * Transfers.
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
