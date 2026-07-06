import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { requestTreasuryReconciliationPass } from "../../src/domains/treasury/gateway/reconciliation-passes/requestTreasuryReconciliationPass";

import { startTreasuryReconciliationPass } from "../../src/domains/treasury/gateway/reconciliation-passes/startTreasuryReconciliationPass";

import { completeTreasuryReconciliationPass } from "../../src/domains/treasury/gateway/reconciliation-passes/completeTreasuryReconciliationPass";

import { failTreasuryReconciliationPass } from "../../src/domains/treasury/gateway/reconciliation-passes/failTreasuryReconciliationPass";

import { TREASURY_RECONCILIATION_PASS_STATUS } from "../../src/domains/treasury/gateway/reconciliation-passes/status";

import { persistNewTreasuryReconciliationPassWithClient } from "../../src/domains/treasury/gateway/reconciliation-passes/persistence/persistNewTreasuryReconciliationPassWithClient";

import { persistTreasuryReconciliationPassTransitionWithClient } from "../../src/domains/treasury/gateway/reconciliation-passes/persistence/persistTreasuryReconciliationPassTransitionWithClient";

import { loadTreasuryReconciliationPassWithClient } from "../../src/domains/treasury/gateway/reconciliation-passes/persistence/loadTreasuryReconciliationPassWithClient";

const prisma = new PrismaClient();

type GatewayEventFixtureRow = Readonly<{
  aggregateVersion: number;

  eventType: string;
}>;

const COMPLETED_SUMMARY = {
  discovered: 3,

  processed: 3,

  reconciled: 2,

  failed: 1,

  advanced: 1,

  unchanged: 1,

  unsupported: 0,

  ownershipMissing: 0,
} as const;

function createContext(params: {
  fixtureId: string;

  phase: string;

  requestedAt: Date;
}) {
  const { fixtureId, phase, requestedAt } = params;

  return {
    commandId: `command-${phase}-${fixtureId}`,

    actorId: `actor-${fixtureId}`,

    authorityGrantId: `authority-${fixtureId}`,

    correlationId: `correlation-${fixtureId}`,

    requestedAt,

    idempotencyKey: `${phase}-${fixtureId}`,
  };
}

async function createRequestedPass(params: {
  fixtureId: string;

  passId: string;

  requestedAt: Date;
}) {
  const { fixtureId, passId, requestedAt } = params;

  const context = createContext({
    fixtureId,

    phase: "requested",

    requestedAt,
  });

  const result = requestTreasuryReconciliationPass({
    passId,

    limit: 25,

    context,
  });

  return prisma.$transaction(async (tx: TransactionClient) =>
    persistNewTreasuryReconciliationPassWithClient({
      result,

      eventId: `event-requested-${fixtureId}`,

      context,

      client: tx,
    }),
  );
}

async function transitionToRunning(params: {
  fixtureId: string;

  passId: string;

  startedAt: Date;
}) {
  const { fixtureId, passId, startedAt } = params;

  return prisma.$transaction(async (tx: TransactionClient) => {
    const loaded = await loadTreasuryReconciliationPassWithClient({
      passId,

      client: tx,
    });

    assert(loaded);

    const context = createContext({
      fixtureId,

      phase: "started",

      requestedAt: startedAt,
    });

    const result = startTreasuryReconciliationPass(
      loaded.aggregate,

      context,
    );

    return persistTreasuryReconciliationPassTransitionWithClient({
      expectedVersion: loaded.aggregate.metadata.version,

      result,

      eventId: `event-started-${fixtureId}`,

      context,

      client: tx,
    });
  });
}

async function transitionToCompleted(params: {
  fixtureId: string;

  passId: string;

  completedAt: Date;
}) {
  const { fixtureId, passId, completedAt } = params;

  return prisma.$transaction(async (tx: TransactionClient) => {
    const loaded = await loadTreasuryReconciliationPassWithClient({
      passId,

      client: tx,
    });

    assert(loaded);

    const context = createContext({
      fixtureId,

      phase: "completed",

      requestedAt: completedAt,
    });

    const result = completeTreasuryReconciliationPass({
      pass: loaded.aggregate,

      summary: COMPLETED_SUMMARY,

      context,
    });

    return persistTreasuryReconciliationPassTransitionWithClient({
      expectedVersion: loaded.aggregate.metadata.version,

      result,

      eventId: `event-completed-${fixtureId}`,

      context,

      client: tx,
    });
  });
}

async function transitionToFailed(params: {
  fixtureId: string;

  passId: string;

  failedAt: Date;
}) {
  const { fixtureId, passId, failedAt } = params;

  return prisma.$transaction(async (tx: TransactionClient) => {
    const loaded = await loadTreasuryReconciliationPassWithClient({
      passId,

      client: tx,
    });

    assert(loaded);

    const context = createContext({
      fixtureId,

      phase: "failed",

      requestedAt: failedAt,
    });

    const result = failTreasuryReconciliationPass({
      pass: loaded.aggregate,

      errorCode: "TREASURY_RECONCILIATION_BATCH_INFRASTRUCTURE_FAILURE",

      errorMessage: "Smoke fixture infrastructure failure",

      context,
    });

    return persistTreasuryReconciliationPassTransitionWithClient({
      expectedVersion: loaded.aggregate.metadata.version,

      result,

      eventId: `event-failed-${fixtureId}`,

      context,

      client: tx,
    });
  });
}

async function loadPass(passId: string) {
  return prisma.$transaction(async (tx: TransactionClient) =>
    loadTreasuryReconciliationPassWithClient({
      passId,

      client: tx,
    }),
  );
}

async function loadEvents(passId: string) {
  return prisma.treasuryGatewayEvent.findMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_RECONCILIATION_PASS,

      aggregateId: passId,
    },

    orderBy: {
      aggregateVersion: "asc",
    },

    select: {
      aggregateVersion: true,

      eventType: true,
    },
  });
}

async function cleanup(passIds: readonly string[]): Promise<void> {
  await prisma.treasuryGatewayEvent.deleteMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_RECONCILIATION_PASS,

      aggregateId: {
        in: [...passIds],
      },
    },
  });

  await prisma.treasuryGatewayAggregate.deleteMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_RECONCILIATION_PASS,

      aggregateId: {
        in: [...passIds],
      },
    },
  });
}

async function main(): Promise<void> {
  const runId = randomUUID();

  const completedFixtureId = `completed-${runId}`;

  const failedFixtureId = `failed-${runId}`;

  const completedPassId = `reconciliation-pass-${completedFixtureId}`;

  const failedPassId = `reconciliation-pass-${failedFixtureId}`;

  const passIds = [completedPassId, failedPassId] as const;

  const requestedAt = new Date("2026-07-06T01:00:00.000Z");

  const startedAt = new Date("2026-07-06T01:01:00.000Z");

  const terminalAt = new Date("2026-07-06T01:02:00.000Z");

  try {
    await createRequestedPass({
      fixtureId: completedFixtureId,

      passId: completedPassId,

      requestedAt,
    });

    await transitionToRunning({
      fixtureId: completedFixtureId,

      passId: completedPassId,

      startedAt,
    });

    await transitionToCompleted({
      fixtureId: completedFixtureId,

      passId: completedPassId,

      completedAt: terminalAt,
    });

    const completed = await loadPass(completedPassId);

    assert(completed);

    assert.equal(
      completed.aggregate.status,
      TREASURY_RECONCILIATION_PASS_STATUS.COMPLETED,
    );

    assert.equal(completed.aggregate.metadata.version, 3);

    assert.equal(completed.aggregate.requestedLimit, 25);

    assert.equal(
      completed.aggregate.requestedAt.toISOString(),
      requestedAt.toISOString(),
    );

    assert.equal(
      completed.aggregate.startedAt?.toISOString(),
      startedAt.toISOString(),
    );

    assert.equal(
      completed.aggregate.completedAt?.toISOString(),
      terminalAt.toISOString(),
    );

    assert.deepEqual(completed.aggregate.summary, COMPLETED_SUMMARY);

    assert.equal(completed.aggregate.failure, undefined);

    assert.throws(
      () =>
        failTreasuryReconciliationPass({
          pass: completed.aggregate,

          errorCode: "SHOULD_NOT_FAIL",

          errorMessage: "Completed pass must remain terminal",

          context: createContext({
            fixtureId: completedFixtureId,

            phase: "illegal-fail",

            requestedAt: new Date(terminalAt.getTime() + 60_000),
          }),
        }),

      /TREASURY_RECONCILIATION_PASS_FAIL_STATUS_INVALID/,
    );

    await createRequestedPass({
      fixtureId: failedFixtureId,

      passId: failedPassId,

      requestedAt,
    });

    await transitionToRunning({
      fixtureId: failedFixtureId,

      passId: failedPassId,

      startedAt,
    });

    await transitionToFailed({
      fixtureId: failedFixtureId,

      passId: failedPassId,

      failedAt: terminalAt,
    });

    const failed = await loadPass(failedPassId);

    assert(failed);

    assert.equal(
      failed.aggregate.status,
      TREASURY_RECONCILIATION_PASS_STATUS.FAILED,
    );

    assert.equal(failed.aggregate.metadata.version, 3);

    assert.deepEqual(
      failed.aggregate.failure,

      {
        errorCode: "TREASURY_RECONCILIATION_BATCH_INFRASTRUCTURE_FAILURE",

        errorMessage: "Smoke fixture infrastructure failure",
      },
    );

    assert.equal(failed.aggregate.summary, undefined);

    assert.throws(
      () =>
        completeTreasuryReconciliationPass({
          pass: failed.aggregate,

          summary: COMPLETED_SUMMARY,

          context: createContext({
            fixtureId: failedFixtureId,

            phase: "illegal-complete",

            requestedAt: new Date(terminalAt.getTime() + 60_000),
          }),
        }),

      /TREASURY_RECONCILIATION_PASS_COMPLETE_STATUS_INVALID/,
    );

    const completedEvents = await loadEvents(completedPassId);

    const failedEvents = await loadEvents(failedPassId);

    assert.deepEqual(
      completedEvents.map(
        (event: GatewayEventFixtureRow) => event.aggregateVersion,
      ),

      [1, 2, 3],
    );

    assert.deepEqual(
      completedEvents.map((event: GatewayEventFixtureRow) => event.eventType),

      [
        TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_REQUESTED,

        TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_STARTED,

        TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_COMPLETED,
      ],
    );

    assert.deepEqual(
      failedEvents.map(
        (event: GatewayEventFixtureRow) => event.aggregateVersion,
      ),

      [1, 2, 3],
    );

    assert.deepEqual(
      failedEvents.map((event: GatewayEventFixtureRow) => event.eventType),

      [
        TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_REQUESTED,

        TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_STARTED,

        TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_FAILED,
      ],
    );

    console.log("✓ Treasury reconciliation pass lifecycle smoke test passed");

    console.log({
      completed: {
        status: completed.aggregate.status,

        version: completed.aggregate.metadata.version,

        summary: completed.aggregate.summary,

        eventVersions: completedEvents.map(
          (event: GatewayEventFixtureRow) => event.aggregateVersion,
        ),
      },

      failed: {
        status: failed.aggregate.status,

        version: failed.aggregate.metadata.version,

        failure: failed.aggregate.failure,

        eventVersions: failedEvents.map(
          (event: GatewayEventFixtureRow) => event.aggregateVersion,
        ),
      },
    });
  } finally {
    await cleanup(passIds);
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
