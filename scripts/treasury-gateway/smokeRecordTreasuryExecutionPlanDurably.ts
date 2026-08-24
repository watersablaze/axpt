import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { TREASURY_EXECUTION_KIND } from "../../src/domains/treasury/gateway/executions/contracts";

import { recordTreasuryExecutionPlanDurablyWithClient } from "../../src/domains/treasury/gateway/execution-plans/application/recordTreasuryExecutionPlanDurablyWithClient";

import { loadTreasuryExecutionPlanWithClient } from "../../src/domains/treasury/gateway/execution-plans/persistence/loadTreasuryExecutionPlanWithClient";

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

      reference: `AXPT-EXECUTION-PLAN-DURABLE-${suffix}-${fixtureId}`,

      eventId: `execution-plan-durable-transfer-created-${suffix}-${fixtureId}`,

      context: {
        commandId: `execution-plan-durable-transfer-create-command-${suffix}-${fixtureId}`,

        actorId: `execution-plan-durable-transfer-creator-${fixtureId}`,

        correlationId: `execution-plan-durable-transfer-create-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-24T18:00:00.000Z"),

        idempotencyKey: `execution-plan-durable-transfer-create-${suffix}-${fixtureId}`,
      },

      payload: {
        programId: `execution-plan-durable-program-${fixtureId}`,

        source: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,

          programAccountId: `execution-plan-durable-source-${fixtureId}`,
        },

        destination: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,

          settlementEndpointId: `execution-plan-durable-destination-${fixtureId}`,
        },

        requestedAmount: {
          amount: "1000000.00",

          currency: "USD",
        },

        destinationCurrency: "USD",

        purpose: `Execution Plan durability smoke ${suffix}.`,
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

    eventId: `execution-plan-durable-review-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `execution-plan-durable-review-command-${suffix}-${fixtureId}`,

      actorId: `execution-plan-durable-reviewer-${fixtureId}`,

      correlationId: `execution-plan-durable-review-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-24T18:01:00.000Z"),

      idempotencyKey: `execution-plan-durable-review-${suffix}-${fixtureId}`,
    },

    client,
  });

  const assessmentId = `execution-plan-durable-authority-assessment-${suffix}-${fixtureId}`;

  await recordTransferAuthorityAssessmentDurablyWithClient({
    request: {
      assessmentId,

      eventId: `execution-plan-durable-authority-assessment-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `execution-plan-durable-authority-assessment-command-${suffix}-${fixtureId}`,

        actorId: `execution-plan-durable-authority-assessor-${fixtureId}`,

        correlationId: `execution-plan-durable-authority-assessment-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-24T18:02:00.000Z"),

        idempotencyKey: `execution-plan-durable-authority-assessment-${suffix}-${fixtureId}`,
      },

      payload: {
        transferId,

        result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,

        evidenceArtifactIds: [
          `execution-plan-durable-authority-evidence-${suffix}-${fixtureId}`,
        ],

        assessedAt: new Date("2026-08-24T18:01:30.000Z"),
      },
    },

    client,
  });

  await applyTreasuryTransferAuthorityAssessmentDurablyWithClient({
    transferId,

    assessmentId,

    eventId: `execution-plan-durable-authority-application-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `execution-plan-durable-authority-application-command-${suffix}-${fixtureId}`,

      actorId: `execution-plan-durable-authority-applicator-${fixtureId}`,

      correlationId: `execution-plan-durable-authority-application-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-24T18:03:00.000Z"),

      idempotencyKey: `execution-plan-durable-authority-application-${suffix}-${fixtureId}`,
    },

    client,
  });
}

async function recordCapacityAssessment(params: {
  transferId: string;

  assessmentId: string;

  suffix: string;

  fixtureId: string;

  undetermined?: boolean;

  client: TransactionClient;
}): Promise<void> {
  const {
    transferId,
    assessmentId,
    suffix,
    fixtureId,
    undetermined = false,
    client,
  } = params;

  await recordTransferCapacityAssessmentDurablyWithClient({
    request: {
      assessmentId,

      eventId: `execution-plan-durable-capacity-event-${suffix}-${fixtureId}`,

      context: {
        commandId: `execution-plan-durable-capacity-command-${suffix}-${fixtureId}`,

        actorId: `execution-plan-durable-capacity-assessor-${fixtureId}`,

        correlationId: `execution-plan-durable-capacity-correlation-${suffix}-${fixtureId}`,

        requestedAt: new Date("2026-08-24T18:04:00.000Z"),

        idempotencyKey: `execution-plan-durable-capacity-${suffix}-${fixtureId}`,
      },

      payload: {
        transferId,

        requestedAmount: {
          amount: "1000000.00",

          currency: "USD",
        },

        constraints: undetermined
          ? [
              {
                type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.SOURCE_FUNDS,

                status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

                limit: {
                  amount: "850000.00",

                  currency: "USD",
                },

                evidenceReferenceIds: [
                  `execution-plan-durable-source-evidence-${suffix}-${fixtureId}`,
                ],
              },

              {
                type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.RAIL,

                status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.UNDETERMINED,

                evidenceReferenceIds: [
                  `execution-plan-durable-rail-evidence-${suffix}-${fixtureId}`,
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
                  `execution-plan-durable-source-evidence-${suffix}-${fixtureId}`,
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
                  `execution-plan-durable-rail-evidence-${suffix}-${fixtureId}`,
                ],
              },

              {
                type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.CONVERSION,

                status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.NOT_REQUIRED,

                evidenceReferenceIds: [],
              },
            ],

        assessedAt: new Date("2026-08-24T18:03:30.000Z"),

        notes: `Execution Plan Capacity fixture ${suffix}.`,
      },
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

  await recordCapacityAssessment({
    transferId,

    assessmentId: capacityAssessmentId,

    suffix,

    fixtureId,

    client,
  });

  await applyTreasuryTransferCapacityAssessmentDurablyWithClient({
    transferId,

    assessmentId: capacityAssessmentId,

    eventId: `execution-plan-durable-capacity-application-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `execution-plan-durable-capacity-application-command-${suffix}-${fixtureId}`,

      actorId: `execution-plan-durable-capacity-applicator-${fixtureId}`,

      correlationId: `execution-plan-durable-capacity-application-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-24T18:05:00.000Z"),

      idempotencyKey: `execution-plan-durable-capacity-application-${suffix}-${fixtureId}`,
    },

    client,
  });
}

async function createCapacityUndeterminedTransfer(params: {
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

  await recordCapacityAssessment({
    transferId,

    assessmentId: capacityAssessmentId,

    suffix,

    fixtureId,

    undetermined: true,

    client,
  });

  await applyTreasuryTransferCapacityAssessmentDurablyWithClient({
    transferId,

    assessmentId: capacityAssessmentId,

    eventId: `execution-plan-durable-capacity-application-event-${suffix}-${fixtureId}`,

    context: {
      commandId: `execution-plan-durable-capacity-application-command-${suffix}-${fixtureId}`,

      actorId: `execution-plan-durable-capacity-applicator-${fixtureId}`,

      correlationId: `execution-plan-durable-capacity-application-correlation-${suffix}-${fixtureId}`,

      requestedAt: new Date("2026-08-24T18:05:00.000Z"),

      idempotencyKey: `execution-plan-durable-capacity-application-${suffix}-${fixtureId}`,
    },

    client,
  });
}

function createPlanPayload(params: {
  transferId: string;

  capacityAssessmentId: string;

  fixtureId: string;

  suffix: string;

  plannedAmount?: string;

  trancheAmount?: string;

  trancheCurrency?: string;

  tranches?: readonly {
    trancheId: string;

    sequence: number;

    amount: {
      amount: string;

      currency: string;
    };

    executionKind: typeof TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER;

    allocationId: string;

    settlementEndpointId: string;

    purpose: string;
  }[];
}) {
  const {
    transferId,
    capacityAssessmentId,
    fixtureId,
    suffix,
    plannedAmount = "600000.00",
    trancheAmount = "600000.00",
    trancheCurrency = "USD",
    tranches,
  } = params;

  return {
    transferId,

    capacityAssessmentId,

    plannedAmount: {
      amount: plannedAmount,

      currency: "USD",
    },

    destinationCurrency: "USD",

    tranches: tranches ?? [
      {
        trancheId: `execution-plan-durable-tranche-${suffix}-${fixtureId}`,

        sequence: 1,

        amount: {
          amount: trancheAmount,

          currency: trancheCurrency,
        },

        executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

        allocationId: `execution-plan-durable-allocation-${suffix}-${fixtureId}`,

        settlementEndpointId: `execution-plan-durable-destination-${fixtureId}`,

        purpose: `Execution Plan tranche ${suffix}.`,
      },
    ],

    plannedAt: new Date("2026-08-24T18:06:00.000Z"),

    notes: `Durable Execution Plan smoke ${suffix}.`,
  };
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const targetTransferId = `execution-plan-durable-target-transfer-${fixtureId}`;

  const targetCapacityAssessmentId = `execution-plan-durable-target-capacity-${fixtureId}`;

  const foreignTransferId = `execution-plan-durable-foreign-transfer-${fixtureId}`;

  const foreignCapacityAssessmentId = `execution-plan-durable-foreign-capacity-${fixtureId}`;

  const undeterminedTransferId = `execution-plan-durable-undetermined-transfer-${fixtureId}`;

  const undeterminedCapacityAssessmentId = `execution-plan-durable-undetermined-capacity-${fixtureId}`;

  const wrongPostureTransferId = `execution-plan-durable-wrong-posture-transfer-${fixtureId}`;

  const missingTransferId = `execution-plan-durable-missing-transfer-${fixtureId}`;

  const missingCapacityAssessmentId = `execution-plan-durable-missing-capacity-${fixtureId}`;

  const planId = `execution-plan-durable-plan-${fixtureId}`;

  const actorId = `execution-plan-durable-planner-${fixtureId}`;

  const invalidPlanIds = [
    `execution-plan-durable-missing-transfer-plan-${fixtureId}`,
    `execution-plan-durable-wrong-posture-plan-${fixtureId}`,
    `execution-plan-durable-missing-capacity-plan-${fixtureId}`,
    `execution-plan-durable-mismatched-capacity-plan-${fixtureId}`,
    `execution-plan-durable-undetermined-plan-${fixtureId}`,
    `execution-plan-durable-over-capacity-plan-${fixtureId}`,
    `execution-plan-durable-empty-tranches-plan-${fixtureId}`,
    `execution-plan-durable-duplicate-sequence-plan-${fixtureId}`,
    `execution-plan-durable-currency-mismatch-plan-${fixtureId}`,
    `execution-plan-durable-tranche-total-plan-${fixtureId}`,
  ];

  const transferIds = [
    targetTransferId,
    foreignTransferId,
    undeterminedTransferId,
    wrongPostureTransferId,
  ];

  try {
    /*
     * Canonical fixture construction.
     */
    await prisma.$transaction(async (tx: TransactionClient) => {
      await createCapacityAssessedTransfer({
        transferId: targetTransferId,

        capacityAssessmentId: targetCapacityAssessmentId,

        suffix: "target",

        fixtureId,

        client: tx,
      });

      await createCapacityAssessedTransfer({
        transferId: foreignTransferId,

        capacityAssessmentId: foreignCapacityAssessmentId,

        suffix: "foreign",

        fixtureId,

        client: tx,
      });

      await createCapacityUndeterminedTransfer({
        transferId: undeterminedTransferId,

        capacityAssessmentId: undeterminedCapacityAssessmentId,

        suffix: "undetermined",

        fixtureId,

        client: tx,
      });

      /*
       * Wrong-posture fixture stops at AUTHORIZED @ v3.
       */
      await originateTransfer({
        transferId: wrongPostureTransferId,

        suffix: "wrong-posture",

        fixtureId,

        client: tx,
      });

      await authorizeTransfer({
        transferId: wrongPostureTransferId,

        suffix: "wrong-posture",

        fixtureId,

        client: tx,
      });
    });

    const targetTransferBefore =
      await prisma.treasuryGatewayAggregate.findUnique({
        where: {
          aggregateType_aggregateId: {
            aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

            aggregateId: targetTransferId,
          },
        },
      });

    assert(targetTransferBefore);

    assert.equal(
      targetTransferBefore.status,
      TREASURY_TRANSFER_STATUS.CAPACITY_ASSESSED,
    );

    assert.equal(targetTransferBefore.version, 4);

    const undeterminedTransfer =
      await prisma.treasuryGatewayAggregate.findUnique({
        where: {
          aggregateType_aggregateId: {
            aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

            aggregateId: undeterminedTransferId,
          },
        },
      });

    assert(undeterminedTransfer);

    assert.equal(
      undeterminedTransfer.status,
      TREASURY_TRANSFER_STATUS.CAPACITY_UNDETERMINED,
    );

    /*
     * Missing Transfer.
     */
    let missingTransferError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        recordTreasuryExecutionPlanDurablyWithClient({
          request: {
            planId: invalidPlanIds[0],

            eventId: `execution-plan-durable-missing-transfer-event-${fixtureId}`,

            context: {
              commandId: `execution-plan-durable-missing-transfer-command-${fixtureId}`,

              actorId,

              correlationId: `execution-plan-durable-missing-transfer-correlation-${fixtureId}`,

              requestedAt: new Date("2026-08-24T18:07:00.000Z"),

              idempotencyKey: `execution-plan-durable-missing-transfer-${fixtureId}`,
            },

            payload: createPlanPayload({
              transferId: missingTransferId,

              capacityAssessmentId: targetCapacityAssessmentId,

              fixtureId,

              suffix: "missing-transfer",
            }),
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
     * Wrong Transfer posture.
     */
    let wrongPostureError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        recordTreasuryExecutionPlanDurablyWithClient({
          request: {
            planId: invalidPlanIds[1],

            eventId: `execution-plan-durable-wrong-posture-event-${fixtureId}`,

            context: {
              commandId: `execution-plan-durable-wrong-posture-command-${fixtureId}`,

              actorId,

              correlationId: `execution-plan-durable-wrong-posture-correlation-${fixtureId}`,

              requestedAt: new Date("2026-08-24T18:07:00.000Z"),

              idempotencyKey: `execution-plan-durable-wrong-posture-${fixtureId}`,
            },

            payload: createPlanPayload({
              transferId: wrongPostureTransferId,

              capacityAssessmentId: targetCapacityAssessmentId,

              fixtureId,

              suffix: "wrong-posture",
            }),
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      wrongPostureError = error;
    }

    assertErrorCode(
      wrongPostureError,
      "TREASURY_EXECUTION_PLAN_TRANSFER_STATUS_INVALID",
    );

    /*
     * Missing canonical Capacity Assessment.
     */
    let missingCapacityAssessmentError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        recordTreasuryExecutionPlanDurablyWithClient({
          request: {
            planId: invalidPlanIds[2],

            eventId: `execution-plan-durable-missing-capacity-event-${fixtureId}`,

            context: {
              commandId: `execution-plan-durable-missing-capacity-command-${fixtureId}`,

              actorId,

              correlationId: `execution-plan-durable-missing-capacity-correlation-${fixtureId}`,

              requestedAt: new Date("2026-08-24T18:07:00.000Z"),

              idempotencyKey: `execution-plan-durable-missing-capacity-${fixtureId}`,
            },

            payload: createPlanPayload({
              transferId: targetTransferId,

              capacityAssessmentId: missingCapacityAssessmentId,

              fixtureId,

              suffix: "missing-capacity",
            }),
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      missingCapacityAssessmentError = error;
    }

    assertErrorCode(
      missingCapacityAssessmentError,
      "TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_NOT_FOUND",
    );

    /*
     * Capacity Assessment from another Transfer.
     */
    let mismatchedCapacityAssessmentError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        recordTreasuryExecutionPlanDurablyWithClient({
          request: {
            planId: invalidPlanIds[3],

            eventId: `execution-plan-durable-mismatched-capacity-event-${fixtureId}`,

            context: {
              commandId: `execution-plan-durable-mismatched-capacity-command-${fixtureId}`,

              actorId,

              correlationId: `execution-plan-durable-mismatched-capacity-correlation-${fixtureId}`,

              requestedAt: new Date("2026-08-24T18:07:00.000Z"),

              idempotencyKey: `execution-plan-durable-mismatched-capacity-${fixtureId}`,
            },

            payload: createPlanPayload({
              transferId: targetTransferId,

              capacityAssessmentId: foreignCapacityAssessmentId,

              fixtureId,

              suffix: "mismatched-capacity",
            }),
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      mismatchedCapacityAssessmentError = error;
    }

    assertErrorCode(
      mismatchedCapacityAssessmentError,
      "TREASURY_EXECUTION_PLAN_TRANSFER_MISMATCH",
    );

    /*
     * CAPACITY_UNDETERMINED may not enter planning.
     */
    let undeterminedCapacityError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        recordTreasuryExecutionPlanDurablyWithClient({
          request: {
            planId: invalidPlanIds[4],

            eventId: `execution-plan-durable-undetermined-event-${fixtureId}`,

            context: {
              commandId: `execution-plan-durable-undetermined-command-${fixtureId}`,

              actorId,

              correlationId: `execution-plan-durable-undetermined-correlation-${fixtureId}`,

              requestedAt: new Date("2026-08-24T18:07:00.000Z"),

              idempotencyKey: `execution-plan-durable-undetermined-${fixtureId}`,
            },

            payload: createPlanPayload({
              transferId: undeterminedTransferId,

              capacityAssessmentId: undeterminedCapacityAssessmentId,

              fixtureId,

              suffix: "undetermined",
            }),
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      undeterminedCapacityError = error;
    }

    assertErrorCode(
      undeterminedCapacityError,
      "TREASURY_EXECUTION_PLAN_TRANSFER_STATUS_INVALID",
    );

    /*
     * Planned amount may not exceed canonical executable capacity.
     */
    let overCapacityError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        recordTreasuryExecutionPlanDurablyWithClient({
          request: {
            planId: invalidPlanIds[5],

            eventId: `execution-plan-durable-over-capacity-event-${fixtureId}`,

            context: {
              commandId: `execution-plan-durable-over-capacity-command-${fixtureId}`,

              actorId,

              correlationId: `execution-plan-durable-over-capacity-correlation-${fixtureId}`,

              requestedAt: new Date("2026-08-24T18:07:00.000Z"),

              idempotencyKey: `execution-plan-durable-over-capacity-${fixtureId}`,
            },

            payload: createPlanPayload({
              transferId: targetTransferId,

              capacityAssessmentId: targetCapacityAssessmentId,

              fixtureId,

              suffix: "over-capacity",

              plannedAmount: "700000.00",

              trancheAmount: "700000.00",
            }),
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      overCapacityError = error;
    }

    assertErrorCode(
      overCapacityError,
      "TREASURY_EXECUTION_PLAN_EXCEEDS_EXECUTABLE_CAPACITY",
    );

    /*
     * At least one tranche is required.
     */
    let emptyTranchesError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        recordTreasuryExecutionPlanDurablyWithClient({
          request: {
            planId: invalidPlanIds[6],

            eventId: `execution-plan-durable-empty-tranches-event-${fixtureId}`,

            context: {
              commandId: `execution-plan-durable-empty-tranches-command-${fixtureId}`,

              actorId,

              correlationId: `execution-plan-durable-empty-tranches-correlation-${fixtureId}`,

              requestedAt: new Date("2026-08-24T18:07:00.000Z"),

              idempotencyKey: `execution-plan-durable-empty-tranches-${fixtureId}`,
            },

            payload: createPlanPayload({
              transferId: targetTransferId,

              capacityAssessmentId: targetCapacityAssessmentId,

              fixtureId,

              suffix: "empty-tranches",

              tranches: [],
            }),
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      emptyTranchesError = error;
    }

    assertErrorCode(
      emptyTranchesError,
      "TREASURY_EXECUTION_PLAN_TRANCHE_REQUIRED",
    );

    /*
     * Duplicate tranche sequences are invalid.
     */
    let duplicateSequenceError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        recordTreasuryExecutionPlanDurablyWithClient({
          request: {
            planId: invalidPlanIds[7],

            eventId: `execution-plan-durable-duplicate-sequence-event-${fixtureId}`,

            context: {
              commandId: `execution-plan-durable-duplicate-sequence-command-${fixtureId}`,

              actorId,

              correlationId: `execution-plan-durable-duplicate-sequence-correlation-${fixtureId}`,

              requestedAt: new Date("2026-08-24T18:07:00.000Z"),

              idempotencyKey: `execution-plan-durable-duplicate-sequence-${fixtureId}`,
            },

            payload: createPlanPayload({
              transferId: targetTransferId,

              capacityAssessmentId: targetCapacityAssessmentId,

              fixtureId,

              suffix: "duplicate-sequence",

              plannedAmount: "600000.00",

              tranches: [
                {
                  trancheId: `execution-plan-durable-duplicate-sequence-a-${fixtureId}`,

                  sequence: 1,

                  amount: {
                    amount: "300000.00",

                    currency: "USD",
                  },

                  executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

                  allocationId: `execution-plan-durable-allocation-a-${fixtureId}`,

                  settlementEndpointId: `execution-plan-durable-destination-${fixtureId}`,

                  purpose: "Duplicate sequence fixture A.",
                },

                {
                  trancheId: `execution-plan-durable-duplicate-sequence-b-${fixtureId}`,

                  sequence: 1,

                  amount: {
                    amount: "300000.00",

                    currency: "USD",
                  },

                  executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

                  allocationId: `execution-plan-durable-allocation-b-${fixtureId}`,

                  settlementEndpointId: `execution-plan-durable-destination-${fixtureId}`,

                  purpose: "Duplicate sequence fixture B.",
                },
              ],
            }),
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      duplicateSequenceError = error;
    }

    assertErrorCode(
      duplicateSequenceError,
      "TREASURY_EXECUTION_PLAN_DUPLICATE_TRANCHE_SEQUENCE",
    );

    /*
     * Tranche currency must match the planned amount currency.
     */
    let trancheCurrencyMismatchError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        recordTreasuryExecutionPlanDurablyWithClient({
          request: {
            planId: invalidPlanIds[8],

            eventId: `execution-plan-durable-currency-mismatch-event-${fixtureId}`,

            context: {
              commandId: `execution-plan-durable-currency-mismatch-command-${fixtureId}`,

              actorId,

              correlationId: `execution-plan-durable-currency-mismatch-correlation-${fixtureId}`,

              requestedAt: new Date("2026-08-24T18:07:00.000Z"),

              idempotencyKey: `execution-plan-durable-currency-mismatch-${fixtureId}`,
            },

            payload: createPlanPayload({
              transferId: targetTransferId,

              capacityAssessmentId: targetCapacityAssessmentId,

              fixtureId,

              suffix: "currency-mismatch",

              trancheCurrency: "EUR",
            }),
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      trancheCurrencyMismatchError = error;
    }

    assertErrorCode(
      trancheCurrencyMismatchError,
      "TREASURY_EXECUTION_PLAN_TRANCHE_CURRENCY_MISMATCH",
    );

    /*
     * Sum of all tranche amounts must equal plannedAmount.
     */
    let trancheTotalMismatchError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        recordTreasuryExecutionPlanDurablyWithClient({
          request: {
            planId: invalidPlanIds[9],

            eventId: `execution-plan-durable-tranche-total-event-${fixtureId}`,

            context: {
              commandId: `execution-plan-durable-tranche-total-command-${fixtureId}`,

              actorId,

              correlationId: `execution-plan-durable-tranche-total-correlation-${fixtureId}`,

              requestedAt: new Date("2026-08-24T18:07:00.000Z"),

              idempotencyKey: `execution-plan-durable-tranche-total-${fixtureId}`,
            },

            payload: createPlanPayload({
              transferId: targetTransferId,

              capacityAssessmentId: targetCapacityAssessmentId,

              fixtureId,

              suffix: "tranche-total",

              plannedAmount: "600000.00",

              trancheAmount: "500000.00",
            }),
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      trancheTotalMismatchError = error;
    }

    assertErrorCode(
      trancheTotalMismatchError,
      "TREASURY_EXECUTION_PLAN_TRANCHE_TOTAL_MISMATCH",
    );

    /*
     * Record the canonical Plan.
     */
    const recorded = await prisma.$transaction(async (tx: TransactionClient) =>
      recordTreasuryExecutionPlanDurablyWithClient({
        request: {
          planId,

          eventId: `execution-plan-durable-plan-event-${fixtureId}`,

          context: {
            commandId: `execution-plan-durable-plan-command-${fixtureId}`,

            actorId,

            correlationId: `execution-plan-durable-plan-correlation-${fixtureId}`,

            requestedAt: new Date("2026-08-24T18:07:00.000Z"),

            idempotencyKey: `execution-plan-durable-plan-${fixtureId}`,
          },

          payload: createPlanPayload({
            transferId: targetTransferId,

            capacityAssessmentId: targetCapacityAssessmentId,

            fixtureId,

            suffix: "canonical",
          }),
        },

        client: tx,
      }),
    );

    assert.equal(recorded.aggregate.id, planId);

    assert.equal(recorded.aggregate.transferId, targetTransferId);

    assert.equal(
      recorded.aggregate.capacityAssessmentId,
      targetCapacityAssessmentId,
    );

    assert.equal(
      recorded.aggregate.status,
      TREASURY_EXECUTION_PLAN_STATUS.RECORDED,
    );

    assert.equal(recorded.aggregate.metadata.version, 1);

    assert.equal(recorded.aggregate.plannedByActorId, actorId);

    assert.deepEqual(recorded.aggregate.plannedAmount, {
      amount: "600000.00",

      currency: "USD",
    });

    assert.equal(recorded.aggregate.destinationCurrency, "USD");

    assert.equal(recorded.aggregate.tranches.length, 1);

    const recordedTranche = recorded.aggregate.tranches[0];

    assert(recordedTranche);

    assert.equal(recordedTranche.sequence, 1);

    assert.deepEqual(recordedTranche.amount, {
      amount: "600000.00",

      currency: "USD",
    });

    assert.equal(
      recordedTranche.executionKind,
      TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,
    );

    assert.equal(recordedTranche.status, EXECUTABLE_TRANCHE_STATUS.PLANNED);

    assert.equal(
      recordedTranche.allocationId,
      `execution-plan-durable-allocation-canonical-${fixtureId}`,
    );

    assert.equal(
      recordedTranche.settlementEndpointId,
      `execution-plan-durable-destination-${fixtureId}`,
    );

    assert.equal(
      recorded.event.eventType,
      TREASURY_EVENT_TYPE.TREASURY_EXECUTION_PLAN_RECORDED,
    );

    assert.equal(recorded.event.aggregateVersion, 1);

    /*
     * Durable reload reconstructs the canonical Plan.
     */
    const loaded = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTreasuryExecutionPlanWithClient({
        planId,

        client: tx,
      }),
    );

    assert(loaded);

    assert.equal(loaded.aggregate.id, planId);

    assert.equal(loaded.aggregate.transferId, targetTransferId);

    assert.equal(
      loaded.aggregate.capacityAssessmentId,
      targetCapacityAssessmentId,
    );

    assert.equal(
      loaded.aggregate.status,
      TREASURY_EXECUTION_PLAN_STATUS.RECORDED,
    );

    assert.equal(loaded.aggregate.metadata.version, 1);

    assert.equal(loaded.aggregate.plannedByActorId, actorId);

    assert.deepEqual(
      loaded.aggregate.plannedAmount,
      recorded.aggregate.plannedAmount,
    );

    assert.deepEqual(loaded.aggregate.tranches, recorded.aggregate.tranches);

    assert.equal(
      loaded.aggregate.notes,
      "Durable Execution Plan smoke canonical.",
    );

    /*
     * Recording the Plan must not mutate Transfer posture.
     */
    const targetTransferAfter =
      await prisma.treasuryGatewayAggregate.findUnique({
        where: {
          aggregateType_aggregateId: {
            aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

            aggregateId: targetTransferId,
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
     * Duplicate Plan identity must be rejected and append no event.
     */
    let duplicatePlanError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        recordTreasuryExecutionPlanDurablyWithClient({
          request: {
            planId,

            eventId: `execution-plan-durable-duplicate-plan-event-${fixtureId}`,

            context: {
              commandId: `execution-plan-durable-duplicate-plan-command-${fixtureId}`,

              actorId,

              correlationId: `execution-plan-durable-duplicate-plan-correlation-${fixtureId}`,

              requestedAt: new Date("2026-08-24T18:08:00.000Z"),

              idempotencyKey: `execution-plan-durable-duplicate-plan-${fixtureId}`,
            },

            payload: createPlanPayload({
              transferId: targetTransferId,

              capacityAssessmentId: targetCapacityAssessmentId,

              fixtureId,

              suffix: "duplicate-plan",
            }),
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      duplicatePlanError = error;
    }

    assertErrorCode(
      duplicatePlanError,
      "TREASURY_GATEWAY_AGGREGATE_ALREADY_EXISTS",
    );

    /*
     * Durable counts.
     */
    const planAggregateCount = await prisma.treasuryGatewayAggregate.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

        aggregateId: planId,
      },
    });

    const planEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

        aggregateId: planId,
      },
    });

    const invalidPlanAggregateCount =
      await prisma.treasuryGatewayAggregate.count({
        where: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

          aggregateId: {
            in: invalidPlanIds,
          },
        },
      });

    const invalidPlanEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,

        aggregateId: {
          in: invalidPlanIds,
        },
      },
    });

    assert.equal(planAggregateCount, 1);

    assert.equal(planEventCount, 1);

    assert.equal(invalidPlanAggregateCount, 0);

    assert.equal(invalidPlanEventCount, 0);

    console.log(
      "✓ Durable Treasury Execution Plan recording smoke test passed",
    );

    console.log({
      plan: {
        id: loaded.aggregate.id,

        transferId: loaded.aggregate.transferId,

        capacityAssessmentId: loaded.aggregate.capacityAssessmentId,

        plannedAmount: loaded.aggregate.plannedAmount,

        destinationCurrency: loaded.aggregate.destinationCurrency,

        status: loaded.aggregate.status,

        version: loaded.aggregate.metadata.version,
      },

      tranche: {
        id: loaded.aggregate.tranches[0]?.id,

        sequence: loaded.aggregate.tranches[0]?.sequence,

        amount: loaded.aggregate.tranches[0]?.amount,

        executionKind: loaded.aggregate.tranches[0]?.executionKind,

        allocationId: loaded.aggregate.tranches[0]?.allocationId,

        settlementEndpointId:
          loaded.aggregate.tranches[0]?.settlementEndpointId,

        status: loaded.aggregate.tranches[0]?.status,
      },

      targetTransfer: {
        status: targetTransferAfter.status,

        version: targetTransferAfter.version,
      },

      durableState: {
        planAggregates: planAggregateCount,

        planEvents: planEventCount,

        invalidPlanAggregates: invalidPlanAggregateCount,

        invalidPlanEvents: invalidPlanEventCount,
      },

      invariants: {
        canonicalTransferRequired: true,

        capacityAssessedTransferRequired: true,

        missingTransferRejected: true,

        wrongTransferPostureRejected: true,

        canonicalCapacityAssessmentRequired: true,

        missingCapacityAssessmentRejected: true,

        mismatchedCapacityAssessmentRejected: true,

        undeterminedCapacityCannotBePlanned: true,

        executableCapacityCeilingEnforced: true,

        atLeastOneTrancheRequired: true,

        duplicateTrancheSequenceRejected: true,

        trancheCurrencyMustMatchPlannedAmount: true,

        trancheTotalMustEqualPlannedAmount: true,

        planRecordedAtVersionOne: true,

        planRecordedInRecordedPosture: true,

        trancheRecordedInPlannedPosture: true,

        planningActorRetained: true,

        capacityAssessmentIdentityRetained: true,

        allocationIdentityRetained: true,

        settlementEndpointIdentityRetained: true,

        executionKindRetained: true,

        durableReloadReconstructsPlan: true,

        recordingPlanDoesNotAdvanceTransfer: true,

        duplicatePlanIdentityRejected: true,

        failedPlansCreateNoAggregate: true,

        failedPlansAppendNoEvent: true,
      },
    });
  } finally {
    /*
     * Command receipts, if any fixture helper persisted them.
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
     * Transfer lifecycle fixtures.
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
