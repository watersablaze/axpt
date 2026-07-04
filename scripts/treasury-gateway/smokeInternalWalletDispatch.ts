import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { dispatchAuthorizedInternalWalletExecutionWithClient } from "../../src/domains/treasury/gateway/executions/adapters/internal-wallet/dispatchAuthorizedInternalWalletExecutionWithClient";

import { TREASURY_EXECUTION_ADAPTER_KIND } from "../../src/domains/treasury/gateway/executions/routing/contracts";

import {
  TREASURY_ACTION_STATUS,
  TREASURY_QUEUE_STATUS,
} from "../../src/domains/treasury/stateMachine";

import type { TreasuryExecutionHandoff } from "../../src/domains/treasury/gateway/executions/handoff/contracts";

import type { ResolvedTreasuryExecutionRoute } from "../../src/domains/treasury/gateway/executions/routing/contracts";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const handoffId = `smoke-handoff-${fixtureId}`;

  const executionId = `smoke-execution-${fixtureId}`;

  const idempotencyKey = `smoke-internal-wallet-${fixtureId}`;

  const handoff: TreasuryExecutionHandoff = {
    id: handoffId,

    executionId,

    executionVersion: 1,

    programId: `smoke-program-${fixtureId}`,

    allocationId: `smoke-allocation-${fixtureId}`,

    instructionId: `smoke-instruction-${fixtureId}`,

    kind: "BENEFICIARY_DISTRIBUTION",

    beneficiaryProfileId: `smoke-beneficiary-${fixtureId}`,

    settlementEndpointId: `smoke-endpoint-${fixtureId}`,

    amount: {
      amount: "25.50",

      currency: "USD",
    },

    purpose: "Treasury Gateway internal wallet smoke test",

    authorization: {
      approvalIds: [
        `smoke-approval-1-${fixtureId}`,
        `smoke-approval-2-${fixtureId}`,
      ],

      authorizedAt: new Date(),
    },

    context: {
      requestedByActorId: `smoke-actor-${fixtureId}`,

      correlationId: `smoke-correlation-${fixtureId}`,

      causationId: `smoke-causation-${fixtureId}`,

      idempotencyKey,

      requestedAt: new Date(),
    },
  };

  const route: ResolvedTreasuryExecutionRoute = {
    status: "RESOLVED",

    handoffId,

    executionId,

    adapterKind: TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET,

    capability: {
      kind: TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET,

      settlementEndpointId: `smoke-endpoint-${fixtureId}`,

      operationalInitiatorUserId: `smoke-operator-${fixtureId}`,

      fromUserId: `smoke-source-${fixtureId}`,

      toUserId: `smoke-beneficiary-${fixtureId}`,

      assetCode: "USD",
    },
  };

  let treasuryActionId: string | null = null;

  try {
    const firstDispatch = await prisma.$transaction(
      async (tx: TransactionClient) =>
        dispatchAuthorizedInternalWalletExecutionWithClient({
          handoff,
          route,
          client: tx,
        }),
    );

    treasuryActionId = firstDispatch.treasuryActionId;

    assert.equal(firstDispatch.gatewayExecutionId, executionId);

    assert.equal(firstDispatch.gatewayHandoffId, handoffId);

    assert.equal(
      firstDispatch.treasuryActionStatus,
      TREASURY_ACTION_STATUS.QUEUED,
    );

    assert.equal(
      firstDispatch.treasuryQueueStatus,
      TREASURY_QUEUE_STATUS.PENDING,
    );

    const persistedAction = await prisma.treasuryAction.findUnique({
      where: {
        id: firstDispatch.treasuryActionId,
      },
    });

    assert.ok(persistedAction, "Expected TreasuryAction to exist");

    assert.equal(persistedAction.status, TREASURY_ACTION_STATUS.QUEUED);

    assert.equal(persistedAction.idempotencyKey, idempotencyKey);

    assert.equal(persistedAction.assetCode, "USD");

    assert.equal(persistedAction.amountBaseUnits.toString(), "2550");

    assert.equal(persistedAction.approvalType, "GATEWAY_AUTHORIZED");

    const persistedQueue = await prisma.treasuryExecutionQueue.findUnique({
      where: {
        treasuryActionId: firstDispatch.treasuryActionId,
      },
    });

    assert.ok(persistedQueue, "Expected TreasuryExecutionQueue to exist");

    assert.equal(persistedQueue.status, TREASURY_QUEUE_STATUS.PENDING);

    assert.equal(persistedQueue.id, firstDispatch.treasuryQueueJobId);

    const secondDispatch = await prisma.$transaction(
      async (tx: TransactionClient) =>
        dispatchAuthorizedInternalWalletExecutionWithClient({
          handoff,
          route,
          client: tx,
        }),
    );

    assert.equal(
      secondDispatch.treasuryActionId,
      firstDispatch.treasuryActionId,
    );

    assert.equal(
      secondDispatch.treasuryQueueJobId,
      firstDispatch.treasuryQueueJobId,
    );

    const actionCount = await prisma.treasuryAction.count({
      where: {
        idempotencyKey,
      },
    });

    assert.equal(actionCount, 1);

    const queueCount = await prisma.treasuryExecutionQueue.count({
      where: {
        treasuryActionId: firstDispatch.treasuryActionId,
      },
    });

    assert.equal(queueCount, 1);

    console.log(
      "✓ Treasury Gateway internal wallet database smoke test passed",
    );

    console.log({
      treasuryActionId: firstDispatch.treasuryActionId,

      treasuryQueueJobId: firstDispatch.treasuryQueueJobId,

      actionStatus: firstDispatch.treasuryActionStatus,

      queueStatus: firstDispatch.treasuryQueueStatus,

      redispatchActionId: secondDispatch.treasuryActionId,

      redispatchQueueJobId: secondDispatch.treasuryQueueJobId,
    });
  } finally {
    if (treasuryActionId) {
      await prisma.treasuryExecutionQueue.deleteMany({
        where: {
          treasuryActionId,
        },
      });

      await prisma.treasuryApproval.deleteMany({
        where: {
          actionId: treasuryActionId,
        },
      });

      await prisma.treasuryAction.deleteMany({
        where: {
          id: treasuryActionId,
        },
      });
    } else {
      const action = await prisma.treasuryAction.findUnique({
        where: {
          idempotencyKey,
        },

        select: {
          id: true,
        },
      });

      if (action) {
        await prisma.treasuryExecutionQueue.deleteMany({
          where: {
            treasuryActionId: action.id,
          },
        });

        await prisma.treasuryApproval.deleteMany({
          where: {
            actionId: action.id,
          },
        });

        await prisma.treasuryAction.deleteMany({
          where: {
            id: action.id,
          },
        });
      }
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
