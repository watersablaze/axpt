import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { runDurableTreasuryReconciliationPassWithDependencies } from "../../src/domains/treasury/gateway/reconciliation-passes/application/runDurableTreasuryReconciliationPassWithDependencies";

import { TREASURY_RECONCILIATION_PASS_STATUS } from "../../src/domains/treasury/gateway/reconciliation-passes/status";

import { persistNewTreasuryReconciliationPassWithClient } from "../../src/domains/treasury/gateway/reconciliation-passes/persistence/persistNewTreasuryReconciliationPassWithClient";

import { persistTreasuryReconciliationPassTransitionWithClient } from "../../src/domains/treasury/gateway/reconciliation-passes/persistence/persistTreasuryReconciliationPassTransitionWithClient";

import { loadTreasuryReconciliationPassWithClient } from "../../src/domains/treasury/gateway/reconciliation-passes/persistence/loadTreasuryReconciliationPassWithClient";

import { TREASURY_EXECUTION_BATCH_ITEM_STATUS } from "../../src/domains/treasury/gateway/executions/application/runTreasuryExecutionReconciliationBatchContracts";

import { TREASURY_EXECUTION_RECONCILIATION_OUTCOME } from "../../src/domains/treasury/gateway/executions/application/reconcileTreasuryExecutionByDispatchOwnershipContracts";

const prisma = new PrismaClient();

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

type GatewayEventFixtureRow = Readonly<{
  aggregateVersion: number;

  eventType: string;
}>;

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

  const completedPassId = `durable-pass-completed-${runId}`;

  const failedPassId = `durable-pass-failed-${runId}`;

  const passIds = [completedPassId, failedPassId] as const;

  try {
    const completed =
      await runDurableTreasuryReconciliationPassWithDependencies({
        passId: completedPassId,

        limit: 3,

        context: {
          commandId: `command-completed-${runId}`,

          actorId: `actor-${runId}`,

          authorityGrantId: `authority-${runId}`,

          correlationId: `correlation-completed-${runId}`,

          requestedAt: new Date(),

          idempotencyKey: `completed-${runId}`,
        },

        persistRequestedPass: async ({ result, eventId, context }) =>
          prisma.$transaction(async (tx: TransactionClient) => {
            const persisted =
              await persistNewTreasuryReconciliationPassWithClient({
                result,

                eventId,

                context,

                client: tx,
              });

            return persisted.aggregate;
          }),

        persistPassTransition: async ({
          expectedVersion,
          result,
          eventId,
          context,
        }) =>
          prisma.$transaction(async (tx: TransactionClient) => {
            const persisted =
              await persistTreasuryReconciliationPassTransitionWithClient({
                expectedVersion,

                result,

                eventId,

                context,

                client: tx,
              });

            return persisted.aggregate;
          }),

        runBatch: async () => ({
          items: [
            {
              status: TREASURY_EXECUTION_BATCH_ITEM_STATUS.FAILED,

              executionId: `execution-failed-${runId}`,

              errorCode: "SMOKE_CANDIDATE_FAILURE",

              errorMessage: "Candidate-level smoke failure",
            },

            {
              status: TREASURY_EXECUTION_BATCH_ITEM_STATUS.RECONCILED,

              executionId: `execution-unchanged-${runId}`,

              result: {
                executionId: `execution-unchanged-${runId}`,

                outcome: TREASURY_EXECUTION_RECONCILIATION_OUTCOME.NO_CHANGE,

                adapterKind: "INTERNAL_WALLET",

                beforeStatus: "QUEUED",

                afterStatus: "QUEUED",

                beforeVersion: 5,

                afterVersion: 5,

                ownership: null,

                internalWallet: null,
              },
            },

            {
              status: TREASURY_EXECUTION_BATCH_ITEM_STATUS.RECONCILED,

              executionId: `execution-advanced-${runId}`,

              result: {
                executionId: `execution-advanced-${runId}`,

                outcome:
                  TREASURY_EXECUTION_RECONCILIATION_OUTCOME.ADVANCED_TO_INITIATED_AND_CONFIRMED,

                adapterKind: "INTERNAL_WALLET",

                beforeStatus: "QUEUED",

                afterStatus: "CONFIRMED",

                beforeVersion: 5,

                afterVersion: 7,

                ownership: null,

                internalWallet: null,
              },
            },
          ],

          summary: COMPLETED_SUMMARY,
        }),
      });

    assert.equal(
      completed.pass.status,
      TREASURY_RECONCILIATION_PASS_STATUS.COMPLETED,
    );

    assert.equal(completed.pass.metadata.version, 3);

    assert.deepEqual(completed.pass.summary, COMPLETED_SUMMARY);

    assert(completed.batch);

    assert.deepEqual(completed.batch.summary, COMPLETED_SUMMARY);

    const completedLoaded = await loadPass(completedPassId);

    assert(completedLoaded);

    assert.equal(
      completedLoaded.aggregate.status,
      TREASURY_RECONCILIATION_PASS_STATUS.COMPLETED,
    );

    assert.deepEqual(completedLoaded.aggregate.summary, COMPLETED_SUMMARY);

    const failed = await runDurableTreasuryReconciliationPassWithDependencies({
      passId: failedPassId,

      limit: 10,

      context: {
        commandId: `command-failed-${runId}`,

        actorId: `actor-${runId}`,

        authorityGrantId: `authority-${runId}`,

        correlationId: `correlation-failed-${runId}`,

        requestedAt: new Date(),

        idempotencyKey: `failed-${runId}`,
      },

      persistRequestedPass: async ({ result, eventId, context }) =>
        prisma.$transaction(async (tx: TransactionClient) => {
          const persisted =
            await persistNewTreasuryReconciliationPassWithClient({
              result,

              eventId,

              context,

              client: tx,
            });

          return persisted.aggregate;
        }),

      persistPassTransition: async ({
        expectedVersion,
        result,
        eventId,
        context,
      }) =>
        prisma.$transaction(async (tx: TransactionClient) => {
          const persisted =
            await persistTreasuryReconciliationPassTransitionWithClient({
              expectedVersion,

              result,

              eventId,

              context,

              client: tx,
            });

          return persisted.aggregate;
        }),

      runBatch: async () => {
        throw new Error(
          "[TREASURY_RECONCILIATION_BATCH_DATABASE_UNAVAILABLE] Smoke batch infrastructure failure",
        );
      },
    });

    assert.equal(
      failed.pass.status,
      TREASURY_RECONCILIATION_PASS_STATUS.FAILED,
    );

    assert.equal(failed.pass.metadata.version, 3);

    assert.equal(failed.batch, null);

    assert.deepEqual(
      failed.pass.failure,

      {
        errorCode: "TREASURY_RECONCILIATION_BATCH_DATABASE_UNAVAILABLE",

        errorMessage:
          "[TREASURY_RECONCILIATION_BATCH_DATABASE_UNAVAILABLE] Smoke batch infrastructure failure",
      },
    );

    const failedLoaded = await loadPass(failedPassId);

    assert(failedLoaded);

    assert.equal(
      failedLoaded.aggregate.status,
      TREASURY_RECONCILIATION_PASS_STATUS.FAILED,
    );

    assert.deepEqual(failedLoaded.aggregate.failure, failed.pass.failure);

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

    console.log("✓ Durable Treasury reconciliation pass smoke test passed");

    console.log({
      completed: {
        status: completed.pass.status,

        version: completed.pass.metadata.version,

        summary: completed.pass.summary,

        eventVersions: completedEvents.map(
          (event: GatewayEventFixtureRow) => event.aggregateVersion,
        ),
      },

      failed: {
        status: failed.pass.status,

        version: failed.pass.metadata.version,

        failure: failed.pass.failure,

        eventVersions: failedEvents.map(
          (event: GatewayEventFixtureRow) => event.aggregateVersion,
        ),
      },

      distinction: {
        candidateFailureInsideBatch: "COMPLETED",

        batchInfrastructureFailure: "FAILED",
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
