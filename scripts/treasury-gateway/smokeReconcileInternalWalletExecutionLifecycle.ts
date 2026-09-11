import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import {
  cleanupGovernedTreasuryExecutionFixture,
  type GovernedTreasuryExecutionFixtureIdentity,
} from "./support/cleanupGovernedTreasuryExecutionFixture";
import { establishGovernedAuthorizedTreasuryExecutionFixture } from "./support/establishGovernedAuthorizedTreasuryExecutionFixture";

import { loadTreasuryAllocationWithClient } from "../../src/domains/treasury/gateway/allocations/persistence/loadTreasuryAllocationWithClient";

import { TREASURY_ALLOCATION_STATUS } from "../../src/domains/treasury/gateway/allocations/status";

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
}) {
  const { fixtureId, executionId, settlementEndpointId } = params;

  return prisma.$transaction(async (tx: TransactionClient) =>
    establishGovernedAuthorizedTreasuryExecutionFixture({
      fixtureId,
      executionId,
      settlementEndpointId,
      amount: "25.50",
      currency: "USD",
      purpose: "Internal-wallet lifecycle reconciliation smoke test",
      client: tx,
    }),
  );
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

      allocationConsumedEventId: `event-allocation-consumed-${suffix}-${fixtureId}`,

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

async function loadAllocation(allocationId: string) {
  return prisma.$transaction(async (tx: TransactionClient) =>
    loadTreasuryAllocationWithClient({
      allocationId,
      client: tx,
    }),
  );
}

async function loadAllocationConsumptionEvents(allocationId: string) {
  return prisma.treasuryGatewayEvent.findMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,
      aggregateId: allocationId,
      eventType: TREASURY_EVENT_TYPE.TREASURY_ALLOCATION_CONSUMED,
    },
    orderBy: {
      aggregateVersion: "asc",
    },
    select: {
      aggregateVersion: true,
      eventType: true,
      payload: true,
    },
  });
}

async function cleanupFixture(params: {
  executionId: string;

  walletFixture: WalletFixture;

  governedFixture: GovernedTreasuryExecutionFixtureIdentity | undefined;
}): Promise<void> {
  const { executionId, walletFixture, governedFixture } = params;

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

  if (governedFixture) {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await cleanupGovernedTreasuryExecutionFixture({
        fixture: governedFixture,
        client: tx,
      });
    });
  }

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

  let stagedGoverned: GovernedTreasuryExecutionFixtureIdentity | undefined;

  let catchupGoverned: GovernedTreasuryExecutionFixtureIdentity | undefined;

  try {
    const establishedStagedGoverned = await createAuthorizedExecution({
      fixtureId: stagedFixtureId,

      executionId: stagedExecutionId,

      settlementEndpointId: stagedEndpointId,
    });

    stagedGoverned = establishedStagedGoverned;

    const stagedAllocationBeforeSettlement = await loadAllocation(
      establishedStagedGoverned.allocationId,
    );

    assert(stagedAllocationBeforeSettlement);

    assert.equal(
      stagedAllocationBeforeSettlement.aggregate.status,
      TREASURY_ALLOCATION_STATUS.ACTIVE,
    );

    assert.equal(
      stagedAllocationBeforeSettlement.aggregate.consumedAmount.amount,
      "0",
    );

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

    const stagedAllocationAfterSettlement = await loadAllocation(
      establishedStagedGoverned.allocationId,
    );

    assert(stagedAllocationAfterSettlement);

    assert.equal(
      stagedAllocationAfterSettlement.aggregate.status,
      TREASURY_ALLOCATION_STATUS.CONSUMED,
    );

    assert.equal(
      stagedAllocationAfterSettlement.aggregate.consumedAmount.amount,
      "25.5",
    );

    const consumptionEventsAfterSettlement =
      await loadAllocationConsumptionEvents(
        establishedStagedGoverned.allocationId,
      );

    assert.equal(consumptionEventsAfterSettlement.length, 1);

    const consumptionPayload = consumptionEventsAfterSettlement[0]?.payload;

    assert(
      consumptionPayload &&
        typeof consumptionPayload === "object" &&
        !Array.isArray(consumptionPayload),
    );

    assert.equal(consumptionPayload.consumingSubjectType, "TREASURY_EXECUTION");

    assert.equal(consumptionPayload.consumingSubjectId, stagedExecutionId);

    assert.deepEqual(consumptionPayload.consumedAmount, {
      amount: "25.50",
      currency: "USD",
    });

    const repeat = await reconcile({
      fixtureId: stagedFixtureId,

      executionId: stagedExecutionId,

      suffix: "repeat",
    });

    assert.equal(repeat.aggregate.status, TREASURY_EXECUTION_STATUS.CONFIRMED);

    assert.equal(repeat.aggregate.metadata.version, 7);

    assert.equal(repeat.initiated, null);

    assert.equal(repeat.confirmed, null);

    const stagedAllocationAfterRetry = await loadAllocation(
      establishedStagedGoverned.allocationId,
    );

    assert(stagedAllocationAfterRetry);

    assert.equal(
      stagedAllocationAfterRetry.aggregate.status,
      TREASURY_ALLOCATION_STATUS.CONSUMED,
    );

    assert.equal(
      stagedAllocationAfterRetry.aggregate.consumedAmount.amount,
      "25.5",
    );

    const consumptionEventsAfterRetry = await loadAllocationConsumptionEvents(
      establishedStagedGoverned.allocationId,
    );

    assert.equal(consumptionEventsAfterRetry.length, 1);

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

    catchupGoverned = await createAuthorizedExecution({
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

        allocationStatus: stagedAllocationAfterRetry.aggregate.status,

        allocationConsumedAmount:
          stagedAllocationAfterRetry.aggregate.consumedAmount.amount,

        allocationConsumptionEventCount: consumptionEventsAfterRetry.length,

        allocationConsumptionAttributedToExecution:
          consumptionPayload.consumingSubjectType === "TREASURY_EXECUTION" &&
          consumptionPayload.consumingSubjectId === stagedExecutionId,

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

      governedFixture: stagedGoverned,
    });

    await cleanupFixture({
      executionId: catchupExecutionId,

      walletFixture: catchupWalletFixture,

      governedFixture: catchupGoverned,
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
