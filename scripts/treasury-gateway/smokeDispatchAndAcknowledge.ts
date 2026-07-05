import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { dispatchAndAcknowledgeInternalWalletExecutionWithClient } from "../../src/domains/treasury/gateway/executions/adapters/internal-wallet/dispatchAndAcknowledgeInternalWalletExecutionWithClient";

import { TREASURY_EXECUTION_ADAPTER_KIND } from "../../src/domains/treasury/gateway/executions/routing/contracts";

import { TREASURY_EXECUTION_STATUS } from "../../src/domains/treasury/gateway/executions/status";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import type { TreasuryExecution } from "../../src/domains/treasury/gateway/executions/contracts";

import type { TreasuryExecutionHandoff } from "../../src/domains/treasury/gateway/executions/handoff/contracts";

import type { ResolvedTreasuryExecutionRoute } from "../../src/domains/treasury/gateway/executions/routing/contracts";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const executionId = `smoke-execution-${fixtureId}`;

  const handoffId = `smoke-handoff-${fixtureId}`;

  const idempotencyKey = `smoke-dispatch-ack-${fixtureId}`;

  const endpointId = `smoke-endpoint-${fixtureId}`;

  const now = new Date();

  const execution: TreasuryExecution = {
    id: executionId,

    reference: `SMOKE-${fixtureId}`,

    programId: `smoke-program-${fixtureId}`,

    allocationId: `smoke-allocation-${fixtureId}`,

    instructionId: `smoke-instruction-${fixtureId}`,

    kind: "BENEFICIARY_DISTRIBUTION",

    beneficiaryProfileId: `smoke-beneficiary-${fixtureId}`,

    settlementEndpointId: endpointId,

    amount: {
      amount: "25.50",

      currency: "USD",
    },

    purpose: "Dispatch and acknowledge smoke test",

    status: TREASURY_EXECUTION_STATUS.AUTHORIZED,

    authorizedAt: now,

    metadata: {
      createdAt: now,

      updatedAt: now,

      createdByActorId: `smoke-actor-created-${fixtureId}`,

      lastModifiedByActorId: `smoke-actor-authorized-${fixtureId}`,

      version: 4,
    },
  };

  const handoff: TreasuryExecutionHandoff = {
    id: handoffId,

    executionId,

    executionVersion: execution.metadata.version,

    programId: execution.programId,

    allocationId: execution.allocationId,

    instructionId: execution.instructionId,

    kind: execution.kind,

    beneficiaryProfileId: execution.beneficiaryProfileId,

    settlementEndpointId: endpointId,

    amount: execution.amount,

    purpose: execution.purpose,

    authorization: {
      approvalIds: [`smoke-approval-1-${fixtureId}`],

      authorizedAt: now,
    },

    context: {
      requestedByActorId: `smoke-requester-${fixtureId}`,

      correlationId: `smoke-correlation-${fixtureId}`,

      idempotencyKey,

      requestedAt: now,
    },
  };

  const route: ResolvedTreasuryExecutionRoute = {
    status: "RESOLVED",

    handoffId,

    executionId,

    adapterKind: TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET,

    capability: {
      kind: TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET,

      settlementEndpointId: endpointId,

      operationalInitiatorUserId: `smoke-operator-${fixtureId}`,

      fromUserId: `smoke-source-${fixtureId}`,

      toUserId: `smoke-beneficiary-${fixtureId}`,

      assetCode: "USD",
    },
  };

  let treasuryActionId: string | null = null;

  try {
    const result = await prisma.$transaction(async (tx: TransactionClient) =>
      dispatchAndAcknowledgeInternalWalletExecutionWithClient({
        execution,
        handoff,
        route,

        acknowledgementContext: {
          commandId: `smoke-command-queued-${fixtureId}`,

          actorId: `smoke-actor-queued-${fixtureId}`,

          correlationId: `smoke-correlation-${fixtureId}`,

          causationId: `smoke-command-authorized-${fixtureId}`,

          requestedAt: now,

          idempotencyKey: `smoke-ack-${fixtureId}`,
        },

        client: tx,
      }),
    );

    treasuryActionId = result.dispatch.treasuryActionId;

    assert.equal(result.dispatch.treasuryActionStatus, "QUEUED");

    assert.equal(result.dispatch.treasuryQueueStatus, "PENDING");

    assert.equal(
      result.gateway.aggregate.status,
      TREASURY_EXECUTION_STATUS.QUEUED,
    );

    assert.equal(result.gateway.aggregate.metadata.version, 5);

    assert.equal(
      result.gateway.event.eventType,
      TREASURY_EVENT_TYPE.TREASURY_EXECUTION_QUEUED,
    );

    assert.equal(
      result.gateway.event.payload.treasuryActionId,
      result.dispatch.treasuryActionId,
    );

    assert.equal(
      result.gateway.event.payload.treasuryQueueJobId,
      result.dispatch.treasuryQueueJobId,
    );

    assert.equal(result.gateway.event.payload.handoffId, handoffId);

    assert.equal(
      result.gateway.event.payload.adapterKind,
      TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET,
    );

    assert.equal(result.gateway.event.payload.settlementEndpointId, endpointId);

    console.log(
      "✓ Treasury Gateway dispatch and acknowledgement smoke test passed",
    );

    console.log({
      gatewayExecutionId: result.gateway.aggregate.id,

      gatewayStatus: result.gateway.aggregate.status,

      handoffId: result.gateway.event.payload.handoffId,

      adapterKind: result.gateway.event.payload.adapterKind,

      settlementEndpointId: result.gateway.event.payload.settlementEndpointId,

      treasuryActionId: result.dispatch.treasuryActionId,

      treasuryQueueJobId: result.dispatch.treasuryQueueJobId,

      eventType: result.gateway.event.eventType,
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
