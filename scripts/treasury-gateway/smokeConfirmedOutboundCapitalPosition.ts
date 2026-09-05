import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  PrismaClient,
  type TransactionClient,
} from "@prisma/client";

import {
  createTreasuryAllocationIdempotentlyWithClient,
} from "../../src/domains/treasury/gateway/allocations/application/createTreasuryAllocationIdempotentlyWithClient";

import {
  submitTreasuryAllocationForReviewDurablyWithClient,
} from "../../src/domains/treasury/gateway/allocations/application/submitTreasuryAllocationForReviewDurablyWithClient";

import {
  approveTreasuryAllocationDurablyWithClient,
} from "../../src/domains/treasury/gateway/allocations/application/approveTreasuryAllocationDurablyWithClient";

import {
  activateTreasuryAllocationDurablyWithClient,
} from "../../src/domains/treasury/gateway/allocations/application/activateTreasuryAllocationDurablyWithClient";

import {
  consumeTreasuryAllocationDurablyWithClient,
} from "../../src/domains/treasury/gateway/allocations/application/consumeTreasuryAllocationDurablyWithClient";

import {
  TREASURY_ALLOCATION_PURPOSE,
} from "../../src/domains/treasury/gateway/allocations/contracts";

import {
  TREASURY_ALLOCATION_STATUS,
} from "../../src/domains/treasury/gateway/allocations/status";

import {
  deriveConfirmedOutboundCapitalPosition,
} from "../../src/domains/treasury/gateway/executions/deriveConfirmedOutboundCapitalPosition";

import {
  getConfirmedOutboundCapitalPositionWithClient,
} from "../../src/domains/treasury/gateway/executions/application/getConfirmedOutboundCapitalPositionWithClient";

import {
  TREASURY_EXECUTION_KIND,
  type TreasuryExecution,
} from "../../src/domains/treasury/gateway/executions/contracts";

import {
  TREASURY_EXECUTION_STATUS,
} from "../../src/domains/treasury/gateway/executions/status";

import {
  TREASURY_AGGREGATE_TYPE,
} from "../../src/domains/treasury/gateway/events/aggregateTypes";

import type {
  TreasuryAllocation,
} from "../../src/domains/treasury/gateway/allocations/contracts";

const prisma = new PrismaClient();

const suffix = randomUUID();

const programId = `program-outbound-position-${suffix}`;

const otherProgramId = `program-outbound-position-other-${suffix}`;

const programAccountId = `program-account-outbound-position-${suffix}`;

const otherProgramAccountId =
  `program-account-outbound-position-other-${suffix}`;

const currency = "USDT";

const allocationA = `allocation-outbound-a-${suffix}`;
const allocationB = `allocation-outbound-b-${suffix}`;
const allocationOther = `allocation-outbound-other-${suffix}`;

const executionA1 = `execution-outbound-a1-${suffix}`;
const executionA2 = `execution-outbound-a2-${suffix}`;
const executionB = `execution-outbound-b-${suffix}`;
const executionInitiated = `execution-outbound-initiated-${suffix}`;
const executionOtherCurrency = `execution-outbound-eur-${suffix}`;
const executionOtherAccount = `execution-outbound-other-account-${suffix}`;

const aggregateIds = [
  allocationA,
  allocationB,
  allocationOther,
  executionA1,
  executionA2,
  executionB,
  executionInitiated,
  executionOtherCurrency,
  executionOtherAccount,
];

let clock = Date.parse("2026-09-05T14:00:00.000Z");

function nextDate(): Date {
  clock += 60_000;

  return new Date(clock);
}

function context(subject: string, action: string) {
  const requestedAt = nextDate();

  return {
    commandId: `command-${action}-${subject}`,

    idempotencyKey: `idempotency-${action}-${subject}`,

    actorId: `actor-${action}-${suffix}`,

    correlationId: `correlation-outbound-position-${suffix}`,

    requestedAt,
  };
}

async function createActiveAllocation(params: {
  allocationId: string;

  programId: string;

  sourceProgramAccountId: string;

  amount: string;

  currency: string;
}): Promise<TreasuryAllocation> {
  const {
    allocationId,
    programId: allocationProgramId,
    sourceProgramAccountId,
    amount,
    currency: allocationCurrency,
  } = params;

  await prisma.$transaction((client: TransactionClient) =>
    createTreasuryAllocationIdempotentlyWithClient({
      request: {
        allocationId,

        reference: `ALLOC-${allocationId}`,

        eventId: `event-create-${allocationId}`,

        context: context(allocationId, "create"),

        payload: {
          programId: allocationProgramId,

          sourceProgramAccountId,

          purposeType:
            TREASURY_ALLOCATION_PURPOSE.PROGRAM_OPERATIONS,

          amount: {
            amount,

            currency: allocationCurrency,
          },
        },
      },

      client,
    }),
  );

  await prisma.$transaction((client: TransactionClient) =>
    submitTreasuryAllocationForReviewDurablyWithClient({
      allocationId,

      eventId: `event-review-${allocationId}`,

      context: context(allocationId, "review"),

      client,
    }),
  );

  await prisma.$transaction((client: TransactionClient) =>
    approveTreasuryAllocationDurablyWithClient({
      allocationId,

      approvalIds: [`approval-${allocationId}`],

      eventId: `event-approve-${allocationId}`,

      context: context(allocationId, "approve"),

      client,
    }),
  );

  const active = await prisma.$transaction(
    (client: TransactionClient) =>
      activateTreasuryAllocationDurablyWithClient({
        allocationId,

        eventId: `event-activate-${allocationId}`,

        context: context(allocationId, "activate"),

        client,
      }),
  );

  assert.equal(
    active.aggregate.status,
    TREASURY_ALLOCATION_STATUS.ACTIVE,
  );

  return active.aggregate;
}

function makeExecution(params: {
  id: string;

  programId?: string;

  allocationId: string;

  amount: string;

  currency?: string;

  status: TreasuryExecution["status"];
}): TreasuryExecution {
  const now = nextDate();

  return {
    id: params.id,

    reference: `EXEC-${params.id}`,

    programId: params.programId ?? programId,

    allocationId: params.allocationId,

    kind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,

    amount: {
      amount: params.amount,

      currency: params.currency ?? currency,
    },

    purpose: "Confirmed outbound capital position smoke test",

    status: params.status,

    metadata: {
      createdAt: now,

      updatedAt: now,

      createdByActorId: `actor-create-execution-${suffix}`,

      lastModifiedByActorId: `actor-create-execution-${suffix}`,

      version: 1,
    },
  };
}

async function persistExecutionSnapshot(
  execution: TreasuryExecution,
): Promise<void> {
  await prisma.treasuryGatewayAggregate.create({
    data: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

      aggregateId: execution.id,

      version: execution.metadata.version,

      status: execution.status,

      snapshot: JSON.parse(JSON.stringify(execution)),
    },
  });
}

async function getPosition() {
  return prisma.$transaction((client: TransactionClient) =>
    getConfirmedOutboundCapitalPositionWithClient({
      programAccountId,

      currency,

      client,
    }),
  );
}

function assertAmount(
  actual: string,
  expected: string,
  label: string,
): void {
  assert.equal(
    actual,
    expected,
    `${label}: expected ${expected}, received ${actual}`,
  );
}

function assertErrorCode(error: unknown, code: string): void {
  assert(error instanceof Error);

  assert(
    error.message.includes(code),
    `Expected ${code}, received ${error.message}`,
  );
}

async function main(): Promise<void> {
  try {
    /*
     * No confirmed execution facts yet.
     */
    const empty = await getPosition();

    assertAmount(
      empty.confirmedOutboundAmount.amount,
      "0",
      "empty outbound position",
    );

    assert.deepEqual(empty.contributingExecutionIds, []);

    /*
     * Establish:
     *
     * A = 75,000
     * B = 30,000
     * Other account = 40,000
     */
    const activeA = await createActiveAllocation({
      allocationId: allocationA,

      programId,

      sourceProgramAccountId: programAccountId,

      amount: "75000.00",

      currency,
    });

    const activeB = await createActiveAllocation({
      allocationId: allocationB,

      programId,

      sourceProgramAccountId: programAccountId,

      amount: "30000.00",

      currency,
    });

    await createActiveAllocation({
      allocationId: allocationOther,

      programId: otherProgramId,

      sourceProgramAccountId: otherProgramAccountId,

      amount: "40000.00",

      currency,
    });

    /*
     * A1 = 25,000 confirmed.
     */
    const confirmedA1 = makeExecution({
      id: executionA1,

      allocationId: allocationA,

      amount: "25000.00",

      status: TREASURY_EXECUTION_STATUS.CONFIRMED,
    });

    await persistExecutionSnapshot(confirmedA1);

    const afterA1 = await getPosition();

    assertAmount(
      afterA1.confirmedOutboundAmount.amount,
      "25000",
      "after first confirmed execution",
    );

    assert.deepEqual(
      afterA1.contributingExecutionIds,
      [executionA1],
    );

    /*
     * A2 shares allocation A.
     *
     * Confirmed outbound position is about realized executions,
     * not unique allocations.
     */
    const confirmedA2 = makeExecution({
      id: executionA2,

      allocationId: allocationA,

      amount: "50000.00",

      status: TREASURY_EXECUTION_STATUS.CONFIRMED,
    });

    await persistExecutionSnapshot(confirmedA2);

    const afterA2 = await getPosition();

    assertAmount(
      afterA2.confirmedOutboundAmount.amount,
      "75000",
      "after shared-allocation confirmed executions",
    );

    assert.equal(afterA2.contributingExecutionIds.length, 2);

    assert(afterA2.contributingExecutionIds.includes(executionA1));

    assert(afterA2.contributingExecutionIds.includes(executionA2));

    /*
     * Fully consume allocation A.
     *
     * Its current commitment becomes zero, but the confirmed
     * outbound facts must remain effective.
     */
    await prisma.$transaction((client: TransactionClient) =>
      consumeTreasuryAllocationDurablyWithClient({
        allocationId: allocationA,

        amount: {
          amount: "75000.00",

          currency,
        },

        consumingSubjectType: "TREASURY_EXECUTION",

        consumingSubjectId: `execution-consumption-proof-${suffix}`,

        eventId: `event-consume-${allocationA}`,

        context: context(allocationA, "consume"),

        client,
      }),
    );

    const consumedARow =
      await prisma.treasuryGatewayAggregate.findUnique({
        where: {
          aggregateType_aggregateId: {
            aggregateType:
              TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,

            aggregateId: allocationA,
          },
        },
      });

    assert(consumedARow);

    assert.equal(
      consumedARow.status,
      TREASURY_ALLOCATION_STATUS.CONSUMED,
    );

    const afterAllocationConsumed = await getPosition();

    assertAmount(
      afterAllocationConsumed.confirmedOutboundAmount.amount,
      "75000",
      "after allocation becomes consumed",
    );

    /*
     * B adds another 10,000.
     *
     * Total realized outbound = 85,000.
     */
    const confirmedB = makeExecution({
      id: executionB,

      allocationId: allocationB,

      amount: "10000.00",

      status: TREASURY_EXECUTION_STATUS.CONFIRMED,
    });

    await persistExecutionSnapshot(confirmedB);

    const afterB = await getPosition();

    assertAmount(
      afterB.confirmedOutboundAmount.amount,
      "85000",
      "after allocation B confirmed execution",
    );

    assert.equal(afterB.contributingExecutionIds.length, 3);

    /*
     * INITIATED is not a realized outbound financial fact.
     */
    await persistExecutionSnapshot(
      makeExecution({
        id: executionInitiated,

        allocationId: allocationB,

        amount: "5000.00",

        status: TREASURY_EXECUTION_STATUS.INITIATED,
      }),
    );

    /*
     * Different currency is outside this projection.
     *
     * It still references a canonical allocation, so lineage
     * remains structurally complete.
     */
    await persistExecutionSnapshot(
      makeExecution({
        id: executionOtherCurrency,

        allocationId: allocationB,

        amount: "123.00",

        currency: "EUR",

        status: TREASURY_EXECUTION_STATUS.CONFIRMED,
      }),
    );

    /*
     * Different source Program Account is outside this projection.
     */
    await persistExecutionSnapshot(
      makeExecution({
        id: executionOtherAccount,

        programId: otherProgramId,

        allocationId: allocationOther,

        amount: "40000.00",

        status: TREASURY_EXECUTION_STATUS.CONFIRMED,
      }),
    );

    const afterExclusions = await getPosition();

    assertAmount(
      afterExclusions.confirmedOutboundAmount.amount,
      "85000",
      "after exclusion cases",
    );

    assert.equal(
      afterExclusions.contributingExecutionIds.length,
      3,
    );

    assert(
      !afterExclusions.contributingExecutionIds.includes(
        executionInitiated,
      ),
    );

    assert(
      !afterExclusions.contributingExecutionIds.includes(
        executionOtherCurrency,
      ),
    );

    assert(
      !afterExclusions.contributingExecutionIds.includes(
        executionOtherAccount,
      ),
    );

    /*
     * Pure-law integrity: execution/allocation linkage.
     */
    let allocationMismatchError: unknown;

    try {
      deriveConfirmedOutboundCapitalPosition({
        programAccountId,

        currency,

        contributions: [
          {
            execution: confirmedA1,

            allocation: activeB,
          },
        ],
      });
    } catch (error: unknown) {
      allocationMismatchError = error;
    }

    assertErrorCode(
      allocationMismatchError,
      "CONFIRMED_OUTBOUND_CAPITAL_POSITION_ALLOCATION_MISMATCH",
    );

    /*
     * Pure-law integrity: program lineage.
     */
    let programMismatchError: unknown;

    try {
      deriveConfirmedOutboundCapitalPosition({
        programAccountId,

        currency,

        contributions: [
          {
            execution: {
              ...confirmedA1,

              programId: otherProgramId,
            },

            allocation: activeA,
          },
        ],
      });
    } catch (error: unknown) {
      programMismatchError = error;
    }

    assertErrorCode(
      programMismatchError,
      "CONFIRMED_OUTBOUND_CAPITAL_POSITION_PROGRAM_MISMATCH",
    );

    /*
     * Pure-law integrity: duplicate realized fact cannot be
     * counted twice.
     */
    let duplicateError: unknown;

    try {
      deriveConfirmedOutboundCapitalPosition({
        programAccountId,

        currency,

        contributions: [
          {
            execution: confirmedA1,

            allocation: activeA,
          },

          {
            execution: confirmedA1,

            allocation: activeA,
          },
        ],
      });
    } catch (error: unknown) {
      duplicateError = error;
    }

    assertErrorCode(
      duplicateError,
      "CONFIRMED_OUTBOUND_CAPITAL_POSITION_DUPLICATE_EXECUTION",
    );

    /*
     * Persistence integrity:
     *
     * A corrupt CONFIRMED row must fail before currency filtering
     * can hide it.
     */
    const corruptExecutionId =
      `execution-outbound-corrupt-${suffix}`;

    aggregateIds.push(corruptExecutionId);

    const corruptExecution = makeExecution({
      id: corruptExecutionId,

      allocationId: allocationB,

      amount: "1.00",

      currency: "EUR",

      status: TREASURY_EXECUTION_STATUS.CONFIRMED,
    });

    await prisma.treasuryGatewayAggregate.create({
      data: {
        aggregateType:
          TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

        aggregateId: corruptExecution.id,

        version: corruptExecution.metadata.version + 1,

        status: corruptExecution.status,

        snapshot: JSON.parse(JSON.stringify(corruptExecution)),
      },
    });

    let corruptExecutionError: unknown;

    try {
      await getPosition();
    } catch (error: unknown) {
      corruptExecutionError = error;
    }

    assertErrorCode(
      corruptExecutionError,
      "TREASURY_GATEWAY_EXECUTION_SNAPSHOT_VERSION_MISMATCH",
    );

    await prisma.treasuryGatewayAggregate.delete({
      where: {
        aggregateType_aggregateId: {
          aggregateType:
            TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

          aggregateId: corruptExecutionId,
        },
      },
    });

    /*
     * Allocation snapshot corruption must likewise fail before
     * Program Account attribution can hide it.
     */
    const otherAllocationRow =
      await prisma.treasuryGatewayAggregate.findUnique({
        where: {
          aggregateType_aggregateId: {
            aggregateType:
              TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,

            aggregateId: allocationOther,
          },
        },
      });

    assert(otherAllocationRow);

    await prisma.treasuryGatewayAggregate.update({
      where: {
        aggregateType_aggregateId: {
          aggregateType:
            TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,

          aggregateId: allocationOther,
        },
      },

      data: {
        version: otherAllocationRow.version + 1,
      },
    });

    let corruptAllocationError: unknown;

    try {
      await getPosition();
    } catch (error: unknown) {
      corruptAllocationError = error;
    }

    assertErrorCode(
      corruptAllocationError,
      "TREASURY_GATEWAY_ALLOCATION_SNAPSHOT_VERSION_MISMATCH",
    );

    console.log(
      "✓ Treasury Gateway confirmed outbound capital position smoke test passed",
    );

    console.log({
      empty: empty.confirmedOutboundAmount.amount,

      afterFirstConfirmed:
        afterA1.confirmedOutboundAmount.amount,

      sharedAllocation:
        afterA2.confirmedOutboundAmount.amount,

      consumedAllocationStillEffective:
        afterAllocationConsumed.confirmedOutboundAmount.amount,

      finalConfirmedOutbound:
        afterExclusions.confirmedOutboundAmount.amount,

      contributingExecutionIds:
        afterExclusions.contributingExecutionIds,

      exclusions: {
        initiated: true,

        otherCurrency: true,

        otherProgramAccount: true,
      },

      integrity: {
        allocationMismatchRejected: true,

        programMismatchRejected: true,

        duplicateExecutionRejected: true,

        corruptExecutionRejectedBeforeFiltering: true,

        corruptAllocationRejectedBeforeAttribution: true,
      },
    });
  } finally {
    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateId: {
          in: aggregateIds,
        },
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateId: {
          in: aggregateIds,
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
