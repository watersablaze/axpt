import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { completeTreasuryReconciliationPass } from "../../src/domains/treasury/gateway/reconciliation-passes/completeTreasuryReconciliationPass";

import { failTreasuryReconciliationPass } from "../../src/domains/treasury/gateway/reconciliation-passes/failTreasuryReconciliationPass";

import { requestTreasuryReconciliationPass } from "../../src/domains/treasury/gateway/reconciliation-passes/requestTreasuryReconciliationPass";

import { startTreasuryReconciliationPass } from "../../src/domains/treasury/gateway/reconciliation-passes/startTreasuryReconciliationPass";

import { TREASURY_RECONCILIATION_PASS_STATUS } from "../../src/domains/treasury/gateway/reconciliation-passes/status";

import { findTreasuryReconciliationPassesWithClient } from "../../src/domains/treasury/gateway/reconciliation-passes/persistence/findTreasuryReconciliationPassesWithClient";

import { loadTreasuryReconciliationPassWithClient } from "../../src/domains/treasury/gateway/reconciliation-passes/persistence/loadTreasuryReconciliationPassWithClient";

import { loadTreasuryReconciliationPassLifecycleWithClient } from "../../src/domains/treasury/gateway/reconciliation-passes/persistence/loadTreasuryReconciliationPassLifecycleWithClient";

import { persistNewTreasuryReconciliationPassWithClient } from "../../src/domains/treasury/gateway/reconciliation-passes/persistence/persistNewTreasuryReconciliationPassWithClient";

import { persistTreasuryReconciliationPassTransitionWithClient } from "../../src/domains/treasury/gateway/reconciliation-passes/persistence/persistTreasuryReconciliationPassTransitionWithClient";

import type {
  LoadedTreasuryReconciliationPass,
  TreasuryReconciliationPassLifecycleEvent,
} from "../../src/domains/treasury/gateway/reconciliation-passes/persistence/contracts";

const prisma = new PrismaClient();

type LoadedReconciliationPassFixture = LoadedTreasuryReconciliationPass;

type ReconciliationPassLifecycleEventFixture =
  TreasuryReconciliationPassLifecycleEvent;

const COMPLETED_SUMMARY = {
  discovered: 4,

  processed: 4,

  reconciled: 3,

  failed: 1,

  advanced: 2,

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

async function createPass(params: {
  fixtureId: string;

  passId: string;

  requestedAt: Date;
}): Promise<void> {
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

  await prisma.$transaction(async (tx: TransactionClient) => {
    await persistNewTreasuryReconciliationPassWithClient({
      result,

      eventId: `event-requested-${fixtureId}`,

      context,

      client: tx,
    });
  });
}

async function startPass(params: {
  fixtureId: string;

  passId: string;

  startedAt: Date;
}): Promise<void> {
  const { fixtureId, passId, startedAt } = params;

  await prisma.$transaction(async (tx: TransactionClient) => {
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

    await persistTreasuryReconciliationPassTransitionWithClient({
      expectedVersion: loaded.aggregate.metadata.version,

      result,

      eventId: `event-started-${fixtureId}`,

      context,

      client: tx,
    });
  });
}

async function completePass(params: {
  fixtureId: string;

  passId: string;

  completedAt: Date;
}): Promise<void> {
  const { fixtureId, passId, completedAt } = params;

  await prisma.$transaction(async (tx: TransactionClient) => {
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

    await persistTreasuryReconciliationPassTransitionWithClient({
      expectedVersion: loaded.aggregate.metadata.version,

      result,

      eventId: `event-completed-${fixtureId}`,

      context,

      client: tx,
    });
  });
}

async function failPass(params: {
  fixtureId: string;

  passId: string;

  failedAt: Date;
}): Promise<void> {
  const { fixtureId, passId, failedAt } = params;

  await prisma.$transaction(async (tx: TransactionClient) => {
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

      errorCode: "TREASURY_RECONCILIATION_PASS_OBSERVATION_SMOKE_FAILURE",

      errorMessage: "Observation read smoke fixture failure",

      context,
    });

    await persistTreasuryReconciliationPassTransitionWithClient({
      expectedVersion: loaded.aggregate.metadata.version,

      result,

      eventId: `event-failed-${fixtureId}`,

      context,

      client: tx,
    });
  });
}

async function pinPassUpdatedAt(params: {
  passId: string;

  updatedAt: Date;
}): Promise<void> {
  const { passId, updatedAt } = params;

  await prisma.treasuryGatewayAggregate.update({
    where: {
      aggregateType_aggregateId: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_RECONCILIATION_PASS,

        aggregateId: passId,
      },
    },

    data: {
      updatedAt,
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

  const completedPassId = `observation-pass-${completedFixtureId}`;

  const failedPassId = `observation-pass-${failedFixtureId}`;

  const unknownPassId = `observation-pass-unknown-${runId}`;

  const passIds = [completedPassId, failedPassId] as const;

  const requestedAt = new Date("2026-07-06T03:00:00.000Z");

  const startedAt = new Date("2026-07-06T03:01:00.000Z");

  const completedAt = new Date("2026-07-06T03:02:00.000Z");

  const failedAt = new Date("2026-07-06T03:03:00.000Z");

  try {
    const unknown = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTreasuryReconciliationPassWithClient({
        passId: unknownPassId,

        client: tx,
      }),
    );

    assert.equal(unknown, null);

    const unknownLifecycle = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryReconciliationPassLifecycleWithClient({
          passId: unknownPassId,

          client: tx,
        }),
    );

    assert.deepEqual(unknownLifecycle.events, []);

    await createPass({
      fixtureId: completedFixtureId,

      passId: completedPassId,

      requestedAt,
    });

    await startPass({
      fixtureId: completedFixtureId,

      passId: completedPassId,

      startedAt,
    });

    await completePass({
      fixtureId: completedFixtureId,

      passId: completedPassId,

      completedAt,
    });

    await createPass({
      fixtureId: failedFixtureId,

      passId: failedPassId,

      requestedAt,
    });

    await startPass({
      fixtureId: failedFixtureId,

      passId: failedPassId,

      startedAt,
    });

    await failPass({
      fixtureId: failedFixtureId,

      passId: failedPassId,

      failedAt,
    });

    await pinPassUpdatedAt({
      passId: completedPassId,

      updatedAt: new Date("2099-01-01T00:00:00.000Z"),
    });

    await pinPassUpdatedAt({
      passId: failedPassId,

      updatedAt: new Date("2099-01-02T00:00:00.000Z"),
    });

    const completed = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTreasuryReconciliationPassWithClient({
        passId: completedPassId,

        client: tx,
      }),
    );

    assert(completed);

    assert.equal(
      completed.aggregate.status,
      TREASURY_RECONCILIATION_PASS_STATUS.COMPLETED,
    );

    assert.equal(completed.aggregate.metadata.version, 3);

    assert.deepEqual(completed.aggregate.summary, COMPLETED_SUMMARY);

    const failed = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTreasuryReconciliationPassWithClient({
        passId: failedPassId,

        client: tx,
      }),
    );

    assert(failed);

    assert.equal(
      failed.aggregate.status,
      TREASURY_RECONCILIATION_PASS_STATUS.FAILED,
    );

    assert.equal(failed.aggregate.metadata.version, 3);

    assert.deepEqual(
      failed.aggregate.failure,

      {
        errorCode: "TREASURY_RECONCILIATION_PASS_OBSERVATION_SMOKE_FAILURE",

        errorMessage: "Observation read smoke fixture failure",
      },
    );

    const completedLifecycle = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryReconciliationPassLifecycleWithClient({
          passId: completedPassId,

          client: tx,
        }),
    );

    const failedLifecycle = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryReconciliationPassLifecycleWithClient({
          passId: failedPassId,

          client: tx,
        }),
    );

    assert.deepEqual(
      completedLifecycle.events.map(
        (event: ReconciliationPassLifecycleEventFixture) =>
          event.aggregateVersion,
      ),
      [1, 2, 3],
    );

    assert.deepEqual(
      completedLifecycle.events.map(
        (event: ReconciliationPassLifecycleEventFixture) => event.eventType,
      ),
      [
        TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_REQUESTED,
        TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_STARTED,
        TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_COMPLETED,
      ],
    );

    assert.deepEqual(
      failedLifecycle.events.map(
        (event: ReconciliationPassLifecycleEventFixture) =>
          event.aggregateVersion,
      ),
      [1, 2, 3],
    );

    assert.deepEqual(
      failedLifecycle.events.map(
        (event: ReconciliationPassLifecycleEventFixture) => event.eventType,
      ),
      [
        TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_REQUESTED,
        TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_STARTED,
        TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_FAILED,
      ],
    );

    const listed = await prisma.$transaction(async (tx: TransactionClient) =>
      findTreasuryReconciliationPassesWithClient({
        limit: 2,

        client: tx,
      }),
    );

    const fixturePasses = listed.filter(
      (item: LoadedReconciliationPassFixture) =>
        passIds.includes(
          item.aggregate.id as typeof completedPassId | typeof failedPassId,
        ),
    );

    assert.equal(fixturePasses.length, 2);

    assert.equal(fixturePasses[0]?.aggregate.id, failedPassId);

    assert.equal(fixturePasses[1]?.aggregate.id, completedPassId);

    console.log(
      "✓ Treasury reconciliation pass observation reads smoke test passed",
    );

    console.log({
      completed: {
        status: completed.aggregate.status,
        version: completed.aggregate.metadata.version,
        eventVersions: completedLifecycle.events.map(
          (event: ReconciliationPassLifecycleEventFixture) =>
            event.aggregateVersion,
        ),
      },
      failed: {
        status: failed.aggregate.status,
        version: failed.aggregate.metadata.version,
        eventVersions: failedLifecycle.events.map(
          (event: ReconciliationPassLifecycleEventFixture) =>
            event.aggregateVersion,
        ),
      },
      listing: {
        limit: 2,
        order: fixturePasses.map(
          (item: LoadedReconciliationPassFixture) => item.aggregate.id,
        ),
      },
      unknown: {
        pass: null,
        lifecycleEvents: unknownLifecycle.events.length,
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
