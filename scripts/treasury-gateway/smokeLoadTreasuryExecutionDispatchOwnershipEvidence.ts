import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { TREASURY_EXECUTION_ADAPTER_KIND } from "../../src/domains/treasury/gateway/executions/routing/contracts";

import { loadTreasuryExecutionDispatchOwnershipEvidenceWithClient } from "../../src/domains/treasury/gateway/executions/persistence/loadTreasuryExecutionDispatchOwnershipEvidenceWithClient";

const prisma = new PrismaClient();

async function createQueuedEvent(params: {
  executionId: string;

  eventId: string;

  aggregateVersion: number;

  handoffId: string;

  adapterKind: string;

  settlementEndpointId: string;

  treasuryActionId: string;

  treasuryQueueJobId: string;

  queuedAt: Date;

  payloadExecutionId?: string;
}): Promise<void> {
  const {
    executionId,
    eventId,
    aggregateVersion,
    handoffId,
    adapterKind,
    settlementEndpointId,
    treasuryActionId,
    treasuryQueueJobId,
    queuedAt,
    payloadExecutionId,
  } = params;

  await prisma.treasuryGatewayEvent.create({
    data: {
      eventId,

      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

      aggregateId: executionId,

      aggregateVersion,

      eventType: TREASURY_EVENT_TYPE.TREASURY_EXECUTION_QUEUED,

      correlationId: `correlation-${eventId}`,

      payload: {
        executionId: payloadExecutionId ?? executionId,

        handoffId,

        adapterKind,

        settlementEndpointId,

        treasuryActionId,

        treasuryQueueJobId,

        queuedAt: queuedAt.toISOString(),
      },

      occurredAt: queuedAt,
    },
  });
}

async function cleanup(executionIds: readonly string[]): Promise<void> {
  await prisma.treasuryGatewayEvent.deleteMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

      aggregateId: {
        in: [...executionIds],
      },
    },
  });
}

async function main(): Promise<void> {
  const runId = randomUUID();

  const primaryExecutionId = `smoke-dispatch-ownership-primary-${runId}`;

  const invalidAdapterExecutionId = `smoke-dispatch-ownership-invalid-adapter-${runId}`;

  const mismatchedExecutionId = `smoke-dispatch-ownership-id-mismatch-${runId}`;

  const executionIds = [
    primaryExecutionId,
    invalidAdapterExecutionId,
    mismatchedExecutionId,
  ] as const;

  try {
    const noEvidence = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryExecutionDispatchOwnershipEvidenceWithClient({
          executionId: primaryExecutionId,

          executionVersion: 4,

          client: tx,
        }),
    );

    assert.equal(noEvidence, null);

    const firstQueuedAt = new Date("2026-07-06T08:00:00.000Z");

    await createQueuedEvent({
      executionId: primaryExecutionId,

      eventId: `event-first-${runId}`,

      aggregateVersion: 5,

      handoffId: `handoff-first-${runId}`,

      adapterKind: TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET,

      settlementEndpointId: `endpoint-first-${runId}`,

      treasuryActionId: `action-first-${runId}`,

      treasuryQueueJobId: `queue-first-${runId}`,

      queuedAt: firstQueuedAt,
    });

    const beforeQueuedVersion = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryExecutionDispatchOwnershipEvidenceWithClient({
          executionId: primaryExecutionId,

          executionVersion: 4,

          client: tx,
        }),
    );

    assert.equal(beforeQueuedVersion, null);

    const firstEvidence = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryExecutionDispatchOwnershipEvidenceWithClient({
          executionId: primaryExecutionId,

          executionVersion: 5,

          client: tx,
        }),
    );

    assert(firstEvidence);

    assert.equal(firstEvidence.handoffId, `handoff-first-${runId}`);

    assert.equal(
      firstEvidence.adapterKind,
      TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET,
    );

    assert.equal(firstEvidence.settlementEndpointId, `endpoint-first-${runId}`);

    assert.equal(firstEvidence.treasuryActionId, `action-first-${runId}`);

    assert.equal(firstEvidence.treasuryQueueJobId, `queue-first-${runId}`);

    assert.equal(firstEvidence.aggregateVersion, 5);

    const laterVersionEvidence = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryExecutionDispatchOwnershipEvidenceWithClient({
          executionId: primaryExecutionId,

          executionVersion: 7,

          client: tx,
        }),
    );

    assert(laterVersionEvidence);

    assert.equal(laterVersionEvidence.eventId, firstEvidence.eventId);

    const secondQueuedAt = new Date("2026-07-06T09:00:00.000Z");

    await createQueuedEvent({
      executionId: primaryExecutionId,

      eventId: `event-second-${runId}`,

      aggregateVersion: 9,

      handoffId: `handoff-second-${runId}`,

      adapterKind: TREASURY_EXECUTION_ADAPTER_KIND.MANUAL_TREASURY_OPERATION,

      settlementEndpointId: `endpoint-second-${runId}`,

      treasuryActionId: `action-second-${runId}`,

      treasuryQueueJobId: `queue-second-${runId}`,

      queuedAt: secondQueuedAt,
    });

    const evidenceBeforeSecondQueue = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryExecutionDispatchOwnershipEvidenceWithClient({
          executionId: primaryExecutionId,

          executionVersion: 8,

          client: tx,
        }),
    );

    assert(evidenceBeforeSecondQueue);

    assert.equal(evidenceBeforeSecondQueue.aggregateVersion, 5);

    const latestEvidence = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryExecutionDispatchOwnershipEvidenceWithClient({
          executionId: primaryExecutionId,

          executionVersion: 9,

          client: tx,
        }),
    );

    assert(latestEvidence);

    assert.equal(latestEvidence.aggregateVersion, 9);

    assert.equal(latestEvidence.handoffId, `handoff-second-${runId}`);

    assert.equal(
      latestEvidence.adapterKind,
      TREASURY_EXECUTION_ADAPTER_KIND.MANUAL_TREASURY_OPERATION,
    );

    await createQueuedEvent({
      executionId: invalidAdapterExecutionId,

      eventId: `event-invalid-adapter-${runId}`,

      aggregateVersion: 5,

      handoffId: `handoff-invalid-adapter-${runId}`,

      adapterKind: "UNKNOWN_ADAPTER",

      settlementEndpointId: `endpoint-invalid-adapter-${runId}`,

      treasuryActionId: `action-invalid-adapter-${runId}`,

      treasuryQueueJobId: `queue-invalid-adapter-${runId}`,

      queuedAt: new Date("2026-07-06T10:00:00.000Z"),
    });

    await assert.rejects(
      prisma.$transaction(async (tx: TransactionClient) =>
        loadTreasuryExecutionDispatchOwnershipEvidenceWithClient({
          executionId: invalidAdapterExecutionId,

          executionVersion: 5,

          client: tx,
        }),
      ),

      /TREASURY_GATEWAY_EXECUTION_DISPATCH_ADAPTER_KIND_INVALID/,
    );

    await createQueuedEvent({
      executionId: mismatchedExecutionId,

      eventId: `event-id-mismatch-${runId}`,

      aggregateVersion: 5,

      handoffId: `handoff-id-mismatch-${runId}`,

      adapterKind: TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET,

      settlementEndpointId: `endpoint-id-mismatch-${runId}`,

      treasuryActionId: `action-id-mismatch-${runId}`,

      treasuryQueueJobId: `queue-id-mismatch-${runId}`,

      queuedAt: new Date("2026-07-06T11:00:00.000Z"),

      payloadExecutionId: `different-execution-${runId}`,
    });

    await assert.rejects(
      prisma.$transaction(async (tx: TransactionClient) =>
        loadTreasuryExecutionDispatchOwnershipEvidenceWithClient({
          executionId: mismatchedExecutionId,

          executionVersion: 5,

          client: tx,
        }),
      ),

      /TREASURY_GATEWAY_EXECUTION_DISPATCH_OWNERSHIP_ID_MISMATCH/,
    );

    await assert.rejects(
      prisma.$transaction(async (tx: TransactionClient) =>
        loadTreasuryExecutionDispatchOwnershipEvidenceWithClient({
          executionId: primaryExecutionId,

          executionVersion: 0,

          client: tx,
        }),
      ),

      /TREASURY_GATEWAY_EXECUTION_VERSION_INVALID/,
    );

    console.log(
      "✓ Treasury Gateway dispatch ownership evidence smoke test passed",
    );

    console.log({
      firstOwnership: {
        aggregateVersion: firstEvidence.aggregateVersion,

        handoffId: firstEvidence.handoffId,

        adapterKind: firstEvidence.adapterKind,

        settlementEndpointId: firstEvidence.settlementEndpointId,
      },

      latestOwnership: {
        aggregateVersion: latestEvidence.aggregateVersion,

        handoffId: latestEvidence.handoffId,

        adapterKind: latestEvidence.adapterKind,

        settlementEndpointId: latestEvidence.settlementEndpointId,
      },
    });
  } finally {
    await cleanup(executionIds);
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
