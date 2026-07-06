import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { createTreasuryExecution } from "../../src/domains/treasury/gateway/executions/createTreasuryExecution";

import { persistNewTreasuryExecutionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/persistNewTreasuryExecutionWithClient";

import { beginTreasuryExecutionValidationDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/beginTreasuryExecutionValidationDurablyWithClient";

import { markTreasuryExecutionReadyForAuthorizationDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/markTreasuryExecutionReadyForAuthorizationDurablyWithClient";

import { authorizeTreasuryExecutionDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/authorizeTreasuryExecutionDurablyWithClient";

import { dispatchAuthorizedInternalWalletExecutionDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/dispatchAuthorizedInternalWalletExecutionDurablyWithClient";

import { runTreasuryExecutionReconciliationBatchWithDependencies } from "../../src/domains/treasury/gateway/executions/application/runTreasuryExecutionReconciliationBatchWithDependencies";

import { findTreasuryExecutionReconciliationCandidatesWithClient } from "../../src/domains/treasury/gateway/executions/persistence/findTreasuryExecutionReconciliationCandidatesWithClient";

import { reconcileTreasuryExecutionByDispatchOwnershipDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/reconcileTreasuryExecutionByDispatchOwnershipDurablyWithClient";

import { TREASURY_EXECUTION_RECONCILIATION_OUTCOME } from "../../src/domains/treasury/gateway/executions/application/reconcileTreasuryExecutionByDispatchOwnershipContracts";

import { TREASURY_EXECUTION_BATCH_ITEM_STATUS } from "../../src/domains/treasury/gateway/executions/application/runTreasuryExecutionReconciliationBatchContracts";

import { loadTreasuryExecutionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/loadTreasuryExecutionWithClient";

import { acknowledgeTreasuryExecutionQueued } from "../../src/domains/treasury/gateway/executions/acknowledgeTreasuryExecutionQueued";

import { persistTreasuryExecutionTransitionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/persistTreasuryExecutionTransitionWithClient";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EXECUTION_ADAPTER_KIND } from "../../src/domains/treasury/gateway/executions/routing/contracts";

import { TREASURY_EXECUTION_STATUS } from "../../src/domains/treasury/gateway/executions/status";

import { TREASURY_ACTION_STATUS } from "../../src/domains/treasury/stateMachine";

const prisma = new PrismaClient();

type WalletFixture = Readonly<{
  operatorUserId: string;

  senderUserId: string;

  receiverUserId: string;

  senderWalletId: string;

  receiverWalletId: string;
}>;

type Fixture = Readonly<{
  fixtureId: string;

  executionId: string;

  settlementEndpointId: string;

  walletFixture: WalletFixture;
}>;

type TreasuryActionFixtureRow = Readonly<{
  id: string;
}>;

async function createWalletFixture(fixtureId: string): Promise<WalletFixture> {
  const operator = await prisma.user.create({
    data: {
      username: `gateway-owner-operator-${fixtureId}`,

      email: `gateway-owner-operator-${fixtureId}@example.invalid`,

      passwordHash: "SMOKE_TEST_ONLY",
    },
  });

  const sender = await prisma.user.create({
    data: {
      username: `gateway-owner-sender-${fixtureId}`,

      email: `gateway-owner-sender-${fixtureId}@example.invalid`,

      passwordHash: "SMOKE_TEST_ONLY",
    },
  });

  const receiver = await prisma.user.create({
    data: {
      username: `gateway-owner-receiver-${fixtureId}`,

      email: `gateway-owner-receiver-${fixtureId}@example.invalid`,

      passwordHash: "SMOKE_TEST_ONLY",
    },
  });

  const senderWallet = await prisma.wallet.create({
    data: {
      userId: sender.id,
    },
  });

  const receiverWallet = await prisma.wallet.create({
    data: {
      userId: receiver.id,
    },
  });

  return {
    operatorUserId: operator.id,

    senderUserId: sender.id,

    receiverUserId: receiver.id,

    senderWalletId: senderWallet.id,

    receiverWalletId: receiverWallet.id,
  };
}

async function createFixture(prefix: string): Promise<Fixture> {
  const fixtureId = `${prefix}-${randomUUID()}`;

  return {
    fixtureId,

    executionId: `smoke-owner-${fixtureId}`,

    settlementEndpointId: `endpoint-${fixtureId}`,

    walletFixture: await createWalletFixture(fixtureId),
  };
}

async function createAuthorizedExecution(fixture: Fixture): Promise<void> {
  const { fixtureId, executionId, settlementEndpointId } = fixture;

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

        purpose: "Dispatch ownership reconciliation smoke test",
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

async function dispatchInternalWallet(fixture: Fixture) {
  const { fixtureId, executionId, settlementEndpointId, walletFixture } =
    fixture;

  return prisma.$transaction(async (tx: TransactionClient) =>
    dispatchAuthorizedInternalWalletExecutionDurablyWithClient({
      executionId,

      handoffId: `handoff-${fixtureId}`,

      capability: {
        kind: TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET,

        settlementEndpointId,

        operationalInitiatorUserId: walletFixture.operatorUserId,

        fromUserId: walletFixture.senderUserId,

        toUserId: walletFixture.receiverUserId,

        assetCode: "USD",
      },

      dispatchContext: {
        commandId: `command-dispatch-${fixtureId}`,

        actorId: `actor-dispatch-${fixtureId}`,

        correlationId: `correlation-${fixtureId}`,

        causationId: `command-authorized-${fixtureId}`,

        requestedAt: new Date(),

        idempotencyKey: `dispatch-${fixtureId}`,
      },

      acknowledgementEventId: `event-queued-${fixtureId}`,

      acknowledgementContext: {
        commandId: `command-queued-${fixtureId}`,

        actorId: `actor-queued-${fixtureId}`,

        correlationId: `correlation-${fixtureId}`,

        causationId: `command-dispatch-${fixtureId}`,

        requestedAt: new Date(),

        idempotencyKey: `acknowledgement-${fixtureId}`,
      },

      client: tx,
    }),
  );
}

async function queueManualOwnership(fixture: Fixture): Promise<void> {
  await prisma.$transaction(async (tx: TransactionClient) => {
    const loaded = await loadTreasuryExecutionWithClient({
      executionId: fixture.executionId,

      client: tx,
    });

    assert(loaded);

    const context = {
      commandId: `command-manual-queued-${fixture.fixtureId}`,

      actorId: `actor-manual-queued-${fixture.fixtureId}`,

      correlationId: `correlation-${fixture.fixtureId}`,

      requestedAt: new Date(),

      idempotencyKey: `manual-queued-${fixture.fixtureId}`,
    };

    const result = acknowledgeTreasuryExecutionQueued(
      loaded.aggregate,

      {
        context,

        payload: {
          executionId: fixture.executionId,

          handoffId: `manual-handoff-${fixture.fixtureId}`,

          adapterKind:
            TREASURY_EXECUTION_ADAPTER_KIND.MANUAL_TREASURY_OPERATION,

          settlementEndpointId: fixture.settlementEndpointId,

          treasuryActionId: `manual-action-${fixture.fixtureId}`,

          treasuryQueueJobId: `manual-queue-${fixture.fixtureId}`,
        },
      },
    );

    await persistTreasuryExecutionTransitionWithClient({
      expectedVersion: loaded.aggregate.metadata.version,

      result,

      eventId: `event-manual-queued-${fixture.fixtureId}`,

      context,

      client: tx,
    });
  });
}

async function writeLedgerEvidence(
  treasuryActionId: string,
  walletFixture: WalletFixture,
): Promise<void> {
  const action = await prisma.treasuryAction.findUniqueOrThrow({
    where: {
      id: treasuryActionId,
    },
  });

  await prisma.transaction.create({
    data: {
      userId: walletFixture.senderUserId,

      walletId: walletFixture.senderWalletId,

      type: "DEBIT",

      amount: 25.5,

      amountBaseUnits: action.amountBaseUnits,

      assetCode: action.assetCode,

      idempotencyKey: action.idempotencyKey,

      metadata: {
        journalGroupId: action.idempotencyKey,

        direction: "OUT",
      },
    },
  });

  await prisma.transaction.create({
    data: {
      userId: walletFixture.receiverUserId,

      walletId: walletFixture.receiverWalletId,

      type: "CREDIT",

      amount: 25.5,

      amountBaseUnits: action.amountBaseUnits,

      assetCode: action.assetCode,

      metadata: {
        journalGroupId: action.idempotencyKey,

        direction: "IN",
      },
    },
  });
}

async function corruptDispatchOwnershipEvidence(
  fixture: Fixture,
): Promise<void> {
  const queuedEvent = await prisma.treasuryGatewayEvent.findFirstOrThrow({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

      aggregateId: fixture.executionId,

      eventType: "TREASURY_EXECUTION_QUEUED",
    },

    orderBy: {
      aggregateVersion: "desc",
    },
  });

  const payload = queuedEvent.payload;

  assert(
    typeof payload === "object" && payload !== null && !Array.isArray(payload),
  );

  await prisma.treasuryGatewayEvent.update({
    where: {
      eventId: queuedEvent.eventId,
    },

    data: {
      payload: {
        ...payload,

        adapterKind: "CORRUPT_ADAPTER",
      },
    },
  });
}

async function setCandidateOrder(params: {
  fixture: Fixture;

  updatedAt: Date;
}): Promise<void> {
  const { fixture, updatedAt } = params;

  await prisma.treasuryGatewayAggregate.update({
    where: {
      aggregateType_aggregateId: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

        aggregateId: fixture.executionId,
      },
    },

    data: {
      updatedAt,
    },
  });
}

async function cleanupFixture(fixture: Fixture): Promise<void> {
  const actions = await prisma.treasuryAction.findMany({
    where: {
      metadata: {
        path: ["gatewayExecutionId"],

        equals: fixture.executionId,
      },
    },

    select: {
      id: true,
    },
  });

  const actionIds = actions.map(
    (action: TreasuryActionFixtureRow) => action.id,
  );

  await prisma.transaction.deleteMany({
    where: {
      walletId: {
        in: [
          fixture.walletFixture.senderWalletId,
          fixture.walletFixture.receiverWalletId,
        ],
      },
    },
  });

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

      aggregateId: fixture.executionId,
    },
  });

  await prisma.treasuryGatewayAggregate.deleteMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

      aggregateId: fixture.executionId,
    },
  });

  const userIds = [
    fixture.walletFixture.operatorUserId,
    fixture.walletFixture.senderUserId,
    fixture.walletFixture.receiverUserId,
  ];

  await prisma.balance.deleteMany({
    where: {
      userId: {
        in: userIds,
      },
    },
  });

  await prisma.wallet.deleteMany({
    where: {
      userId: {
        in: userIds,
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      id: {
        in: userIds,
      },
    },
  });
}

async function main(): Promise<void> {
  const failing = await createFixture("batch-failing");

  const noChange = await createFixture("batch-no-change");

  const catchup = await createFixture("batch-catchup");

  const fixtures = [failing, noChange, catchup] as const;

  try {
    for (const fixture of fixtures) {
      await createAuthorizedExecution(fixture);
    }

    await queueManualOwnership(failing);

    await corruptDispatchOwnershipEvidence(failing);

    const noChangeDispatch = await dispatchInternalWallet(noChange);

    assert.equal(
      noChangeDispatch.gateway.aggregate.status,
      TREASURY_EXECUTION_STATUS.QUEUED,
    );

    const catchupDispatch = await dispatchInternalWallet(catchup);

    await prisma.treasuryAction.update({
      where: {
        id: catchupDispatch.dispatch.treasuryActionId,
      },

      data: {
        status: TREASURY_ACTION_STATUS.EXECUTING,
      },
    });

    await writeLedgerEvidence(
      catchupDispatch.dispatch.treasuryActionId,

      catchup.walletFixture,
    );

    await setCandidateOrder({
      fixture: failing,

      updatedAt: new Date("1970-01-01T00:00:01.000Z"),
    });

    await setCandidateOrder({
      fixture: noChange,

      updatedAt: new Date("1970-01-01T00:00:02.000Z"),
    });

    await setCandidateOrder({
      fixture: catchup,

      updatedAt: new Date("1970-01-01T00:00:03.000Z"),
    });

    const result =
      await runTreasuryExecutionReconciliationBatchWithDependencies({
        limit: 3,

        context: {
          commandId: `command-batch-${randomUUID()}`,

          actorId: "actor-batch-smoke",

          correlationId: `correlation-batch-${randomUUID()}`,

          requestedAt: new Date(),

          idempotencyKey: `batch-${randomUUID()}`,
        },

        findCandidates: ({ limit }) =>
          prisma.$transaction(async (tx: TransactionClient) =>
            findTreasuryExecutionReconciliationCandidatesWithClient({
              limit,

              client: tx,
            }),
          ),

        reconcileExecution: ({
          executionId,
          initiatedEventId,
          confirmedEventId,
          context,
        }) =>
          prisma.$transaction(async (tx: TransactionClient) =>
            reconcileTreasuryExecutionByDispatchOwnershipDurablyWithClient({
              executionId,

              initiatedEventId,

              confirmedEventId,

              context,

              client: tx,
            }),
          ),
      });

    assert.equal(result.items.length, 3);

    assert.deepEqual(
      result.items.map((item) => item.executionId),

      [failing.executionId, noChange.executionId, catchup.executionId],
    );

    const [failingItem, noChangeItem, catchupItem] = result.items;

    assert(failingItem);

    assert(noChangeItem);

    assert(catchupItem);

    assert.equal(
      failingItem.status,
      TREASURY_EXECUTION_BATCH_ITEM_STATUS.FAILED,
    );

    if (failingItem.status !== TREASURY_EXECUTION_BATCH_ITEM_STATUS.FAILED) {
      throw new Error("Expected failing batch item");
    }

    assert.equal(
      failingItem.errorCode,
      "TREASURY_GATEWAY_EXECUTION_DISPATCH_ADAPTER_KIND_INVALID",
    );

    assert.equal(
      noChangeItem.status,
      TREASURY_EXECUTION_BATCH_ITEM_STATUS.RECONCILED,
    );

    if (
      noChangeItem.status !== TREASURY_EXECUTION_BATCH_ITEM_STATUS.RECONCILED
    ) {
      throw new Error("Expected no-change batch item to reconcile");
    }

    assert.equal(
      noChangeItem.result.outcome,
      TREASURY_EXECUTION_RECONCILIATION_OUTCOME.NO_CHANGE,
    );

    assert.equal(noChangeItem.result.beforeVersion, 5);

    assert.equal(noChangeItem.result.afterVersion, 5);

    assert.equal(
      catchupItem.status,
      TREASURY_EXECUTION_BATCH_ITEM_STATUS.RECONCILED,
    );

    if (
      catchupItem.status !== TREASURY_EXECUTION_BATCH_ITEM_STATUS.RECONCILED
    ) {
      throw new Error("Expected catch-up batch item to reconcile");
    }

    assert.equal(
      catchupItem.result.outcome,
      TREASURY_EXECUTION_RECONCILIATION_OUTCOME.ADVANCED_TO_INITIATED_AND_CONFIRMED,
    );

    assert.equal(catchupItem.result.beforeVersion, 5);

    assert.equal(catchupItem.result.afterVersion, 7);

    assert.equal(
      catchupItem.result.afterStatus,
      TREASURY_EXECUTION_STATUS.CONFIRMED,
    );

    assert.deepEqual(
      result.summary,

      {
        discovered: 3,

        processed: 3,

        reconciled: 2,

        failed: 1,

        advanced: 1,

        unchanged: 1,

        unsupported: 0,

        ownershipMissing: 0,
      },
    );

    console.log("✓ Treasury Gateway reconciliation batch smoke test passed");

    console.log({
      order: result.items.map((item) => ({
        executionId: item.executionId,

        status: item.status,

        outcome:
          item.status === TREASURY_EXECUTION_BATCH_ITEM_STATUS.RECONCILED
            ? item.result.outcome
            : item.errorCode,
      })),

      summary: result.summary,

      failureIsolation: {
        firstCandidateFailed:
          failingItem.status === TREASURY_EXECUTION_BATCH_ITEM_STATUS.FAILED,

        secondCandidateProcessed:
          noChangeItem.status ===
          TREASURY_EXECUTION_BATCH_ITEM_STATUS.RECONCILED,

        thirdCandidateAdvanced:
          catchupItem.status ===
            TREASURY_EXECUTION_BATCH_ITEM_STATUS.RECONCILED &&
          catchupItem.result.afterStatus ===
            TREASURY_EXECUTION_STATUS.CONFIRMED,
      },
    });
  } finally {
    for (const fixture of fixtures) {
      await cleanupFixture(fixture);
    }
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
