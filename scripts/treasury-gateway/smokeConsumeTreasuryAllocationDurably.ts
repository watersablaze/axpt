import { PrismaClient } from "@prisma/client";
import type { TransactionClient } from "@prisma/client";

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
  TREASURY_AGGREGATE_TYPE,
} from "../../src/domains/treasury/gateway/events/aggregateTypes";

import {
  TREASURY_EVENT_TYPE,
} from "../../src/domains/treasury/gateway/events/eventType";

const prisma = new PrismaClient();

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const allocationId = `allocation-consumption-smoke-${suffix}`;
const reference = `ALLOC-CONSUME-${suffix}`;

const programId = `program-consumption-${suffix}`;
const sourceProgramAccountId = `program-account-consumption-${suffix}`;

const proposerActorId = `actor-consumption-proposer-${suffix}`;
const reviewerActorId = `actor-consumption-reviewer-${suffix}`;
const approverActorId = `actor-consumption-approver-${suffix}`;
const activatorActorId = `actor-consumption-activator-${suffix}`;
const consumerActorId = `actor-consumption-consumer-${suffix}`;

const correlationId = `correlation-consumption-${suffix}`;

function context(params: {
  commandId: string;
  idempotencyKey: string;
  actorId: string;
  requestedAt: string;
}) {
  return {
    commandId: params.commandId,
    idempotencyKey: params.idempotencyKey,
    actorId: params.actorId,
    correlationId,
    requestedAt: new Date(params.requestedAt),
  };
}

async function loadDurableRow() {
  return prisma.treasuryGatewayAggregate.findUnique({
    where: {
      aggregateType_aggregateId: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,
        aggregateId: allocationId,
      },
    },
  });
}

async function main() {
  /*
   * Establish ACTIVE @ v4.
   */
  await prisma.$transaction((client: TransactionClient) =>
    createTreasuryAllocationIdempotentlyWithClient({
      request: {
        allocationId,
        reference,
        eventId: `event-create-${suffix}`,
        context: context({
          commandId: `command-create-${suffix}`,
          idempotencyKey: `idempotency-create-${suffix}`,
          actorId: proposerActorId,
          requestedAt: "2026-09-05T13:00:00.000Z",
        }),
        payload: {
          programId,
          sourceProgramAccountId,
          purposeType: TREASURY_ALLOCATION_PURPOSE.PROGRAM_OPERATIONS,
          amount: {
            amount: "75000.00",
            currency: "USDT",
          },
        },
      },
      client,
    }),
  );

  await prisma.$transaction((client: TransactionClient) =>
    submitTreasuryAllocationForReviewDurablyWithClient({
      allocationId,
      eventId: `event-review-${suffix}`,
      context: context({
        commandId: `command-review-${suffix}`,
        idempotencyKey: `idempotency-review-${suffix}`,
        actorId: reviewerActorId,
        requestedAt: "2026-09-05T13:01:00.000Z",
      }),
      client,
    }),
  );

  await prisma.$transaction((client: TransactionClient) =>
    approveTreasuryAllocationDurablyWithClient({
      allocationId,
      approvalIds: [`approval-consumption-${suffix}`],
      eventId: `event-approve-${suffix}`,
      context: context({
        commandId: `command-approve-${suffix}`,
        idempotencyKey: `idempotency-approve-${suffix}`,
        actorId: approverActorId,
        requestedAt: "2026-09-05T13:02:00.000Z",
      }),
      client,
    }),
  );

  const active = await prisma.$transaction((client: TransactionClient) =>
    activateTreasuryAllocationDurablyWithClient({
      allocationId,
      eventId: `event-activate-${suffix}`,
      context: context({
        commandId: `command-activate-${suffix}`,
        idempotencyKey: `idempotency-activate-${suffix}`,
        actorId: activatorActorId,
        requestedAt: "2026-09-05T13:03:00.000Z",
      }),
      client,
    }),
  );

  if (
    active.aggregate.status !== TREASURY_ALLOCATION_STATUS.ACTIVE ||
    active.aggregate.metadata.version !== 4
  ) {
    throw new Error(
      `Expected ACTIVE @ v4, received ${active.aggregate.status} @ v${active.aggregate.metadata.version}`,
    );
  }

  /*
   * Wrong currency must fail without mutation.
   */
  let currencyError: string | undefined;

  try {
    await prisma.$transaction((client: TransactionClient) =>
      consumeTreasuryAllocationDurablyWithClient({
        allocationId,
        amount: {
          amount: "1000",
          currency: "USD",
        },
        consumingSubjectType: "TREASURY_EXECUTION",
        consumingSubjectId: `execution-wrong-currency-${suffix}`,
        eventId: `event-wrong-currency-${suffix}`,
        context: context({
          commandId: `command-wrong-currency-${suffix}`,
          idempotencyKey: `idempotency-wrong-currency-${suffix}`,
          actorId: consumerActorId,
          requestedAt: "2026-09-05T13:04:00.000Z",
        }),
        client,
      }),
    );
  } catch (error: unknown) {
    currencyError = error instanceof Error ? error.message : String(error);
  }

  if (
    currencyError !==
    "[TREASURY_ALLOCATION_CURRENCY_MISMATCH] USD -> USDT"
  ) {
    throw new Error(
      `Expected currency mismatch rejection, received ${currencyError ?? "no error"}`,
    );
  }

  let row = await loadDurableRow();

  if (
    !row ||
    row.status !== TREASURY_ALLOCATION_STATUS.ACTIVE ||
    row.version !== 4
  ) {
    throw new Error("Currency rejection changed durable allocation state");
  }

  /*
   * Consume 25,000.
   */
  const partial = await prisma.$transaction(
    (client: TransactionClient) =>
      consumeTreasuryAllocationDurablyWithClient({
        allocationId,
        amount: {
          amount: "25000.00",
          currency: "USDT",
        },
        consumingSubjectType: "TREASURY_EXECUTION",
        consumingSubjectId: `execution-partial-${suffix}`,
        eventId: `event-consume-partial-${suffix}`,
        context: context({
          commandId: `command-consume-partial-${suffix}`,
          idempotencyKey: `idempotency-consume-partial-${suffix}`,
          actorId: consumerActorId,
          requestedAt: "2026-09-05T13:05:00.000Z",
        }),
        client,
      }),
  );

  if (
    partial.aggregate.status !==
      TREASURY_ALLOCATION_STATUS.PARTIALLY_CONSUMED ||
    partial.aggregate.metadata.version !== 5
  ) {
    throw new Error(
      `Expected PARTIALLY_CONSUMED @ v5, received ${partial.aggregate.status} @ v${partial.aggregate.metadata.version}`,
    );
  }

  if (partial.aggregate.consumedAmount.amount !== "25000") {
    throw new Error(
      `Expected total consumed 25000, received ${partial.aggregate.consumedAmount.amount}`,
    );
  }

  if (
    partial.event.payload.consumedAmount.amount !== "25000.00" ||
    partial.event.payload.totalConsumedAmount.amount !== "25000" ||
    partial.event.payload.remainingAmount.amount !== "50000"
  ) {
    throw new Error("Partial consumption event monetary facts are invalid");
  }

  if (
    partial.event.payload.consumingSubjectType !== "TREASURY_EXECUTION" ||
    partial.event.payload.consumingSubjectId !==
      `execution-partial-${suffix}`
  ) {
    throw new Error(
      "Partial consumption subject attribution was not preserved",
    );
  }

  /*
   * Remaining authority is 50,000.
   * 50,000.01 must fail without mutation.
   */
  let overConsumptionError: string | undefined;

  try {
    await prisma.$transaction((client: TransactionClient) =>
      consumeTreasuryAllocationDurablyWithClient({
        allocationId,
        amount: {
          amount: "50000.01",
          currency: "USDT",
        },
        consumingSubjectType: "TREASURY_EXECUTION",
        consumingSubjectId: `execution-over-consume-${suffix}`,
        eventId: `event-over-consume-${suffix}`,
        context: context({
          commandId: `command-over-consume-${suffix}`,
          idempotencyKey: `idempotency-over-consume-${suffix}`,
          actorId: consumerActorId,
          requestedAt: "2026-09-05T13:06:00.000Z",
        }),
        client,
      }),
    );
  } catch (error: unknown) {
    overConsumptionError =
      error instanceof Error ? error.message : String(error);
  }

  if (
    overConsumptionError !==
    "[TREASURY_ALLOCATION_CONSUMPTION_EXCEEDS_ALLOCATION]"
  ) {
    throw new Error(
      `Expected over-consumption rejection, received ${overConsumptionError ?? "no error"}`,
    );
  }

  row = await loadDurableRow();

  if (
    !row ||
    row.status !== TREASURY_ALLOCATION_STATUS.PARTIALLY_CONSUMED ||
    row.version !== 5
  ) {
    throw new Error("Over-consumption rejection changed durable state");
  }

  /*
   * Consume exactly the remaining 50,000.
   */
  const consumed = await prisma.$transaction(
    (client: TransactionClient) =>
      consumeTreasuryAllocationDurablyWithClient({
        allocationId,
        amount: {
          amount: "50000.00",
          currency: "USDT",
        },
        consumingSubjectType: "TREASURY_EXECUTION",
        consumingSubjectId: `execution-final-${suffix}`,
        eventId: `event-consume-final-${suffix}`,
        context: context({
          commandId: `command-consume-final-${suffix}`,
          idempotencyKey: `idempotency-consume-final-${suffix}`,
          actorId: consumerActorId,
          requestedAt: "2026-09-05T13:07:00.000Z",
        }),
        client,
      }),
  );

  if (
    consumed.aggregate.status !== TREASURY_ALLOCATION_STATUS.CONSUMED ||
    consumed.aggregate.metadata.version !== 6
  ) {
    throw new Error(
      `Expected CONSUMED @ v6, received ${consumed.aggregate.status} @ v${consumed.aggregate.metadata.version}`,
    );
  }

  if (consumed.aggregate.consumedAmount.amount !== "75000") {
    throw new Error(
      `Expected total consumed 75000, received ${consumed.aggregate.consumedAmount.amount}`,
    );
  }

  if (
    consumed.event.payload.consumedAmount.amount !== "50000.00" ||
    consumed.event.payload.totalConsumedAmount.amount !== "75000" ||
    consumed.event.payload.remainingAmount.amount !== "0"
  ) {
    throw new Error("Final consumption event monetary facts are invalid");
  }

  /*
   * CONSUMED is terminal.
   */
  let terminalConsumptionError: string | undefined;

  try {
    await prisma.$transaction((client: TransactionClient) =>
      consumeTreasuryAllocationDurablyWithClient({
        allocationId,
        amount: {
          amount: "1",
          currency: "USDT",
        },
        consumingSubjectType: "TREASURY_EXECUTION",
        consumingSubjectId: `execution-after-consumed-${suffix}`,
        eventId: `event-after-consumed-${suffix}`,
        context: context({
          commandId: `command-after-consumed-${suffix}`,
          idempotencyKey: `idempotency-after-consumed-${suffix}`,
          actorId: consumerActorId,
          requestedAt: "2026-09-05T13:08:00.000Z",
        }),
        client,
      }),
    );
  } catch (error: unknown) {
    terminalConsumptionError =
      error instanceof Error ? error.message : String(error);
  }

  if (!terminalConsumptionError) {
    throw new Error("Consumption after CONSUMED unexpectedly succeeded");
  }

  row = await loadDurableRow();

  if (
    !row ||
    row.status !== TREASURY_ALLOCATION_STATUS.CONSUMED ||
    row.version !== 6
  ) {
    throw new Error("Terminal-state rejection changed durable state");
  }

  const consumptionEvents =
    await prisma.treasuryGatewayEvent.findMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,
        aggregateId: allocationId,
        eventType: TREASURY_EVENT_TYPE.TREASURY_ALLOCATION_CONSUMED,
      },
      orderBy: {
        aggregateVersion: "asc",
      },
    });

  if (consumptionEvents.length !== 2) {
    throw new Error(
      `Expected 2 durable consumption events, received ${consumptionEvents.length}`,
    );
  }

  if (
    consumptionEvents[0]?.aggregateVersion !== 5 ||
    consumptionEvents[1]?.aggregateVersion !== 6
  ) {
    throw new Error("Consumption event versions are invalid");
  }

  const allEvents = await prisma.treasuryGatewayEvent.count({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,
      aggregateId: allocationId,
    },
  });

  if (allEvents !== 6) {
    throw new Error(
      `Expected 6 lifecycle events, received ${allEvents}`,
    );
  }

  console.log("✓ Durable Treasury Allocation utilization smoke test passed");
  console.log("");
  console.log("lifecycle:");
  console.log("  v4  ACTIVE                  0 / 75000 consumed");
  console.log("  v5  PARTIALLY_CONSUMED  25000 / 75000 consumed");
  console.log("  v6  CONSUMED            75000 / 75000 consumed");
  console.log("");
  console.log("utilization law:");
  console.log("  wrong currency             rejected");
  console.log("  over-consumption           rejected");
  console.log("  consume after terminal     rejected");
  console.log("");
  console.log("subject attribution:");
  console.log("  partial                    TREASURY_EXECUTION");
  console.log(`  partial subject            execution-partial-${suffix}`);
  console.log("  final                      TREASURY_EXECUTION");
  console.log(`  final subject              execution-final-${suffix}`);
  console.log("");
  console.log("durability:");
  console.log(`  final status               ${row.status}`);
  console.log(`  final version              ${row.version}`);
  console.log(`  consumption events         ${consumptionEvents.length}`);
  console.log(`  lifecycle events           ${allEvents}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
