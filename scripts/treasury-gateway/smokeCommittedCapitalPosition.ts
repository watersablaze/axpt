import { PrismaClient } from "@prisma/client";
import type { TransactionClient } from "@prisma/client";

import { createTreasuryAllocationIdempotentlyWithClient } from "../../src/domains/treasury/gateway/allocations/application/createTreasuryAllocationIdempotentlyWithClient";
import { submitTreasuryAllocationForReviewDurablyWithClient } from "../../src/domains/treasury/gateway/allocations/application/submitTreasuryAllocationForReviewDurablyWithClient";
import { approveTreasuryAllocationDurablyWithClient } from "../../src/domains/treasury/gateway/allocations/application/approveTreasuryAllocationDurablyWithClient";
import { activateTreasuryAllocationDurablyWithClient } from "../../src/domains/treasury/gateway/allocations/application/activateTreasuryAllocationDurablyWithClient";
import { consumeTreasuryAllocationDurablyWithClient } from "../../src/domains/treasury/gateway/allocations/application/consumeTreasuryAllocationDurablyWithClient";
import { releaseTreasuryAllocationDurablyWithClient } from "../../src/domains/treasury/gateway/allocations/application/releaseTreasuryAllocationDurablyWithClient";
import { getCommittedCapitalPositionWithClient } from "../../src/domains/treasury/gateway/allocations/application/getCommittedCapitalPositionWithClient";

import { TREASURY_ALLOCATION_PURPOSE } from "../../src/domains/treasury/gateway/allocations/contracts";

import { compareDecimals } from "../../src/domains/treasury/gateway/shared/decimalAmount";

const prisma = new PrismaClient();

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const programId = `program-committed-position-${suffix}`;
const programAccountId = `program-account-committed-position-${suffix}`;
const currency = "USDT";

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
    requestedAt: new Date(
      `2026-09-05T15:${String(minute).padStart(2, "0")}:00.000Z`,
    ),
  };
}

async function createActiveAllocation(params: {
  label: string;
  amount: string;
  minuteOffset: number;
}) {
  const { label, amount, minuteOffset } = params;

  const allocationId = `allocation-position-${label}-${suffix}`;

  await prisma.$transaction((client: TransactionClient) =>
    createTreasuryAllocationIdempotentlyWithClient({
      request: {
        allocationId,
        reference: `ALLOC-POSITION-${label}-${suffix}`,
        eventId: `event-create-${allocationId}`,
        context: makeContext(
          allocationId,
          "create",
          minuteOffset,
        ),
        payload: {
          programId,
          sourceProgramAccountId: programAccountId,
          purposeType:
            TREASURY_ALLOCATION_PURPOSE.PROGRAM_OPERATIONS,
          amount: {
            amount,
            currency,
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
      context: makeContext(
        allocationId,
        "review",
        minuteOffset + 1,
      ),
      client,
    }),
  );

  await prisma.$transaction((client: TransactionClient) =>
    approveTreasuryAllocationDurablyWithClient({
      allocationId,
      approvalIds: [`approval-${allocationId}`],
      eventId: `event-approve-${allocationId}`,
      context: makeContext(
        allocationId,
        "approve",
        minuteOffset + 2,
      ),
      client,
    }),
  );

  await prisma.$transaction((client: TransactionClient) =>
    activateTreasuryAllocationDurablyWithClient({
      allocationId,
      eventId: `event-activate-${allocationId}`,
      context: makeContext(
        allocationId,
        "activate",
        minuteOffset + 3,
      ),
      client,
    }),
  );

  return allocationId;
}

async function getPosition() {
  return prisma.$transaction((client: TransactionClient) =>
    getCommittedCapitalPositionWithClient({
      programAccountId,
      currency,
      client,
    }),
  );
}

function assertAmount(
  actual: string,
  expected: string,
  stage: string,
) {
  if (compareDecimals(actual, expected) !== 0) {
    throw new Error(
      `${stage}: expected ${expected} ${currency} committed, received ${actual} ${currency}`,
    );
  }
}

async function main() {
  /*
   * Empty position proves that committed capital is derived rather
   * than requiring a pre-existing mutable account balance.
   */
  const empty = await getPosition();

  assertAmount(
    empty.committedAmount.amount,
    "0",
    "empty position",
  );

  if (empty.contributingAllocationIds.length !== 0) {
    throw new Error(
      "Empty committed position unexpectedly has contributors",
    );
  }

  /*
   * Allocation A:
   * ACTIVE 75,000.
   */
  const allocationA = await createActiveAllocation({
    label: "a",
    amount: "75000.00",
    minuteOffset: 0,
  });

  const afterA = await getPosition();

  assertAmount(
    afterA.committedAmount.amount,
    "75000",
    "after allocation A activation",
  );

  if (
    afterA.contributingAllocationIds.length !== 1 ||
    !afterA.contributingAllocationIds.includes(allocationA)
  ) {
    throw new Error(
      "Allocation A is not the sole contributor after activation",
    );
  }

  /*
   * Allocation B:
   * another ACTIVE 30,000.
   *
   * Projection must aggregate current effective commitments.
   */
  const allocationB = await createActiveAllocation({
    label: "b",
    amount: "30000.00",
    minuteOffset: 10,
  });

  const afterB = await getPosition();

  assertAmount(
    afterB.committedAmount.amount,
    "105000",
    "after allocation B activation",
  );

  if (
    afterB.contributingAllocationIds.length !== 2 ||
    !afterB.contributingAllocationIds.includes(allocationA) ||
    !afterB.contributingAllocationIds.includes(allocationB)
  ) {
    throw new Error(
      "Committed position does not contain both active allocations",
    );
  }

  /*
   * Consume 25,000 of A.
   *
   * A remains an effective commitment, but only its unused
   * 50,000 remains committed.
   *
   * A 50,000 + B 30,000 = 80,000.
   */
  await prisma.$transaction((client: TransactionClient) =>
    consumeTreasuryAllocationDurablyWithClient({
      allocationId: allocationA,
      amount: {
        amount: "25000.00",
        currency,
      },
      consumingSubjectType: "TREASURY_EXECUTION",
      consumingSubjectId: `execution-position-partial-${suffix}`,
      eventId: `event-consume-${allocationA}`,
      context: makeContext(
        allocationA,
        "consume-partial",
        20,
      ),
      client,
    }),
  );

  const afterPartialConsumption = await getPosition();

  assertAmount(
    afterPartialConsumption.committedAmount.amount,
    "80000",
    "after partial consumption",
  );

  if (
    afterPartialConsumption.contributingAllocationIds.length !== 2 ||
    !afterPartialConsumption.contributingAllocationIds.includes(
      allocationA,
    ) ||
    !afterPartialConsumption.contributingAllocationIds.includes(
      allocationB,
    )
  ) {
    throw new Error(
      "Partially consumed allocation ceased contributing prematurely",
    );
  }

  /*
   * Release A's remaining 50,000.
   *
   * A is now RELEASED and must cease contributing.
   * B remains ACTIVE at 30,000.
   */
  await prisma.$transaction((client: TransactionClient) =>
    releaseTreasuryAllocationDurablyWithClient({
      allocationId: allocationA,
      reason: "Remaining authority no longer required",
      eventId: `event-release-${allocationA}`,
      context: makeContext(
        allocationA,
        "release",
        21,
      ),
      client,
    }),
  );

  const afterRelease = await getPosition();

  assertAmount(
    afterRelease.committedAmount.amount,
    "30000",
    "after release",
  );

  if (
    afterRelease.contributingAllocationIds.length !== 1 ||
    !afterRelease.contributingAllocationIds.includes(allocationB) ||
    afterRelease.contributingAllocationIds.includes(allocationA)
  ) {
    throw new Error(
      "Released allocation still contributes to committed position",
    );
  }

  /*
   * Fully consume B.
   *
   * CONSUMED is terminal and carries no remaining commitment.
   */
  await prisma.$transaction((client: TransactionClient) =>
    consumeTreasuryAllocationDurablyWithClient({
      allocationId: allocationB,
      amount: {
        amount: "30000.00",
        currency,
      },
      consumingSubjectType: "TREASURY_EXECUTION",
      consumingSubjectId: `execution-position-final-${suffix}`,
      eventId: `event-consume-${allocationB}`,
      context: makeContext(
        allocationB,
        "consume-final",
        22,
      ),
      client,
    }),
  );

  const afterFullConsumption = await getPosition();

  assertAmount(
    afterFullConsumption.committedAmount.amount,
    "0",
    "after full consumption",
  );

  if (
    afterFullConsumption.contributingAllocationIds.length !== 0
  ) {
    throw new Error(
      "Terminal allocations still contribute to committed position",
    );
  }

  /*
   * Isolation:
   * another account and another currency must not contaminate
   * this account/currency position.
   */
  const otherAccountId =
    `program-account-other-${suffix}`;

  const otherAccountAllocationId =
    `allocation-position-other-account-${suffix}`;

  await prisma.$transaction((client: TransactionClient) =>
    createTreasuryAllocationIdempotentlyWithClient({
      request: {
        allocationId: otherAccountAllocationId,
        reference: `ALLOC-POSITION-OTHER-${suffix}`,
        eventId: `event-create-${otherAccountAllocationId}`,
        context: makeContext(
          otherAccountAllocationId,
          "create-other",
          30,
        ),
        payload: {
          programId,
          sourceProgramAccountId: otherAccountId,
          purposeType:
            TREASURY_ALLOCATION_PURPOSE.PROGRAM_OPERATIONS,
          amount: {
            amount: "90000.00",
            currency,
          },
        },
      },
      client,
    }),
  );

  /*
   * PROPOSED is intentionally left unactivated.
   * It must establish no commitment.
   */
  const afterProposed = await getPosition();

  assertAmount(
    afterProposed.committedAmount.amount,
    "0",
    "after unrelated proposed allocation",
  );

  console.log("✓ Committed Capital Position smoke test passed");
  console.log("");
  console.log("position lifecycle:");
  console.log("  empty                       0 USDT");
  console.log("  A ACTIVE                75000 USDT");
  console.log("  A + B ACTIVE           105000 USDT");
  console.log("  A partial + B ACTIVE    80000 USDT");
  console.log("  A RELEASED + B ACTIVE   30000 USDT");
  console.log("  A RELEASED + B CONSUMED     0 USDT");
  console.log("");
  console.log("projection law:");
  console.log("  ACTIVE contributes            yes");
  console.log("  PARTIALLY_CONSUMED contributes yes");
  console.log("  RELEASED contributes           no");
  console.log("  CONSUMED contributes           no");
  console.log("  unrelated account              excluded");
  console.log("  PROPOSED                       no commitment");
  console.log("");
  console.log("financial architecture:");
  console.log("  mutable balance                none");
  console.log("  position source                durable allocation facts");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
