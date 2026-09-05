import { PrismaClient } from "@prisma/client";
import type { TransactionClient } from "@prisma/client";

import {
  createTreasuryAllocationIdempotentlyWithClient,
} from "../../src/domains/treasury/gateway/allocations/application/createTreasuryAllocationIdempotentlyWithClient";

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

import type {
  CreateTreasuryAllocationDurably,
} from "../../src/domains/treasury/gateway/allocations/application/createTreasuryAllocationDurablyContracts";

const prisma = new PrismaClient();

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const allocationId = `allocation-smoke-${suffix}`;
const replayAllocationId = `allocation-smoke-replay-${suffix}`;

const eventId = `event-allocation-smoke-${suffix}`;
const replayEventId = `event-allocation-smoke-replay-${suffix}`;

const commandId = `command-allocation-smoke-${suffix}`;
const replayCommandId = `command-allocation-smoke-replay-${suffix}`;

const idempotencyKey = `idempotency-allocation-smoke-${suffix}`;

const correlationId = `correlation-allocation-smoke-${suffix}`;

const actorId = `actor-allocation-smoke-${suffix}`;

const programId = `program-allocation-smoke-${suffix}`;
const sourceProgramAccountId = `program-account-source-${suffix}`;

const reference = `ALLOC-SMOKE-${suffix}`;

function makeRequest(overrides?: {
  allocationId?: string;
  eventId?: string;
  commandId?: string;
  actorId?: string;
  sourceProgramAccountId?: string;
  amount?: string;
  purposeType?: CreateTreasuryAllocationDurably["payload"]["purposeType"];
}): CreateTreasuryAllocationDurably {
  return {
    allocationId: overrides?.allocationId ?? allocationId,

    reference,

    eventId: overrides?.eventId ?? eventId,

    context: {
      commandId: overrides?.commandId ?? commandId,

      idempotencyKey,

      actorId: overrides?.actorId ?? actorId,

      correlationId,

      requestedAt: new Date("2026-09-05T12:00:00.000Z"),
    },

    payload: {
      programId,

      sourceProgramAccountId:
        overrides?.sourceProgramAccountId ?? sourceProgramAccountId,

      purposeType:
        overrides?.purposeType ??
        TREASURY_ALLOCATION_PURPOSE.PROGRAM_OPERATIONS,

      amount: {
        amount: overrides?.amount ?? "75000.00",

        currency: "USDT",
      },
    },
  };
}

async function expectCollision(
  label: string,
  request: CreateTreasuryAllocationDurably,
) {
  let message: string | undefined;

  try {
    await prisma.$transaction((client: TransactionClient) =>
      createTreasuryAllocationIdempotentlyWithClient({
        request,

        client,
      }),
    );
  } catch (error: unknown) {
    message = error instanceof Error ? error.message : String(error);
  }

  if (
    message !==
    `[TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION] ${idempotencyKey}`
  ) {
    throw new Error(
      `${label}: expected idempotency collision, received ${message ?? "no error"}`,
    );
  }
}

async function main() {
  const first = await prisma.$transaction((client: TransactionClient) =>
    createTreasuryAllocationIdempotentlyWithClient({
      request: makeRequest(),

      client,
    }),
  );

  if (first.disposition !== "CREATED") {
    throw new Error(
      `Expected CREATED disposition, received ${first.disposition}`,
    );
  }

  if (first.aggregate.id !== allocationId) {
    throw new Error(
      `Expected allocation ${allocationId}, received ${first.aggregate.id}`,
    );
  }

  if (first.aggregate.status !== TREASURY_ALLOCATION_STATUS.PROPOSED) {
    throw new Error(
      `Expected PROPOSED status, received ${first.aggregate.status}`,
    );
  }

  if (first.aggregate.metadata.version !== 1) {
    throw new Error(
      `Expected version 1, received ${first.aggregate.metadata.version}`,
    );
  }

  if (first.aggregate.sourceProgramAccountId !== sourceProgramAccountId) {
    throw new Error("Source Program Account attribution was not preserved");
  }

  if (
    first.aggregate.amount.amount !== "75000.00" ||
    first.aggregate.amount.currency !== "USDT"
  ) {
    throw new Error("Allocation amount was not preserved");
  }

  if (
    first.aggregate.consumedAmount.amount !== "0" ||
    first.aggregate.consumedAmount.currency !== "USDT"
  ) {
    throw new Error("Initial consumed amount is invalid");
  }

  if (
    first.aggregate.purposeType !==
    TREASURY_ALLOCATION_PURPOSE.PROGRAM_OPERATIONS
  ) {
    throw new Error("Allocation purpose was not preserved");
  }

  const replay = await prisma.$transaction((client: TransactionClient) =>
    createTreasuryAllocationIdempotentlyWithClient({
      request: makeRequest({
        allocationId: replayAllocationId,
        eventId: replayEventId,
        commandId: replayCommandId,
      }),

      client,
    }),
  );

  if (replay.disposition !== "REPLAYED") {
    throw new Error(
      `Expected REPLAYED disposition, received ${replay.disposition}`,
    );
  }

  if (replay.aggregate.id !== allocationId) {
    throw new Error(
      `Replay changed canonical allocation identity: ${replay.aggregate.id}`,
    );
  }

  await expectCollision(
    "changed amount",
    makeRequest({
      allocationId: `allocation-amount-collision-${suffix}`,
      eventId: `event-amount-collision-${suffix}`,
      commandId: `command-amount-collision-${suffix}`,
      amount: "76000.00",
    }),
  );

  await expectCollision(
    "changed source account",
    makeRequest({
      allocationId: `allocation-account-collision-${suffix}`,
      eventId: `event-account-collision-${suffix}`,
      commandId: `command-account-collision-${suffix}`,
      sourceProgramAccountId: `different-program-account-${suffix}`,
    }),
  );

  await expectCollision(
    "changed purpose",
    makeRequest({
      allocationId: `allocation-purpose-collision-${suffix}`,
      eventId: `event-purpose-collision-${suffix}`,
      commandId: `command-purpose-collision-${suffix}`,
      purposeType: TREASURY_ALLOCATION_PURPOSE.RESERVE,
    }),
  );

  await expectCollision(
    "changed actor",
    makeRequest({
      allocationId: `allocation-actor-collision-${suffix}`,
      eventId: `event-actor-collision-${suffix}`,
      commandId: `command-actor-collision-${suffix}`,
      actorId: `different-actor-${suffix}`,
    }),
  );

  const aggregateRows = await prisma.treasuryGatewayAggregate.findMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,

      aggregateId: allocationId,
    },
  });

  const creationEvents = await prisma.treasuryGatewayEvent.findMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,

      aggregateId: allocationId,

      eventType: TREASURY_EVENT_TYPE.TREASURY_ALLOCATION_CREATED,
    },
  });

  const commandReceipts = await prisma.treasuryGatewayCommandReceipt.findMany({
    where: {
      idempotencyKey,
    },
  });

  const replayAggregateRows =
    await prisma.treasuryGatewayAggregate.findMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,

        aggregateId: replayAllocationId,
      },
    });

  if (aggregateRows.length !== 1) {
    throw new Error(
      `Expected exactly one canonical aggregate, received ${aggregateRows.length}`,
    );
  }

  if (creationEvents.length !== 1) {
    throw new Error(
      `Expected exactly one creation event, received ${creationEvents.length}`,
    );
  }

  if (commandReceipts.length !== 1) {
    throw new Error(
      `Expected exactly one command receipt, received ${commandReceipts.length}`,
    );
  }

  if (replayAggregateRows.length !== 0) {
    throw new Error(
      `Replay created ${replayAggregateRows.length} additional aggregate(s)`,
    );
  }

  console.log("✓ Durable Treasury Allocation creation smoke test passed");
  console.log("");
  console.log("allocation:");
  console.log(`  id                 ${first.aggregate.id}`);
  console.log(`  status             ${first.aggregate.status}`);
  console.log(`  version            ${first.aggregate.metadata.version}`);
  console.log(
    `  source account     ${first.aggregate.sourceProgramAccountId}`,
  );
  console.log(
    `  amount             ${first.aggregate.amount.amount} ${first.aggregate.amount.currency}`,
  );
  console.log(
    `  consumed           ${first.aggregate.consumedAmount.amount} ${first.aggregate.consumedAmount.currency}`,
  );
  console.log(`  purpose            ${first.aggregate.purposeType}`);
  console.log("");
  console.log("idempotency:");
  console.log(`  first              ${first.disposition}`);
  console.log(`  replay             ${replay.disposition}`);
  console.log(`  canonical id       ${replay.aggregate.id}`);
  console.log("");
  console.log("durable state:");
  console.log(`  aggregates         ${aggregateRows.length}`);
  console.log(`  creation events    ${creationEvents.length}`);
  console.log(`  command receipts   ${commandReceipts.length}`);
  console.log(`  replay aggregates  ${replayAggregateRows.length}`);
  console.log("");
  console.log("collision law:");
  console.log("  changed amount          rejected");
  console.log("  changed source account  rejected");
  console.log("  changed purpose         rejected");
  console.log("  changed actor           rejected");
}

main()
  .catch((error) => {
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
