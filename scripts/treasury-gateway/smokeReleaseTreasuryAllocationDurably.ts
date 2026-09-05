import { PrismaClient } from "@prisma/client";
import type { TransactionClient } from "@prisma/client";

import { createTreasuryAllocationIdempotentlyWithClient } from "../../src/domains/treasury/gateway/allocations/application/createTreasuryAllocationIdempotentlyWithClient";
import { submitTreasuryAllocationForReviewDurablyWithClient } from "../../src/domains/treasury/gateway/allocations/application/submitTreasuryAllocationForReviewDurablyWithClient";
import { approveTreasuryAllocationDurablyWithClient } from "../../src/domains/treasury/gateway/allocations/application/approveTreasuryAllocationDurablyWithClient";
import { activateTreasuryAllocationDurablyWithClient } from "../../src/domains/treasury/gateway/allocations/application/activateTreasuryAllocationDurablyWithClient";
import { consumeTreasuryAllocationDurablyWithClient } from "../../src/domains/treasury/gateway/allocations/application/consumeTreasuryAllocationDurablyWithClient";
import { releaseTreasuryAllocationDurablyWithClient } from "../../src/domains/treasury/gateway/allocations/application/releaseTreasuryAllocationDurablyWithClient";

import { TREASURY_ALLOCATION_PURPOSE } from "../../src/domains/treasury/gateway/allocations/contracts";
import { TREASURY_ALLOCATION_STATUS } from "../../src/domains/treasury/gateway/allocations/status";
import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";
import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

const prisma = new PrismaClient();

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

function makeContext(
  allocationId: string,
  step: string,
  minute: number,
) {
  return {
    commandId: `command-${step}-${allocationId}`,
    idempotencyKey: `idempotency-${step}-${allocationId}`,
    actorId: `actor-${step}-${suffix}`,
    correlationId: `correlation-${allocationId}`,
    requestedAt: new Date(`2026-09-05T14:${String(minute).padStart(2, "0")}:00.000Z`),
  };
}

async function establishActiveAllocation(label: string) {
  const allocationId = `allocation-release-${label}-${suffix}`;

  await prisma.$transaction((client: TransactionClient) =>
    createTreasuryAllocationIdempotentlyWithClient({
      request: {
        allocationId,
        reference: `ALLOC-RELEASE-${label}-${suffix}`,
        eventId: `event-create-${allocationId}`,
        context: makeContext(allocationId, "create", 0),
        payload: {
          programId: `program-release-${suffix}`,
          sourceProgramAccountId: `program-account-release-${suffix}`,
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
      eventId: `event-review-${allocationId}`,
      context: makeContext(allocationId, "review", 1),
      client,
    }),
  );

  await prisma.$transaction((client: TransactionClient) =>
    approveTreasuryAllocationDurablyWithClient({
      allocationId,
      approvalIds: [`approval-${allocationId}`],
      eventId: `event-approve-${allocationId}`,
      context: makeContext(allocationId, "approve", 2),
      client,
    }),
  );

  const active = await prisma.$transaction((client: TransactionClient) =>
    activateTreasuryAllocationDurablyWithClient({
      allocationId,
      eventId: `event-activate-${allocationId}`,
      context: makeContext(allocationId, "activate", 3),
      client,
    }),
  );

  if (
    active.aggregate.status !== TREASURY_ALLOCATION_STATUS.ACTIVE ||
    active.aggregate.metadata.version !== 4
  ) {
    throw new Error(
      `Expected ${allocationId} ACTIVE @ v4, received ${active.aggregate.status} @ v${active.aggregate.metadata.version}`,
    );
  }

  return allocationId;
}

async function loadDurableRow(allocationId: string) {
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
   * CASE A:
   * ACTIVE 75,000 -> RELEASED 75,000.
   */
  const activeReleaseId = await establishActiveAllocation("active");

  let blankReasonError: string | undefined;

  try {
    await prisma.$transaction((client: TransactionClient) =>
      releaseTreasuryAllocationDurablyWithClient({
        allocationId: activeReleaseId,
        reason: "   ",
        eventId: `event-blank-release-${activeReleaseId}`,
        context: makeContext(activeReleaseId, "blank-release", 4),
        client,
      }),
    );
  } catch (error: unknown) {
    blankReasonError =
      error instanceof Error ? error.message : String(error);
  }

  if (
    blankReasonError !==
    "[TREASURY_ALLOCATION_RELEASE_REASON_REQUIRED]"
  ) {
    throw new Error(
      `Expected blank reason rejection, received ${blankReasonError ?? "no error"}`,
    );
  }

  let row = await loadDurableRow(activeReleaseId);

  if (
    !row ||
    row.status !== TREASURY_ALLOCATION_STATUS.ACTIVE ||
    row.version !== 4
  ) {
    throw new Error("Blank reason rejection changed durable state");
  }

  const activeReleased = await prisma.$transaction(
    (client: TransactionClient) =>
      releaseTreasuryAllocationDurablyWithClient({
        allocationId: activeReleaseId,
        reason: "  Operational requirement withdrawn  ",
        eventId: `event-release-${activeReleaseId}`,
        context: makeContext(activeReleaseId, "release", 5),
        client,
      }),
  );

  if (
    activeReleased.aggregate.status !==
      TREASURY_ALLOCATION_STATUS.RELEASED ||
    activeReleased.aggregate.metadata.version !== 5
  ) {
    throw new Error(
      `Expected ACTIVE release to produce RELEASED @ v5, received ${activeReleased.aggregate.status} @ v${activeReleased.aggregate.metadata.version}`,
    );
  }

  if (
    activeReleased.event.payload.releasedAmount.amount !== "75000" ||
    activeReleased.event.payload.totalConsumedAmount.amount !== "0" ||
    activeReleased.event.payload.reason !==
      "Operational requirement withdrawn"
  ) {
    throw new Error("ACTIVE release event facts are invalid");
  }

  /*
   * CASE B:
   * ACTIVE 75,000
   * -> consume 25,000
   * -> PARTIALLY_CONSUMED
   * -> release remaining 50,000.
   */
  const partialReleaseId =
    await establishActiveAllocation("partial");

  const partial = await prisma.$transaction(
    (client: TransactionClient) =>
      consumeTreasuryAllocationDurablyWithClient({
        allocationId: partialReleaseId,
        amount: {
          amount: "25000.00",
          currency: "USDT",
        },
        consumingSubjectType: "TREASURY_EXECUTION",
        consumingSubjectId: `execution-partial-release-${suffix}`,
        eventId: `event-consume-${partialReleaseId}`,
        context: makeContext(partialReleaseId, "consume", 6),
        client,
      }),
  );

  if (
    partial.aggregate.status !==
      TREASURY_ALLOCATION_STATUS.PARTIALLY_CONSUMED ||
    partial.aggregate.metadata.version !== 5 ||
    partial.aggregate.consumedAmount.amount !== "25000"
  ) {
    throw new Error(
      "Expected partial-release allocation PARTIALLY_CONSUMED @ v5 with 25000 consumed",
    );
  }

  const partialReleased = await prisma.$transaction(
    (client: TransactionClient) =>
      releaseTreasuryAllocationDurablyWithClient({
        allocationId: partialReleaseId,
        reason: "Remaining authority no longer required",
        eventId: `event-release-${partialReleaseId}`,
        context: makeContext(partialReleaseId, "release", 7),
        client,
      }),
  );

  if (
    partialReleased.aggregate.status !==
      TREASURY_ALLOCATION_STATUS.RELEASED ||
    partialReleased.aggregate.metadata.version !== 6
  ) {
    throw new Error(
      `Expected partial release RELEASED @ v6, received ${partialReleased.aggregate.status} @ v${partialReleased.aggregate.metadata.version}`,
    );
  }

  if (partialReleased.aggregate.consumedAmount.amount !== "25000") {
    throw new Error(
      "Release erased historical allocation consumption",
    );
  }

  if (
    partialReleased.event.payload.releasedAmount.amount !== "50000" ||
    partialReleased.event.payload.totalConsumedAmount.amount !== "25000"
  ) {
    throw new Error("Partial release monetary facts are invalid");
  }

  /*
   * CASE C:
   * Fully consumed allocation cannot subsequently be released.
   */
  const consumedId = await establishActiveAllocation("consumed");

  await prisma.$transaction((client: TransactionClient) =>
    consumeTreasuryAllocationDurablyWithClient({
      allocationId: consumedId,
      amount: {
        amount: "75000.00",
        currency: "USDT",
      },
      consumingSubjectType: "TREASURY_EXECUTION",
      consumingSubjectId: `execution-full-consume-${suffix}`,
      eventId: `event-consume-${consumedId}`,
      context: makeContext(consumedId, "consume", 8),
      client,
    }),
  );

  let terminalReleaseError: string | undefined;

  try {
    await prisma.$transaction((client: TransactionClient) =>
      releaseTreasuryAllocationDurablyWithClient({
        allocationId: consumedId,
        reason: "Attempt release after consumption",
        eventId: `event-release-terminal-${consumedId}`,
        context: makeContext(consumedId, "release-terminal", 9),
        client,
      }),
    );
  } catch (error: unknown) {
    terminalReleaseError =
      error instanceof Error ? error.message : String(error);
  }

  if (
    terminalReleaseError !==
    "[TREASURY_ALLOCATION_TRANSITION_INVALID] CONSUMED -> RELEASED"
  ) {
    throw new Error(
      `Expected terminal release rejection, received ${terminalReleaseError ?? "no error"}`,
    );
  }

  row = await loadDurableRow(consumedId);

  if (
    !row ||
    row.status !== TREASURY_ALLOCATION_STATUS.CONSUMED ||
    row.version !== 5
  ) {
    throw new Error(
      "Terminal release rejection changed durable consumed state",
    );
  }

  /*
   * Verify durable release-event boundaries.
   */
  const activeReleaseEvents =
    await prisma.treasuryGatewayEvent.findMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,
        aggregateId: activeReleaseId,
        eventType: TREASURY_EVENT_TYPE.TREASURY_ALLOCATION_RELEASED,
      },
    });

  const partialReleaseEvents =
    await prisma.treasuryGatewayEvent.findMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,
        aggregateId: partialReleaseId,
        eventType: TREASURY_EVENT_TYPE.TREASURY_ALLOCATION_RELEASED,
      },
    });

  const consumedReleaseEvents =
    await prisma.treasuryGatewayEvent.findMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,
        aggregateId: consumedId,
        eventType: TREASURY_EVENT_TYPE.TREASURY_ALLOCATION_RELEASED,
      },
    });

  if (
    activeReleaseEvents.length !== 1 ||
    partialReleaseEvents.length !== 1 ||
    consumedReleaseEvents.length !== 0
  ) {
    throw new Error("Durable release event counts are invalid");
  }

  console.log("✓ Durable Treasury Allocation release smoke test passed");
  console.log("");
  console.log("ACTIVE release:");
  console.log("  v4 ACTIVE");
  console.log("  v5 RELEASED");
  console.log("  released                    75000 USDT");
  console.log("  historically consumed      0 USDT");
  console.log("");
  console.log("PARTIAL release:");
  console.log("  v4 ACTIVE");
  console.log("  v5 PARTIALLY_CONSUMED");
  console.log("  v6 RELEASED");
  console.log("  historically consumed      25000 USDT");
  console.log("  released                    50000 USDT");
  console.log("");
  console.log("release law:");
  console.log("  blank reason                rejected");
  console.log("  reason normalization        preserved");
  console.log("  release after CONSUMED      rejected");
  console.log("");
  console.log("durability:");
  console.log("  ACTIVE release events       1");
  console.log("  PARTIAL release events      1");
  console.log("  CONSUMED release events     0");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
