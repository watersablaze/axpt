import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_ACTION_STATUS } from "../../src/domains/treasury/stateMachine";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";
import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { TREASURY_ALLOCATION_STATUS } from "../../src/domains/treasury/gateway/allocations/status";
import { loadTreasuryAllocationWithClient } from "../../src/domains/treasury/gateway/allocations/persistence/loadTreasuryAllocationWithClient";

import { TREASURY_EXECUTION_STATUS } from "../../src/domains/treasury/gateway/executions/status";
import { TREASURY_EXECUTION_ADAPTER_KIND } from "../../src/domains/treasury/gateway/executions/routing/contracts";
import { dispatchAuthorizedInternalWalletExecutionDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/dispatchAuthorizedInternalWalletExecutionDurablyWithClient";
import { reconcileInternalWalletExecutionDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/reconcileInternalWalletExecutionDurablyWithClient";
import { confirmTreasuryExecutionWithAllocationSettlementDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/confirmTreasuryExecutionWithAllocationSettlementDurablyWithClient";
import { loadTreasuryExecutionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/loadTreasuryExecutionWithClient";

import { establishGovernedAuthorizedTreasuryExecutionFixture } from "./support/establishGovernedAuthorizedTreasuryExecutionFixture";
import {
  cleanupGovernedTreasuryExecutionFixture,
  type GovernedTreasuryExecutionFixtureIdentity,
} from "./support/cleanupGovernedTreasuryExecutionFixture";

const prisma = new PrismaClient();

type TreasuryActionFixtureRow = Readonly<{
  id: string;
}>;

type WalletFixture = Readonly<{
  operatorUserId: string;
  senderUserId: string;
  receiverUserId: string;
  senderWalletId: string;
  receiverWalletId: string;
}>;

type EstablishedFixture = Awaited<
  ReturnType<typeof establishGovernedAuthorizedTreasuryExecutionFixture>
>;

type InitiatedExecutionFixture = Readonly<{
  treasuryActionId: string;
  amountBaseUnits: string;
}>;

async function createWalletFixture(
  fixtureId: string,
  label: string,
): Promise<WalletFixture> {
  const operator = await prisma.user.create({
    data: {
      username: `oversubscription-${label}-operator-${fixtureId}`,
      email: `oversubscription-${label}-operator-${fixtureId}@example.invalid`,
      passwordHash: "SMOKE_TEST_ONLY",
    },
  });

  const sender = await prisma.user.create({
    data: {
      username: `oversubscription-${label}-sender-${fixtureId}`,
      email: `oversubscription-${label}-sender-${fixtureId}@example.invalid`,
      passwordHash: "SMOKE_TEST_ONLY",
    },
  });

  const receiver = await prisma.user.create({
    data: {
      username: `oversubscription-${label}-receiver-${fixtureId}`,
      email: `oversubscription-${label}-receiver-${fixtureId}@example.invalid`,
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

async function advanceExecutionToInitiated(params: {
  fixtureId: string;
  label: string;
  executionId: string;
  settlementEndpointId: string;
  walletFixture: WalletFixture;
}): Promise<InitiatedExecutionFixture> {
  const { fixtureId, label, executionId, settlementEndpointId, walletFixture } =
    params;

  const dispatch = await prisma.$transaction(async (tx: TransactionClient) =>
    dispatchAuthorizedInternalWalletExecutionDurablyWithClient({
      executionId,

      handoffId: `handoff-oversubscription-${label}-${fixtureId}`,

      capability: {
        kind: TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET,
        settlementEndpointId,
        operationalInitiatorUserId: walletFixture.operatorUserId,
        fromUserId: walletFixture.senderUserId,
        toUserId: walletFixture.receiverUserId,
        assetCode: "USD",
      },

      dispatchContext: {
        commandId: `command-dispatch-oversubscription-${label}-${fixtureId}`,
        actorId: `actor-oversubscription-${label}-${fixtureId}`,
        correlationId: `correlation-oversubscription-${label}-${fixtureId}`,
        requestedAt: new Date(),
        idempotencyKey: `dispatch-oversubscription-${label}-${fixtureId}`,
      },

      acknowledgementEventId: `event-queued-oversubscription-${label}-${fixtureId}`,

      acknowledgementContext: {
        commandId: `command-queued-oversubscription-${label}-${fixtureId}`,
        actorId: `actor-oversubscription-${label}-${fixtureId}`,
        correlationId: `correlation-oversubscription-${label}-${fixtureId}`,
        requestedAt: new Date(),
        idempotencyKey: `acknowledgement-oversubscription-${label}-${fixtureId}`,
      },

      client: tx,
    }),
  );

  assert.equal(
    dispatch.gateway.aggregate.status,
    TREASURY_EXECUTION_STATUS.QUEUED,
  );
  assert.equal(dispatch.gateway.aggregate.metadata.version, 5);

  await prisma.treasuryAction.update({
    where: {
      id: dispatch.dispatch.treasuryActionId,
    },
    data: {
      status: TREASURY_ACTION_STATUS.EXECUTING,
    },
  });

  const initiated = await prisma.$transaction(async (tx: TransactionClient) =>
    reconcileInternalWalletExecutionDurablyWithClient({
      executionId,

      initiatedEventId: `event-initiated-oversubscription-${label}-${fixtureId}`,
      allocationConsumedEventId: `event-unused-allocation-consumed-oversubscription-${label}-${fixtureId}`,
      confirmedEventId: `event-unused-confirmed-oversubscription-${label}-${fixtureId}`,

      context: {
        commandId: `command-initiate-oversubscription-${label}-${fixtureId}`,
        actorId: `actor-oversubscription-${label}-${fixtureId}`,
        correlationId: `correlation-oversubscription-${label}-${fixtureId}`,
        requestedAt: new Date(),
        idempotencyKey: `initiate-oversubscription-${label}-${fixtureId}`,
      },

      client: tx,
    }),
  );

  assert.equal(initiated.aggregate.status, TREASURY_EXECUTION_STATUS.INITIATED);
  assert.equal(initiated.aggregate.metadata.version, 6);
  assert(initiated.initiated);
  assert.equal(initiated.confirmed, null);

  const persistedAction = await prisma.treasuryAction.findUniqueOrThrow({
    where: {
      id: dispatch.dispatch.treasuryActionId,
    },
  });

  return {
    treasuryActionId: dispatch.dispatch.treasuryActionId,
    amountBaseUnits: persistedAction.amountBaseUnits.toString(),
  };
}

async function settleExecution(params: {
  fixtureId: string;

  label: string;

  executionId: string;

  initiated: InitiatedExecutionFixture;
}): Promise<void> {
  const { fixtureId, label, executionId } = params;

  await prisma.$transaction(async (tx: TransactionClient) => {
    const loadedExecution = await loadTreasuryExecutionWithClient({
      executionId,

      client: tx,
    });

    if (!loadedExecution) {
      throw new Error(
        `[TREASURY_GATEWAY_EXECUTION_NOT_FOUND] ${executionId}`,
      );
    }

    await confirmTreasuryExecutionWithAllocationSettlementDurablyWithClient({
      settlement: {
        executionId,

        amount: loadedExecution.aggregate.amount,

        verifiedAt: new Date(),
      },

      allocationConsumedEventId:
        `event-allocation-consumed-oversubscription-${label}-${fixtureId}`,

      confirmedEventId:
        `event-confirmed-oversubscription-${label}-${fixtureId}`,

      context: {
        commandId:
          `command-confirm-oversubscription-${label}-${fixtureId}`,

        actorId:
          `actor-oversubscription-${label}-${fixtureId}`,

        correlationId:
          `correlation-oversubscription-${label}-${fixtureId}`,

        requestedAt: new Date(),

        idempotencyKey:
          `confirm-oversubscription-${label}-${fixtureId}`,
      },

      client: tx,
    });
  });
}

function toGovernedIdentity(
  fixture: EstablishedFixture,
): GovernedTreasuryExecutionFixtureIdentity {
  return {
    executionId: fixture.executionId,
    transferId: fixture.transferId,
    authorityAssessmentId: fixture.authorityAssessmentId,
    capacityAssessmentId: fixture.capacityAssessmentId,
    eligibilityAssessmentId: fixture.eligibilityAssessmentId,
    planId: fixture.planId,
    allocationId: fixture.allocationId,
  };
}

async function cleanupRailFixture(params: {
  executionId: string;
  walletFixture: WalletFixture | null;
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
    },
  });

  const actionIds = actions.map(
    (action: TreasuryActionFixtureRow) => action.id,
  );

  if (walletFixture) {
    await prisma.transaction.deleteMany({
      where: {
        walletId: {
          in: [walletFixture.senderWalletId, walletFixture.receiverWalletId],
        },
      },
    });
  }

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

  if (walletFixture) {
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
}

async function cleanupSharedGovernedFixture(params: {
  fixture: GovernedTreasuryExecutionFixtureIdentity;
  client: TransactionClient;
}): Promise<void> {
  const { fixture, client } = params;

  /*
   * This lineage references an Allocation owned by another fixture.
   * Delete only the ancestry this lineage actually owns.
   */
  const aggregates = [
    {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,
      aggregateId: fixture.executionId,
    },
    {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION_PLAN,
      aggregateId: fixture.planId,
    },
    {
      aggregateType:
        TREASURY_AGGREGATE_TYPE.EXECUTABLE_TRANCHE_ELIGIBILITY_ASSESSMENT,
      aggregateId: fixture.eligibilityAssessmentId,
    },
    {
      aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_CAPACITY_ASSESSMENT,
      aggregateId: fixture.capacityAssessmentId,
    },
    {
      aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,
      aggregateId: fixture.authorityAssessmentId,
    },
    {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,
      aggregateId: fixture.transferId,
    },
  ] as const;

  for (const aggregate of aggregates) {
    await client.treasuryGatewayEvent.deleteMany({
      where: aggregate,
    });
  }

  for (const aggregate of aggregates) {
    await client.treasuryGatewayAggregate.deleteMany({
      where: aggregate,
    });
  }
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const executionAId = `execution-oversubscription-a-${fixtureId}`;
  const executionBId = `execution-oversubscription-b-${fixtureId}`;

  const settlementEndpointAId = `endpoint-oversubscription-a-${fixtureId}`;
  const settlementEndpointBId = `endpoint-oversubscription-b-${fixtureId}`;

  let governedA: GovernedTreasuryExecutionFixtureIdentity | undefined;

  let governedB: GovernedTreasuryExecutionFixtureIdentity | undefined;

  let walletA: WalletFixture | null = null;
  let walletB: WalletFixture | null = null;

  try {
    walletA = await createWalletFixture(fixtureId, "a");
    walletB = await createWalletFixture(fixtureId, "b");

    /*
     * A owns the Allocation.
     */
    const establishedA = await prisma.$transaction(
      async (tx: TransactionClient) =>
        establishGovernedAuthorizedTreasuryExecutionFixture({
          fixtureId: `oversubscription-a-${fixtureId}`,
          executionId: executionAId,
          settlementEndpointId: settlementEndpointAId,
          amount: "25.50",
          currency: "USD",
          purpose: "EP-3B oversubscription proof — Execution A",
          client: tx,
        }),
    );

    governedA = toGovernedIdentity(establishedA);

    /*
     * B has independent Transfer/Plan/Tranche/Execution ancestry but
     * deliberately references A's already-active Allocation.
     *
     * Because A has not settled yet, B must pass the canonical EP-3A
     * authority assertion during instantiation.
     */
    const establishedB = await prisma.$transaction(
      async (tx: TransactionClient) =>
        establishGovernedAuthorizedTreasuryExecutionFixture({
          fixtureId: `oversubscription-b-${fixtureId}`,
          executionId: executionBId,
          settlementEndpointId: settlementEndpointBId,
          amount: "25.50",
          currency: "USD",
          purpose: "EP-3B oversubscription proof — Execution B",
          sharedAllocation: {
            allocationId: establishedA.allocationId,
            programId: establishedA.programId,
            sourceProgramAccountId: establishedA.sourceProgramAccountId,
          },
          client: tx,
        }),
    );

    governedB = toGovernedIdentity(establishedB);

    assert.equal(
      establishedA.execution.status,
      TREASURY_EXECUTION_STATUS.AUTHORIZED,
    );
    assert.equal(
      establishedB.execution.status,
      TREASURY_EXECUTION_STATUS.AUTHORIZED,
    );

    assert.equal(establishedA.allocationId, establishedB.allocationId);

    const allocationBeforeSettlement = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryAllocationWithClient({
          allocationId: establishedA.allocationId,
          client: tx,
        }),
    );

    assert(allocationBeforeSettlement);
    assert.equal(
      allocationBeforeSettlement.aggregate.status,
      TREASURY_ALLOCATION_STATUS.ACTIVE,
    );
    assert.equal(
      allocationBeforeSettlement.aggregate.consumedAmount.amount,
      "0",
    );

    /*
     * Both executions legitimately existed before Allocation utilization.
     */
    const initiatedA = await advanceExecutionToInitiated({
      fixtureId,
      label: "a",
      executionId: executionAId,
      settlementEndpointId: settlementEndpointAId,
      walletFixture: walletA,
    });

    const initiatedB = await advanceExecutionToInitiated({
      fixtureId,
      label: "b",
      executionId: executionBId,
      settlementEndpointId: settlementEndpointBId,
      walletFixture: walletB,
    });

    const executionBBeforeRejectedSettlement = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryExecutionWithClient({
          executionId: executionBId,
          client: tx,
        }),
    );

    assert(executionBBeforeRejectedSettlement);
    assert.equal(
      executionBBeforeRejectedSettlement.aggregate.status,
      TREASURY_EXECUTION_STATUS.INITIATED,
    );

    const executionBBeforeVersion =
      executionBBeforeRejectedSettlement.aggregate.metadata.version;

    /*
     * A wins settlement against current Allocation truth.
     */
    await settleExecution({
      fixtureId,
      label: "a",
      executionId: executionAId,
      initiated: initiatedA,
    });

    const allocationAfterA = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryAllocationWithClient({
          allocationId: establishedA.allocationId,
          client: tx,
        }),
    );

    const executionAAfter = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryExecutionWithClient({
          executionId: executionAId,
          client: tx,
        }),
    );

    assert(allocationAfterA);
    assert(executionAAfter);

    assert.equal(
      allocationAfterA.aggregate.status,
      TREASURY_ALLOCATION_STATUS.CONSUMED,
    );
    assert.equal(allocationAfterA.aggregate.consumedAmount.amount, "25.5");
    assert.equal(
      executionAAfter.aggregate.status,
      TREASURY_EXECUTION_STATUS.CONFIRMED,
    );

    const allocationVersionAfterA = allocationAfterA.aggregate.metadata.version;

    /*
     * B was valid at creation time, but creation did not reserve capital.
     * Settlement must re-prove authority against the now-current Allocation.
     */
    let rejectedSettlementError: unknown;

    try {
      await settleExecution({
        fixtureId,
        label: "b",
        executionId: executionBId,
        initiated: initiatedB,
      });
    } catch (error: unknown) {
      rejectedSettlementError = error;
    }

    assert(rejectedSettlementError);

    const rejectedMessage =
      rejectedSettlementError instanceof Error
        ? rejectedSettlementError.message
        : String(rejectedSettlementError);

    assert(
      rejectedMessage.includes(
        "[TREASURY_EXECUTION_ALLOCATION_NOT_CONSUMABLE]",
      ),
      `expected current Allocation authority rejection, received: ${rejectedMessage}`,
    );

    assert(
      rejectedMessage.includes("CONSUMED"),
      `expected consumed Allocation rejection, received: ${rejectedMessage}`,
    );

    const allocationAfterB = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryAllocationWithClient({
          allocationId: establishedA.allocationId,
          client: tx,
        }),
    );

    const executionBAfter = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryExecutionWithClient({
          executionId: executionBId,
          client: tx,
        }),
    );

    assert(allocationAfterB);
    assert(executionBAfter);

    assert.equal(
      allocationAfterB.aggregate.status,
      TREASURY_ALLOCATION_STATUS.CONSUMED,
    );
    assert.equal(allocationAfterB.aggregate.consumedAmount.amount, "25.5");
    assert.equal(
      allocationAfterB.aggregate.metadata.version,
      allocationVersionAfterA,
    );

    assert.equal(
      executionBAfter.aggregate.status,
      TREASURY_EXECUTION_STATUS.INITIATED,
    );
    assert.equal(
      executionBAfter.aggregate.metadata.version,
      executionBBeforeVersion,
    );

    const consumptionEvents = await prisma.treasuryGatewayEvent.findMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,
        aggregateId: establishedA.allocationId,
        eventType: TREASURY_EVENT_TYPE.TREASURY_ALLOCATION_CONSUMED,
      },
      orderBy: {
        sequence: "asc",
      },
    });

    const executionAConfirmationEvents =
      await prisma.treasuryGatewayEvent.count({
        where: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,
          aggregateId: executionAId,
          eventType: TREASURY_EVENT_TYPE.TREASURY_EXECUTION_CONFIRMED,
        },
      });

    const executionBConfirmationEvents =
      await prisma.treasuryGatewayEvent.count({
        where: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,
          aggregateId: executionBId,
          eventType: TREASURY_EVENT_TYPE.TREASURY_EXECUTION_CONFIRMED,
        },
      });

    assert.equal(consumptionEvents.length, 1);
    assert.equal(executionAConfirmationEvents, 1);
    assert.equal(executionBConfirmationEvents, 0);

    const consumptionPayload = consumptionEvents[0]?.payload as {
      consumingSubjectType?: unknown;
      consumingSubjectId?: unknown;
    };

    assert.equal(consumptionPayload.consumingSubjectType, "TREASURY_EXECUTION");
    assert.equal(consumptionPayload.consumingSubjectId, executionAId);

    console.log(
      "✓ Treasury Gateway Allocation oversubscription settlement smoke test passed",
    );

    console.log({
      creation: {
        executionAAuthorized: true,
        executionBAuthorized: true,
        sharedAllocation: true,
        allocationInitiallyUnconsumed: true,
      },
      winner: {
        executionId: executionAId,
        finalStatus: executionAAfter.aggregate.status,
        allocationStatus: allocationAfterA.aggregate.status,
        consumedAmount: allocationAfterA.aggregate.consumedAmount.amount,
      },
      rejected: {
        executionId: executionBId,
        failure: "TREASURY_EXECUTION_ALLOCATION_NOT_CONSUMABLE",
        finalStatus: executionBAfter.aggregate.status,
        versionUnchanged:
          executionBAfter.aggregate.metadata.version ===
          executionBBeforeVersion,
      },
      durableFacts: {
        allocationConsumptionEventCount: consumptionEvents.length,
        executionAConfirmationEventCount: executionAConfirmationEvents,
        executionBConfirmationEventCount: executionBConfirmationEvents,
        consumptionAttributedToExecutionA: true,
      },
    });
  } finally {
    /*
     * Rail-local records first.
     */
    await cleanupRailFixture({
      executionId: executionBId,
      walletFixture: walletB,
    });

    await cleanupRailFixture({
      executionId: executionAId,
      walletFixture: walletA,
    });

    /*
     * B references, but does not own, A's Allocation.
     */
    if (governedB) {
      await prisma.$transaction(async (tx: TransactionClient) => {
        await cleanupSharedGovernedFixture({
          fixture: governedB!,
          client: tx,
        });
      });
    }

    /*
     * A owns the shared Allocation and cleans it last.
     */
    if (governedA) {
      await prisma.$transaction(async (tx: TransactionClient) => {
        await cleanupGovernedTreasuryExecutionFixture({
          fixture: governedA!,
          client: tx,
        });
      });
    }

    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
