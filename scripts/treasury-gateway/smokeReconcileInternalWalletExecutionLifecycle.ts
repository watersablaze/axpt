import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { createTreasuryExecution } from "../../src/domains/treasury/gateway/executions/createTreasuryExecution";

import { persistNewTreasuryExecutionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/persistNewTreasuryExecutionWithClient";

import { beginTreasuryExecutionValidationDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/beginTreasuryExecutionValidationDurablyWithClient";

import { markTreasuryExecutionReadyForAuthorizationDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/markTreasuryExecutionReadyForAuthorizationDurablyWithClient";

import { authorizeTreasuryExecutionDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/authorizeTreasuryExecutionDurablyWithClient";

import { dispatchAuthorizedInternalWalletExecutionDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/dispatchAuthorizedInternalWalletExecutionDurablyWithClient";

import { reconcileInternalWalletExecutionDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/reconcileInternalWalletExecutionDurablyWithClient";

import { loadTreasuryExecutionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/loadTreasuryExecutionWithClient";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

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

type TreasuryActionFixtureRow = Readonly<{
  id: string;
}>;

type GatewayEventFixtureRow = Readonly<{
  aggregateVersion: number;

  eventType: string;
}>;

async function createWalletFixture(fixtureId: string): Promise<WalletFixture> {
  const operator = await prisma.user.create({
    data: {
      username: `gateway-reconcile-operator-${fixtureId}`,

      email: `gateway-reconcile-operator-${fixtureId}@example.invalid`,

      passwordHash: "SMOKE_TEST_ONLY",
    },
  });

  const sender = await prisma.user.create({
    data: {
      username: `gateway-reconcile-sender-${fixtureId}`,

      email: `gateway-reconcile-sender-${fixtureId}@example.invalid`,

      passwordHash: "SMOKE_TEST_ONLY",
    },
  });

  const receiver = await prisma.user.create({
    data: {
      username: `gateway-reconcile-receiver-${fixtureId}`,

      email: `gateway-reconcile-receiver-${fixtureId}@example.invalid`,

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

        purpose: "Internal-wallet lifecycle reconciliation smoke test",
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

async function dispatchExecution(params: {
  fixtureId: string;

  executionId: string;

  settlementEndpointId: string;

  walletFixture: WalletFixture;
}) {
  const { fixtureId, executionId, settlementEndpointId, walletFixture } =
    params;

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

async function writeLedgerEvidence(params: {
  treasuryActionId: string;

  walletFixture: WalletFixture;
}): Promise<{
  debitTransactionId: string;

  creditTransactionId: string;
}> {
  const { treasuryActionId, walletFixture } = params;

  const action = await prisma.treasuryAction.findUniqueOrThrow({
    where: {
      id: treasuryActionId,
    },
  });

  const debit = await prisma.transaction.create({
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

  const credit = await prisma.transaction.create({
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

  return {
    debitTransactionId: debit.id,

    creditTransactionId: credit.id,
  };
}

function createReconciliationContext(fixtureId: string, suffix: string) {
  return {
    commandId: `command-reconcile-${suffix}-${fixtureId}`,

    actorId: `actor-reconcile-${fixtureId}`,

    correlationId: `correlation-${fixtureId}`,

    requestedAt: new Date(),

    idempotencyKey: `reconcile-${suffix}-${fixtureId}`,
  };
}

async function reconcile(params: {
  fixtureId: string;

  executionId: string;

  suffix: string;
}) {
  const { fixtureId, executionId, suffix } = params;

  return prisma.$transaction(async (tx: TransactionClient) =>
    reconcileInternalWalletExecutionDurablyWithClient({
      executionId,

      initiatedEventId: `event-initiated-${suffix}-${fixtureId}`,

      confirmedEventId: `event-confirmed-${suffix}-${fixtureId}`,

      context: createReconciliationContext(fixtureId, suffix),

      client: tx,
    }),
  );
}

async function loadEvents(executionId: string) {
  return prisma.treasuryGatewayEvent.findMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

      aggregateId: executionId,
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

async function cleanupFixture(params: {
  executionId: string;

  walletFixture: WalletFixture;
}): Promise<void> {
  const { executionId, walletFixture } = params;

  const actions = await prisma.treasuryAction.findMany({
    where: {
      metadata: {
        path: ["gatewayExecutionId"],

        equals: executionId,
      },
    },

    select: {
      id: true,

      idempotencyKey: true,
    },
  });

  const actionIds = actions.map(
    (action: TreasuryActionFixtureRow) => action.id,
  );

  await prisma.transaction.deleteMany({
    where: {
      walletId: {
        in: [walletFixture.senderWalletId, walletFixture.receiverWalletId],
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

      aggregateId: executionId,
    },
  });

  await prisma.treasuryGatewayAggregate.deleteMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

      aggregateId: executionId,
    },
  });

  const userIds = [
    walletFixture.operatorUserId,
    walletFixture.senderUserId,
    walletFixture.receiverUserId,
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
  const stagedFixtureId = `staged-${randomUUID()}`;

  const stagedExecutionId = `smoke-reconcile-${stagedFixtureId}`;

  const stagedEndpointId = `endpoint-${stagedFixtureId}`;

  const catchupFixtureId = `catchup-${randomUUID()}`;

  const catchupExecutionId = `smoke-reconcile-${catchupFixtureId}`;

  const catchupEndpointId = `endpoint-${catchupFixtureId}`;

  const stagedWalletFixture = await createWalletFixture(stagedFixtureId);

  const catchupWalletFixture = await createWalletFixture(catchupFixtureId);

  try {
    await createAuthorizedExecution({
      fixtureId: stagedFixtureId,

      executionId: stagedExecutionId,

      settlementEndpointId: stagedEndpointId,
    });

    const stagedDispatch = await dispatchExecution({
      fixtureId: stagedFixtureId,

      executionId: stagedExecutionId,

      settlementEndpointId: stagedEndpointId,

      walletFixture: stagedWalletFixture,
    });

    assert.equal(
      stagedDispatch.gateway.aggregate.status,
      TREASURY_EXECUTION_STATUS.QUEUED,
    );

    assert.equal(stagedDispatch.gateway.aggregate.metadata.version, 5);

    const noEvidence = await reconcile({
      fixtureId: stagedFixtureId,

      executionId: stagedExecutionId,

      suffix: "no-evidence",
    });

    assert.equal(noEvidence.aggregate.status, TREASURY_EXECUTION_STATUS.QUEUED);

    assert.equal(noEvidence.aggregate.metadata.version, 5);

    assert.equal(noEvidence.initiated, null);

    assert.equal(noEvidence.confirmed, null);

    await prisma.treasuryAction.update({
      where: {
        id: stagedDispatch.dispatch.treasuryActionId,
      },

      data: {
        status: TREASURY_ACTION_STATUS.EXECUTING,
      },
    });

    const initiatedOnly = await reconcile({
      fixtureId: stagedFixtureId,

      executionId: stagedExecutionId,

      suffix: "initiated-only",
    });

    assert.equal(
      initiatedOnly.aggregate.status,
      TREASURY_EXECUTION_STATUS.INITIATED,
    );

    assert.equal(initiatedOnly.aggregate.metadata.version, 6);

    assert(initiatedOnly.initiated);

    assert.equal(initiatedOnly.confirmed, null);

    await writeLedgerEvidence({
      treasuryActionId: stagedDispatch.dispatch.treasuryActionId,

      walletFixture: stagedWalletFixture,
    });

    const confirmed = await reconcile({
      fixtureId: stagedFixtureId,

      executionId: stagedExecutionId,

      suffix: "confirmed",
    });

    assert.equal(
      confirmed.aggregate.status,
      TREASURY_EXECUTION_STATUS.CONFIRMED,
    );

    assert.equal(confirmed.aggregate.metadata.version, 7);

    assert.equal(confirmed.initiated, null);

    assert(confirmed.confirmed);

    const repeat = await reconcile({
      fixtureId: stagedFixtureId,

      executionId: stagedExecutionId,

      suffix: "repeat",
    });

    assert.equal(repeat.aggregate.status, TREASURY_EXECUTION_STATUS.CONFIRMED);

    assert.equal(repeat.aggregate.metadata.version, 7);

    assert.equal(repeat.initiated, null);

    assert.equal(repeat.confirmed, null);

    const stagedEvents = await loadEvents(stagedExecutionId);

    assert.deepEqual(
      stagedEvents.map(
        (event: GatewayEventFixtureRow) => event.aggregateVersion,
      ),

      [1, 2, 3, 4, 5, 6, 7],
    );

    assert.equal(
      stagedEvents.filter(
        (event: GatewayEventFixtureRow) =>
          event.eventType === TREASURY_EVENT_TYPE.TREASURY_EXECUTION_INITIATED,
      ).length,
      1,
    );

    assert.equal(
      stagedEvents.filter(
        (event: GatewayEventFixtureRow) =>
          event.eventType === TREASURY_EVENT_TYPE.TREASURY_EXECUTION_CONFIRMED,
      ).length,
      1,
    );

    await createAuthorizedExecution({
      fixtureId: catchupFixtureId,

      executionId: catchupExecutionId,

      settlementEndpointId: catchupEndpointId,
    });

    const catchupDispatch = await dispatchExecution({
      fixtureId: catchupFixtureId,

      executionId: catchupExecutionId,

      settlementEndpointId: catchupEndpointId,

      walletFixture: catchupWalletFixture,
    });

    await prisma.treasuryAction.update({
      where: {
        id: catchupDispatch.dispatch.treasuryActionId,
      },

      data: {
        status: TREASURY_ACTION_STATUS.EXECUTING,
      },
    });

    const catchupLedger = await writeLedgerEvidence({
      treasuryActionId: catchupDispatch.dispatch.treasuryActionId,

      walletFixture: catchupWalletFixture,
    });

    const catchup = await reconcile({
      fixtureId: catchupFixtureId,

      executionId: catchupExecutionId,

      suffix: "catchup",
    });

    assert.equal(catchup.aggregate.status, TREASURY_EXECUTION_STATUS.CONFIRMED);

    assert.equal(catchup.aggregate.metadata.version, 7);

    assert(catchup.initiated);

    assert(catchup.confirmed);

    assert.equal(
      catchup.confirmed.event.payload.debitTransactionId,
      catchupLedger.debitTransactionId,
    );

    assert.equal(
      catchup.confirmed.event.payload.creditTransactionId,
      catchupLedger.creditTransactionId,
    );

    const catchupEvents = await loadEvents(catchupExecutionId);

    assert.deepEqual(
      catchupEvents.map(
        (event: GatewayEventFixtureRow) => event.aggregateVersion,
      ),

      [1, 2, 3, 4, 5, 6, 7],
    );

    const stagedLoaded = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryExecutionWithClient({
          executionId: stagedExecutionId,

          client: tx,
        }),
    );

    const catchupLoaded = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryExecutionWithClient({
          executionId: catchupExecutionId,

          client: tx,
        }),
    );

    assert(stagedLoaded);

    assert(catchupLoaded);

    console.log(
      "✓ Treasury Gateway internal-wallet lifecycle reconciliation smoke test passed",
    );

    console.log({
      staged: {
        finalStatus: stagedLoaded.aggregate.status,

        finalVersion: stagedLoaded.aggregate.metadata.version,

        eventVersions: stagedEvents.map(
          (event: GatewayEventFixtureRow) => event.aggregateVersion,
        ),

        initiatedEventCount: stagedEvents.filter(
          (event: GatewayEventFixtureRow) =>
            event.eventType ===
            TREASURY_EVENT_TYPE.TREASURY_EXECUTION_INITIATED,
        ).length,

        confirmedEventCount: stagedEvents.filter(
          (event: GatewayEventFixtureRow) =>
            event.eventType ===
            TREASURY_EVENT_TYPE.TREASURY_EXECUTION_CONFIRMED,
        ).length,
      },

      catchup: {
        finalStatus: catchupLoaded.aggregate.status,

        finalVersion: catchupLoaded.aggregate.metadata.version,

        eventVersions: catchupEvents.map(
          (event: GatewayEventFixtureRow) => event.aggregateVersion,
        ),

        advancedInOnePass: Boolean(catchup.initiated && catchup.confirmed),
      },
    });
  } finally {
    await cleanupFixture({
      executionId: stagedExecutionId,

      walletFixture: stagedWalletFixture,
    });

    await cleanupFixture({
      executionId: catchupExecutionId,

      walletFixture: catchupWalletFixture,
    });
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
