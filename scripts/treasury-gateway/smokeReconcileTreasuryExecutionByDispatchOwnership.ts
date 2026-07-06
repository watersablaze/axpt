import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { createTreasuryExecution } from "../../src/domains/treasury/gateway/executions/createTreasuryExecution";

import { persistNewTreasuryExecutionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/persistNewTreasuryExecutionWithClient";

import { beginTreasuryExecutionValidationDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/beginTreasuryExecutionValidationDurablyWithClient";

import { markTreasuryExecutionReadyForAuthorizationDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/markTreasuryExecutionReadyForAuthorizationDurablyWithClient";

import { authorizeTreasuryExecutionDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/authorizeTreasuryExecutionDurablyWithClient";

import { dispatchAuthorizedInternalWalletExecutionDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/dispatchAuthorizedInternalWalletExecutionDurablyWithClient";

import { reconcileTreasuryExecutionByDispatchOwnershipDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/reconcileTreasuryExecutionByDispatchOwnershipDurablyWithClient";

import { TREASURY_EXECUTION_RECONCILIATION_OUTCOME } from "../../src/domains/treasury/gateway/executions/application/reconcileTreasuryExecutionByDispatchOwnershipContracts";

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

function createReconciliationContext(fixtureId: string) {
  return {
    commandId: `command-reconcile-${fixtureId}`,

    actorId: `actor-reconcile-${fixtureId}`,

    correlationId: `correlation-${fixtureId}`,

    requestedAt: new Date(),

    idempotencyKey: `reconcile-${fixtureId}`,
  };
}

async function reconcile(fixture: Fixture) {
  return prisma.$transaction(async (tx: TransactionClient) =>
    reconcileTreasuryExecutionByDispatchOwnershipDurablyWithClient({
      executionId: fixture.executionId,

      initiatedEventId: `event-initiated-${fixture.fixtureId}`,

      confirmedEventId: `event-confirmed-${fixture.fixtureId}`,

      context: createReconciliationContext(fixture.fixtureId),

      client: tx,
    }),
  );
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
  const noOwnership = await createFixture("no-ownership");

  const unsupported = await createFixture("unsupported");

  const noChange = await createFixture("no-change");

  const catchup = await createFixture("catchup");

  const fixtures = [noOwnership, unsupported, noChange, catchup] as const;

  try {
    for (const fixture of fixtures) {
      await createAuthorizedExecution(fixture);
    }

    const missingOwnershipResult = await reconcile(noOwnership);

    assert.equal(
      missingOwnershipResult.outcome,
      TREASURY_EXECUTION_RECONCILIATION_OUTCOME.OWNERSHIP_NOT_FOUND,
    );

    assert.equal(
      missingOwnershipResult.beforeStatus,
      TREASURY_EXECUTION_STATUS.AUTHORIZED,
    );

    assert.equal(
      missingOwnershipResult.afterStatus,
      TREASURY_EXECUTION_STATUS.AUTHORIZED,
    );

    assert.equal(missingOwnershipResult.beforeVersion, 4);

    assert.equal(missingOwnershipResult.afterVersion, 4);

    assert.equal(missingOwnershipResult.ownership, null);

    assert.equal(missingOwnershipResult.internalWallet, null);

    await queueManualOwnership(unsupported);

    const unsupportedResult = await reconcile(unsupported);

    assert.equal(
      unsupportedResult.outcome,
      TREASURY_EXECUTION_RECONCILIATION_OUTCOME.ADAPTER_NOT_IMPLEMENTED,
    );

    assert.equal(
      unsupportedResult.adapterKind,
      TREASURY_EXECUTION_ADAPTER_KIND.MANUAL_TREASURY_OPERATION,
    );

    assert.equal(
      unsupportedResult.beforeStatus,
      TREASURY_EXECUTION_STATUS.QUEUED,
    );

    assert.equal(
      unsupportedResult.afterStatus,
      TREASURY_EXECUTION_STATUS.QUEUED,
    );

    assert.equal(unsupportedResult.beforeVersion, 5);

    assert.equal(unsupportedResult.afterVersion, 5);

    assert(unsupportedResult.ownership);

    assert.equal(unsupportedResult.internalWallet, null);

    const noChangeDispatch = await dispatchInternalWallet(noChange);

    const noChangeResult = await reconcile(noChange);

    assert.equal(
      noChangeResult.outcome,
      TREASURY_EXECUTION_RECONCILIATION_OUTCOME.NO_CHANGE,
    );

    assert.equal(
      noChangeResult.adapterKind,
      TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET,
    );

    assert.equal(noChangeResult.beforeStatus, TREASURY_EXECUTION_STATUS.QUEUED);

    assert.equal(noChangeResult.afterStatus, TREASURY_EXECUTION_STATUS.QUEUED);

    assert.equal(noChangeResult.beforeVersion, 5);

    assert.equal(noChangeResult.afterVersion, 5);

    assert.equal(
      noChangeResult.ownership?.treasuryActionId,
      noChangeDispatch.dispatch.treasuryActionId,
    );

    assert(noChangeResult.internalWallet);

    assert.equal(noChangeResult.internalWallet.initiated, null);

    assert.equal(noChangeResult.internalWallet.confirmed, null);

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

    const catchupResult = await reconcile(catchup);

    assert.equal(
      catchupResult.outcome,
      TREASURY_EXECUTION_RECONCILIATION_OUTCOME.ADVANCED_TO_INITIATED_AND_CONFIRMED,
    );

    assert.equal(
      catchupResult.adapterKind,
      TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET,
    );

    assert.equal(catchupResult.beforeStatus, TREASURY_EXECUTION_STATUS.QUEUED);

    assert.equal(
      catchupResult.afterStatus,
      TREASURY_EXECUTION_STATUS.CONFIRMED,
    );

    assert.equal(catchupResult.beforeVersion, 5);

    assert.equal(catchupResult.afterVersion, 7);

    assert(catchupResult.internalWallet?.initiated);

    assert(catchupResult.internalWallet?.confirmed);

    console.log(
      "✓ Treasury Gateway dispatch-ownership reconciliation smoke test passed",
    );

    console.log({
      noOwnership: missingOwnershipResult.outcome,

      unsupported: {
        outcome: unsupportedResult.outcome,

        adapterKind: unsupportedResult.adapterKind,

        version: unsupportedResult.afterVersion,
      },

      noChange: {
        outcome: noChangeResult.outcome,

        adapterKind: noChangeResult.adapterKind,

        version: noChangeResult.afterVersion,
      },

      catchup: {
        outcome: catchupResult.outcome,

        adapterKind: catchupResult.adapterKind,

        beforeVersion: catchupResult.beforeVersion,

        afterVersion: catchupResult.afterVersion,

        finalStatus: catchupResult.afterStatus,
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
