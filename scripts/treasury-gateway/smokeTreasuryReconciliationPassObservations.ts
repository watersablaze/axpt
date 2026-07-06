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

import { findTreasuryReconciliationPassObservationsWithClient } from "../../src/domains/treasury/gateway/reconciliation-passes/observation/findTreasuryReconciliationPassObservationsWithClient";

import { loadTreasuryReconciliationPassObservationWithClient } from "../../src/domains/treasury/gateway/reconciliation-passes/observation/loadTreasuryReconciliationPassObservationWithClient";

import { loadTreasuryReconciliationPassWithClient } from "../../src/domains/treasury/gateway/reconciliation-passes/persistence/loadTreasuryReconciliationPassWithClient";

import { persistNewTreasuryReconciliationPassWithClient } from "../../src/domains/treasury/gateway/reconciliation-passes/persistence/persistNewTreasuryReconciliationPassWithClient";

import { persistTreasuryReconciliationPassTransitionWithClient } from "../../src/domains/treasury/gateway/reconciliation-passes/persistence/persistTreasuryReconciliationPassTransitionWithClient";

import type {
  TreasuryReconciliationPassLifecycleObservation,
  TreasuryReconciliationPassObservation,
} from "../../src/domains/treasury/gateway/reconciliation-passes/observation/contracts";

const prisma = new PrismaClient();

type ReconciliationPassLifecycleObservationFixture =
  TreasuryReconciliationPassLifecycleObservation;

const COMPLETED_SUMMARY = {
  discovered: 5,

  processed: 5,

  reconciled: 4,

  failed: 1,

  advanced: 3,

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

    limit: 50,

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

      errorCode:
        "TREASURY_RECONCILIATION_PASS_OPERATOR_OBSERVATION_SMOKE_FAILURE",

      errorMessage: "Operator observation smoke fixture failure",

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

  const completedFixtureId = `operator-completed-${runId}`;

  const failedFixtureId = `operator-failed-${runId}`;

  const completedPassId = `operator-pass-${completedFixtureId}`;

  const failedPassId = `operator-pass-${failedFixtureId}`;

  const unknownPassId = `operator-pass-unknown-${runId}`;

  const passIds = [completedPassId, failedPassId] as const;

  try {
    const unknown = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTreasuryReconciliationPassObservationWithClient({
        passId: unknownPassId,

        client: tx,
      }),
    );

    assert.equal(unknown, null);

    await createPass({
      fixtureId: completedFixtureId,

      passId: completedPassId,

      requestedAt: new Date("2026-07-06T04:00:00.000Z"),
    });

    await startPass({
      fixtureId: completedFixtureId,

      passId: completedPassId,

      startedAt: new Date("2026-07-06T04:01:00.000Z"),
    });

    await completePass({
      fixtureId: completedFixtureId,

      passId: completedPassId,

      completedAt: new Date("2026-07-06T04:02:00.000Z"),
    });

    await createPass({
      fixtureId: failedFixtureId,

      passId: failedPassId,

      requestedAt: new Date("2026-07-06T04:10:00.000Z"),
    });

    await startPass({
      fixtureId: failedFixtureId,

      passId: failedPassId,

      startedAt: new Date("2026-07-06T04:11:00.000Z"),
    });

    await failPass({
      fixtureId: failedFixtureId,

      passId: failedPassId,

      failedAt: new Date("2026-07-06T04:12:00.000Z"),
    });

    await pinPassUpdatedAt({
      passId: completedPassId,

      updatedAt: new Date("2099-02-01T00:00:00.000Z"),
    });

    await pinPassUpdatedAt({
      passId: failedPassId,

      updatedAt: new Date("2099-02-02T00:00:00.000Z"),
    });

    const completed = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTreasuryReconciliationPassObservationWithClient({
        passId: completedPassId,

        client: tx,
      }),
    );

    assert(completed);

    assert.equal(completed.passId, completedPassId);

    assert.equal(
      completed.status,
      TREASURY_RECONCILIATION_PASS_STATUS.COMPLETED,
    );

    assert.equal(completed.version, 3);

    assert.deepEqual(completed.summary, COMPLETED_SUMMARY);

    assert.equal(completed.failure, undefined);

    assert.deepEqual(
      completed.lifecycle.map(
        (event: ReconciliationPassLifecycleObservationFixture) => event.version,
      ),
      [1, 2, 3],
    );

    assert.deepEqual(
      completed.lifecycle.map(
        (event: ReconciliationPassLifecycleObservationFixture) =>
          event.eventType,
      ),
      [
        TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_REQUESTED,
        TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_STARTED,
        TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_COMPLETED,
      ],
    );

    const failed = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTreasuryReconciliationPassObservationWithClient({
        passId: failedPassId,

        client: tx,
      }),
    );

    assert(failed);

    assert.equal(failed.passId, failedPassId);

    assert.equal(failed.status, TREASURY_RECONCILIATION_PASS_STATUS.FAILED);

    assert.equal(failed.version, 3);

    assert.equal(failed.summary, undefined);

    assert.deepEqual(
      failed.failure,

      {
        errorCode:
          "TREASURY_RECONCILIATION_PASS_OPERATOR_OBSERVATION_SMOKE_FAILURE",

        errorMessage: "Operator observation smoke fixture failure",
      },
    );

    assert.deepEqual(
      failed.lifecycle.map(
        (event: ReconciliationPassLifecycleObservationFixture) => event.version,
      ),
      [1, 2, 3],
    );

    assert.deepEqual(
      failed.lifecycle.map(
        (event: ReconciliationPassLifecycleObservationFixture) =>
          event.eventType,
      ),
      [
        TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_REQUESTED,
        TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_STARTED,
        TREASURY_EVENT_TYPE.TREASURY_RECONCILIATION_PASS_FAILED,
      ],
    );

    const listed = await prisma.$transaction(async (tx: TransactionClient) =>
      findTreasuryReconciliationPassObservationsWithClient({
        limit: 2,

        client: tx,
      }),
    );

    assert.equal(listed.length, 2);

    assert.equal(listed[0]?.passId, failedPassId);

    assert.equal(listed[1]?.passId, completedPassId);

    console.log(
      "✓ Treasury reconciliation pass operator observations smoke test passed",
    );

    console.log({
      completed: {
        status: completed.status,
        version: completed.version,
        summary: completed.summary,
        lifecycleVersions: completed.lifecycle.map(
          (event: ReconciliationPassLifecycleObservationFixture) =>
            event.version,
        ),
      },
      failed: {
        status: failed.status,
        version: failed.version,
        failure: failed.failure,
        lifecycleVersions: failed.lifecycle.map(
          (event: ReconciliationPassLifecycleObservationFixture) =>
            event.version,
        ),
      },
      listing: {
        limit: 2,
        order: listed.map(
          (observation: TreasuryReconciliationPassObservation) =>
            observation.passId,
        ),
      },
      unknown: {
        observation: null,
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
