import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { createTreasuryExecution } from "../../src/domains/treasury/gateway/executions/createTreasuryExecution";

import { persistNewTreasuryExecutionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/persistNewTreasuryExecutionWithClient";

import { beginTreasuryExecutionValidationDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/beginTreasuryExecutionValidationDurablyWithClient";

import { markTreasuryExecutionReadyForAuthorizationDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/markTreasuryExecutionReadyForAuthorizationDurablyWithClient";

import { authorizeTreasuryExecutionDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/authorizeTreasuryExecutionDurablyWithClient";

import { dispatchAuthorizedInternalWalletExecutionDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/dispatchAuthorizedInternalWalletExecutionDurablyWithClient";

import { loadTreasuryExecutionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/loadTreasuryExecutionWithClient";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { TREASURY_EXECUTION_ADAPTER_KIND } from "../../src/domains/treasury/gateway/executions/routing/contracts";

import { TREASURY_EXECUTION_STATUS } from "../../src/domains/treasury/gateway/executions/status";

const prisma = new PrismaClient();

async function createAuthorizedExecution(params: {
  fixtureId: string;

  executionId: string;

  settlementEndpointId: string;
}): Promise<void> {
  const { fixtureId, executionId, settlementEndpointId } = params;

  const correlationId = `correlation-${fixtureId}`;

  const createdAt = new Date();

  const createContext = {
    commandId: `command-create-${fixtureId}`,

    actorId: `actor-create-${fixtureId}`,

    correlationId,

    requestedAt: createdAt,

    idempotencyKey: `create-${fixtureId}`,
  };

  const created = createTreasuryExecution({
    executionId,

    reference: `SMOKE-${fixtureId}`,

    command: {
      context: createContext,

      payload: {
        programId: `program-${fixtureId}`,

        allocationId: `allocation-${fixtureId}`,

        kind: "BENEFICIARY_DISTRIBUTION",

        beneficiaryProfileId: `beneficiary-${fixtureId}`,

        settlementEndpointId,

        amount: {
          amount: "25.50",

          currency: "USD",
        },

        purpose: "Atomic durable internal-wallet dispatch smoke test",
      },
    },
  });

  await prisma.$transaction(async (tx: TransactionClient) => {
    await persistNewTreasuryExecutionWithClient({
      result: created,

      eventId: `event-created-${fixtureId}`,

      context: createContext,

      client: tx,
    });

    await beginTreasuryExecutionValidationDurablyWithClient({
      command: {
        context: {
          commandId: `command-validation-${fixtureId}`,

          actorId: `actor-validation-${fixtureId}`,

          correlationId,

          requestedAt: new Date(createdAt.getTime() + 60_000),

          idempotencyKey: `validation-${fixtureId}`,
        },

        payload: {
          executionId,
        },
      },

      eventId: `event-validation-${fixtureId}`,

      client: tx,
    });

    await markTreasuryExecutionReadyForAuthorizationDurablyWithClient({
      command: {
        context: {
          commandId: `command-ready-${fixtureId}`,

          actorId: `actor-ready-${fixtureId}`,

          correlationId,

          requestedAt: new Date(createdAt.getTime() + 120_000),

          idempotencyKey: `ready-${fixtureId}`,
        },

        payload: {
          executionId,
        },
      },

      eventId: `event-ready-${fixtureId}`,

      client: tx,
    });

    await authorizeTreasuryExecutionDurablyWithClient({
      command: {
        context: {
          commandId: `command-authorized-${fixtureId}`,

          actorId: `actor-authorized-${fixtureId}`,

          authorityGrantId: `authority-grant-${fixtureId}`,

          correlationId,

          requestedAt: new Date(createdAt.getTime() + 180_000),

          idempotencyKey: `authorized-${fixtureId}`,
        },

        payload: {
          executionId,

          approvalIds: [`approval-${fixtureId}`],
        },
      },

      eventId: `event-authorized-${fixtureId}`,

      client: tx,
    });
  });
}

async function cleanupExecution(executionId: string): Promise<void> {
  const actions = await prisma.treasuryAction.findMany({
    where: {
      metadata: {
        path: ["gatewayExecutionId"],

        equals: executionId,
      },
    },

    select: {
      id: true,
    },
  });

  const actionIds = actions.map((action: { id: string }) => action.id);

  if (actionIds.length > 0) {
    await prisma.treasuryExecutionQueue.deleteMany({
      where: {
        treasuryActionId: {
          in: actionIds,
        },
      },
    });

    await prisma.treasuryApproval.deleteMany({
      where: {
        actionId: {
          in: actionIds,
        },
      },
    });

    await prisma.treasuryAction.deleteMany({
      where: {
        id: {
          in: actionIds,
        },
      },
    });
  }

  await prisma.treasuryGatewayEvent.deleteMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

      aggregateId: executionId,
    },
  });

  await prisma.treasuryGatewayAggregate.deleteMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

      aggregateId: executionId,
    },
  });
}

async function main(): Promise<void> {
  const successFixtureId = `success-${randomUUID()}`;

  const successExecutionId = `smoke-atomic-dispatch-${successFixtureId}`;

  const successEndpointId = `endpoint-${successFixtureId}`;

  const rollbackFixtureId = `rollback-${randomUUID()}`;

  const rollbackExecutionId = `smoke-atomic-dispatch-${rollbackFixtureId}`;

  const rollbackEndpointId = `endpoint-${rollbackFixtureId}`;

  try {
    await createAuthorizedExecution({
      fixtureId: successFixtureId,

      executionId: successExecutionId,

      settlementEndpointId: successEndpointId,
    });

    const successResult = await prisma.$transaction(
      async (tx: TransactionClient) =>
        dispatchAuthorizedInternalWalletExecutionDurablyWithClient({
          executionId: successExecutionId,

          handoffId: `handoff-${successFixtureId}`,

          capability: {
            kind: TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET,

            settlementEndpointId: successEndpointId,

            operationalInitiatorUserId: `operator-${successFixtureId}`,

            fromUserId: `source-${successFixtureId}`,

            toUserId: `beneficiary-${successFixtureId}`,

            assetCode: "USD",
          },

          dispatchContext: {
            commandId: `command-dispatch-${successFixtureId}`,

            actorId: `actor-dispatch-${successFixtureId}`,

            correlationId: `correlation-${successFixtureId}`,

            causationId: `command-authorized-${successFixtureId}`,

            requestedAt: new Date(),

            idempotencyKey: `dispatch-${successFixtureId}`,
          },

          acknowledgementEventId: `event-queued-${successFixtureId}`,

          acknowledgementContext: {
            commandId: `command-queued-${successFixtureId}`,

            actorId: `actor-queued-${successFixtureId}`,

            correlationId: `correlation-${successFixtureId}`,

            causationId: `command-dispatch-${successFixtureId}`,

            requestedAt: new Date(),

            idempotencyKey: `acknowledgement-${successFixtureId}`,
          },

          client: tx,
        }),
    );

    assert.equal(
      successResult.gateway.aggregate.status,
      TREASURY_EXECUTION_STATUS.QUEUED,
    );

    assert.equal(successResult.gateway.aggregate.metadata.version, 5);

    assert.equal(
      successResult.gateway.event.eventType,
      TREASURY_EVENT_TYPE.TREASURY_EXECUTION_QUEUED,
    );

    assert.equal(successResult.dispatch.treasuryActionStatus, "QUEUED");

    assert.equal(successResult.dispatch.treasuryQueueStatus, "PENDING");

    const successLoaded = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryExecutionWithClient({
          executionId: successExecutionId,

          client: tx,
        }),
    );

    assert(successLoaded);

    assert.equal(
      successLoaded.aggregate.status,
      TREASURY_EXECUTION_STATUS.QUEUED,
    );

    assert.equal(successLoaded.aggregate.metadata.version, 5);

    const successEvents = await prisma.treasuryGatewayEvent.findMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

        aggregateId: successExecutionId,
      },

      orderBy: {
        aggregateVersion: "asc",
      },

      select: {
        aggregateVersion: true,

        eventType: true,
      },
    });

    assert.deepEqual(
      successEvents.map(
        (event: { aggregateVersion: number }) => event.aggregateVersion,
      ),

      [1, 2, 3, 4, 5],
    );

    await createAuthorizedExecution({
      fixtureId: rollbackFixtureId,

      executionId: rollbackExecutionId,

      settlementEndpointId: rollbackEndpointId,
    });

    let rollbackActionId: string | null = null;

    await assert.rejects(
      prisma.$transaction(async (tx: TransactionClient) => {
        const result =
          await dispatchAuthorizedInternalWalletExecutionDurablyWithClient({
            executionId: rollbackExecutionId,

            handoffId: `handoff-${rollbackFixtureId}`,

            capability: {
              kind: TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET,

              settlementEndpointId: rollbackEndpointId,

              operationalInitiatorUserId: `operator-${rollbackFixtureId}`,

              fromUserId: `source-${rollbackFixtureId}`,

              toUserId: `beneficiary-${rollbackFixtureId}`,

              assetCode: "USD",
            },

            dispatchContext: {
              commandId: `command-dispatch-${rollbackFixtureId}`,

              actorId: `actor-dispatch-${rollbackFixtureId}`,

              correlationId: `correlation-${rollbackFixtureId}`,

              requestedAt: new Date(),

              idempotencyKey: `dispatch-${rollbackFixtureId}`,
            },

            acknowledgementEventId: `event-queued-${rollbackFixtureId}`,

            acknowledgementContext: {
              commandId: `command-queued-${rollbackFixtureId}`,

              actorId: `actor-queued-${rollbackFixtureId}`,

              correlationId: `correlation-${rollbackFixtureId}`,

              requestedAt: new Date(),

              idempotencyKey: `acknowledgement-${rollbackFixtureId}`,
            },

            client: tx,
          });

        rollbackActionId = result.dispatch.treasuryActionId;

        throw new Error("[FORCED_POST_DISPATCH_FAILURE]");
      }),

      /FORCED_POST_DISPATCH_FAILURE/,
    );

    const rollbackLoaded = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryExecutionWithClient({
          executionId: rollbackExecutionId,

          client: tx,
        }),
    );

    assert(rollbackLoaded);

    assert.equal(
      rollbackLoaded.aggregate.status,
      TREASURY_EXECUTION_STATUS.AUTHORIZED,
    );

    assert.equal(rollbackLoaded.aggregate.metadata.version, 4);

    const rollbackQueuedEventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

        aggregateId: rollbackExecutionId,

        eventType: TREASURY_EVENT_TYPE.TREASURY_EXECUTION_QUEUED,
      },
    });

    assert.equal(rollbackQueuedEventCount, 0);

    if (rollbackActionId) {
      const rollbackAction = await prisma.treasuryAction.findUnique({
        where: {
          id: rollbackActionId,
        },
      });

      assert.equal(rollbackAction, null);

      const rollbackQueueCount = await prisma.treasuryExecutionQueue.count({
        where: {
          treasuryActionId: rollbackActionId,
        },
      });

      assert.equal(rollbackQueueCount, 0);
    }

    console.log(
      "✓ Treasury Gateway atomic durable internal-wallet dispatch smoke test passed",
    );

    console.log({
      success: {
        finalStatus: successLoaded.aggregate.status,

        finalVersion: successLoaded.aggregate.metadata.version,

        eventVersions: successEvents.map(
          (event: { aggregateVersion: number }) => event.aggregateVersion,
        ),

        treasuryActionStatus: successResult.dispatch.treasuryActionStatus,

        treasuryQueueStatus: successResult.dispatch.treasuryQueueStatus,
      },

      rollback: {
        finalStatus: rollbackLoaded.aggregate.status,

        finalVersion: rollbackLoaded.aggregate.metadata.version,

        queuedEventCount: rollbackQueuedEventCount,

        operationalRecordsRolledBack: true,
      },
    });
  } finally {
    await cleanupExecution(successExecutionId);

    await cleanupExecution(rollbackExecutionId);
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
