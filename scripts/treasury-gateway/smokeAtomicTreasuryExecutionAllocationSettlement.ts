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

import type { VerifiedTreasuryExecutionSettlement } from "../../src/domains/treasury/gateway/executions/verifiedSettlementContracts";
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

async function createWalletFixture(fixtureId: string): Promise<WalletFixture> {
  const operator = await prisma.user.create({
    data: {
      username: `atomic-settlement-operator-${fixtureId}`,

      email: `atomic-settlement-operator-${fixtureId}@example.invalid`,

      passwordHash: "SMOKE_TEST_ONLY",
    },
  });

  const sender = await prisma.user.create({
    data: {
      username: `atomic-settlement-sender-${fixtureId}`,

      email: `atomic-settlement-sender-${fixtureId}@example.invalid`,

      passwordHash: "SMOKE_TEST_ONLY",
    },
  });

  const receiver = await prisma.user.create({
    data: {
      username: `atomic-settlement-receiver-${fixtureId}`,

      email: `atomic-settlement-receiver-${fixtureId}@example.invalid`,

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

async function cleanupFixture(params: {
  executionId: string;

  walletFixture: WalletFixture | null;

  governedFixture: GovernedTreasuryExecutionFixtureIdentity | undefined;
}): Promise<void> {
  const { executionId, walletFixture, governedFixture } = params;

  /*
   * Discover rail-local operational records through the canonical
   * Treasury Gateway execution ownership marker.
   */
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

  if (governedFixture) {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await cleanupGovernedTreasuryExecutionFixture({
        fixture: governedFixture,

        client: tx,
      });
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

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const executionId = `execution-atomic-settlement-${fixtureId}`;
  const settlementEndpointId = `endpoint-atomic-settlement-${fixtureId}`;

  const conflictingConfirmedEventId = `event-confirmed-atomic-settlement-conflict-${fixtureId}`;

  const collisionSeedAggregateId = `atomic-settlement-conflict-seed-${fixtureId}`;

  let governedFixture: GovernedTreasuryExecutionFixtureIdentity | undefined;

  let walletFixture: WalletFixture | null = null;

  try {
    walletFixture = await createWalletFixture(fixtureId);

    const established = await prisma.$transaction(
      async (tx: TransactionClient) =>
        establishGovernedAuthorizedTreasuryExecutionFixture({
          fixtureId: `atomic-settlement-${fixtureId}`,
          executionId,
          settlementEndpointId,
          amount: "25.50",
          currency: "USD",
          purpose: "EP-3B atomic Allocation utilization settlement proof",
          client: tx,
        }),
    );

    governedFixture = {
      executionId: established.executionId,
      transferId: established.transferId,
      authorityAssessmentId: established.authorityAssessmentId,
      capacityAssessmentId: established.capacityAssessmentId,
      eligibilityAssessmentId: established.eligibilityAssessmentId,
      planId: established.planId,
      allocationId: established.allocationId,
    };

    assert.equal(
      established.execution.status,
      TREASURY_EXECUTION_STATUS.AUTHORIZED,
    );
    assert.equal(established.execution.metadata.version, 4);

    const dispatch = await prisma.$transaction(async (tx: TransactionClient) =>
      dispatchAuthorizedInternalWalletExecutionDurablyWithClient({
        executionId,

        handoffId: `handoff-atomic-settlement-${fixtureId}`,

        capability: {
          kind: TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET,
          settlementEndpointId,
          operationalInitiatorUserId: walletFixture!.operatorUserId,
          fromUserId: walletFixture!.senderUserId,
          toUserId: walletFixture!.receiverUserId,
          assetCode: "USD",
        },

        dispatchContext: {
          commandId: `command-dispatch-atomic-settlement-${fixtureId}`,
          actorId: `actor-atomic-settlement-${fixtureId}`,
          correlationId: `correlation-atomic-settlement-${fixtureId}`,
          requestedAt: new Date(),
          idempotencyKey: `dispatch-atomic-settlement-${fixtureId}`,
        },

        acknowledgementEventId: `event-queued-atomic-settlement-${fixtureId}`,

        acknowledgementContext: {
          commandId: `command-queued-atomic-settlement-${fixtureId}`,
          actorId: `actor-atomic-settlement-${fixtureId}`,
          correlationId: `correlation-atomic-settlement-${fixtureId}`,
          requestedAt: new Date(),
          idempotencyKey: `acknowledgement-atomic-settlement-${fixtureId}`,
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

    /*
     * Reconcile without ledger evidence.
     *
     * EXECUTING operational evidence is enough to establish INITIATED.
     * Absence of debit/credit evidence prevents confirmation.
     */
    const initiated = await prisma.$transaction(async (tx: TransactionClient) =>
      reconcileInternalWalletExecutionDurablyWithClient({
        executionId,
        initiatedEventId: `event-initiated-atomic-settlement-${fixtureId}`,
        allocationConsumedEventId: `event-unused-allocation-consumed-${fixtureId}`,
        confirmedEventId: `event-unused-confirmed-${fixtureId}`,
        context: {
          commandId: `command-initiate-atomic-settlement-${fixtureId}`,
          actorId: `actor-atomic-settlement-${fixtureId}`,
          correlationId: `correlation-atomic-settlement-${fixtureId}`,
          requestedAt: new Date(),
          idempotencyKey: `initiate-atomic-settlement-${fixtureId}`,
        },
        client: tx,
      }),
    );

    assert.equal(
      initiated.aggregate.status,
      TREASURY_EXECUTION_STATUS.INITIATED,
    );
    assert.equal(initiated.aggregate.metadata.version, 6);
    assert(initiated.initiated);
    assert.equal(initiated.confirmed, null);

    /*
     * Seed a globally unique event-ID collision outside the settlement
     * transaction.
     *
     * The allocation-consumption event ID remains fresh. Settlement must
     * therefore successfully mutate/persist Allocation utilization first,
     * then fail only when confirmation attempts this event ID.
     */
    await prisma.treasuryGatewayEvent.create({
      data: {
        eventId: conflictingConfirmedEventId,
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,
        aggregateId: collisionSeedAggregateId,
        aggregateVersion: 1,
        eventType: TREASURY_EVENT_TYPE.TREASURY_EXECUTION_CONFIRMED,
        actorId: `collision-seed-actor-${fixtureId}`,
        correlationId: `collision-seed-correlation-${fixtureId}`,
        payload: {
          fixtureId,
          purpose:
            "Force post-allocation execution-confirmation event persistence failure",
        },
        occurredAt: new Date(),
      },
    });

    const beforeAllocation = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryAllocationWithClient({
          allocationId: established.allocationId,
          client: tx,
        }),
    );

    const beforeExecution = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryExecutionWithClient({
          executionId,
          client: tx,
        }),
    );

    assert(beforeAllocation);
    assert(beforeExecution);

    assert.equal(
      beforeAllocation.aggregate.status,
      TREASURY_ALLOCATION_STATUS.ACTIVE,
    );
    assert.equal(beforeAllocation.aggregate.consumedAmount.amount, "0");

    assert.equal(
      beforeExecution.aggregate.status,
      TREASURY_EXECUTION_STATUS.INITIATED,
    );
    assert.equal(beforeExecution.aggregate.metadata.version, 6);

    const beforeAllocationVersion = beforeAllocation.aggregate.metadata.version;
    const beforeExecutionVersion = beforeExecution.aggregate.metadata.version;

    const allocationConsumedEventId = `event-allocation-consumed-atomic-settlement-${fixtureId}`;

    const persistedAction = await prisma.treasuryAction.findUniqueOrThrow({
      where: {
        id: dispatch.dispatch.treasuryActionId,
      },
    });

    let settlementError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        confirmTreasuryExecutionWithAllocationSettlementDurablyWithClient({
          settlement: {
            executionId,

            amount: beforeExecution.aggregate.amount,

            verifiedAt: new Date(),
          } as VerifiedTreasuryExecutionSettlement,
          allocationConsumedEventId,
          confirmedEventId: conflictingConfirmedEventId,

          context: {
            commandId: `command-confirm-atomic-settlement-${fixtureId}`,
            actorId: `actor-atomic-settlement-${fixtureId}`,
            correlationId: `correlation-atomic-settlement-${fixtureId}`,
            requestedAt: new Date(),
            idempotencyKey: `confirm-atomic-settlement-${fixtureId}`,
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      settlementError = error;
    }

    assert(settlementError);

    const errorCode =
      typeof settlementError === "object" &&
      settlementError !== null &&
      "code" in settlementError
        ? String(settlementError.code)
        : "";

    const errorMessage =
      settlementError instanceof Error
        ? settlementError.message
        : String(settlementError);

    assert(
      errorCode === "P2002" ||
        errorMessage.includes("P2002") ||
        errorMessage.includes("Unique constraint"),
      `expected event-ID uniqueness failure, received: ${errorMessage}`,
    );

    const afterAllocation = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryAllocationWithClient({
          allocationId: established.allocationId,
          client: tx,
        }),
    );

    const afterExecution = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryExecutionWithClient({
          executionId,
          client: tx,
        }),
    );

    assert(afterAllocation);
    assert(afterExecution);

    /*
     * EP-3B atomicity:
     * neither durable financial fact may escape independently.
     */
    assert.equal(
      afterAllocation.aggregate.status,
      TREASURY_ALLOCATION_STATUS.ACTIVE,
    );
    assert.equal(afterAllocation.aggregate.consumedAmount.amount, "0");
    assert.equal(
      afterAllocation.aggregate.metadata.version,
      beforeAllocationVersion,
    );

    assert.equal(
      afterExecution.aggregate.status,
      TREASURY_EXECUTION_STATUS.INITIATED,
    );
    assert.equal(
      afterExecution.aggregate.metadata.version,
      beforeExecutionVersion,
    );

    const rolledBackConsumptionEvents = await prisma.treasuryGatewayEvent.count(
      {
        where: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_ALLOCATION,
          aggregateId: established.allocationId,
          eventType: TREASURY_EVENT_TYPE.TREASURY_ALLOCATION_CONSUMED,
        },
      },
    );

    const rolledBackConfirmationEvents =
      await prisma.treasuryGatewayEvent.count({
        where: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,
          aggregateId: executionId,
          eventType: TREASURY_EVENT_TYPE.TREASURY_EXECUTION_CONFIRMED,
        },
      });

    assert.equal(rolledBackConsumptionEvents, 0);
    assert.equal(rolledBackConfirmationEvents, 0);

    const freshConsumptionEvent = await prisma.treasuryGatewayEvent.findUnique({
      where: {
        eventId: allocationConsumedEventId,
      },
    });

    assert.equal(freshConsumptionEvent, null);

    const survivingCollisionSeed = await prisma.treasuryGatewayEvent.findUnique(
      {
        where: {
          eventId: conflictingConfirmedEventId,
        },
      },
    );

    assert(survivingCollisionSeed);
    assert.equal(survivingCollisionSeed.aggregateId, collisionSeedAggregateId);

    console.log(
      "✓ Treasury Gateway atomic Allocation utilization settlement smoke test passed",
    );

    console.log({
      failure: {
        code: errorCode || "UNTRANSLATED",
        eventIdCollision: true,
      },
      allocation: {
        beforeStatus: beforeAllocation.aggregate.status,
        afterStatus: afterAllocation.aggregate.status,
        beforeVersion: beforeAllocationVersion,
        afterVersion: afterAllocation.aggregate.metadata.version,
        consumedAmount: afterAllocation.aggregate.consumedAmount.amount,
        consumptionEventCount: rolledBackConsumptionEvents,
      },
      execution: {
        beforeStatus: beforeExecution.aggregate.status,
        afterStatus: afterExecution.aggregate.status,
        beforeVersion: beforeExecutionVersion,
        afterVersion: afterExecution.aggregate.metadata.version,
        confirmationEventCount: rolledBackConfirmationEvents,
      },
      rollback: {
        allocationConsumptionRolledBack: freshConsumptionEvent === null,
        collisionSeedSurvived: Boolean(survivingCollisionSeed),
      },
    });
  } finally {
    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        eventId: conflictingConfirmedEventId,
      },
    });

    await cleanupFixture({
      executionId,

      walletFixture,

      governedFixture,
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
