import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { createTreasuryExecution } from "../../src/domains/treasury/gateway/executions/createTreasuryExecution";

import { beginTreasuryExecutionValidationDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/beginTreasuryExecutionValidationDurablyWithClient";

import { markTreasuryExecutionReadyForAuthorizationDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/markTreasuryExecutionReadyForAuthorizationDurablyWithClient";

import { authorizeTreasuryExecutionDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/authorizeTreasuryExecutionDurablyWithClient";

import { findTreasuryExecutionReconciliationCandidatesWithClient } from "../../src/domains/treasury/gateway/executions/persistence/findTreasuryExecutionReconciliationCandidatesWithClient";

import type { LoadedTreasuryExecution } from "../../src/domains/treasury/gateway/executions/persistence/contracts";

import { persistNewTreasuryExecutionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/persistNewTreasuryExecutionWithClient";

import { persistTreasuryExecutionTransitionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/persistTreasuryExecutionTransitionWithClient";

import { loadTreasuryExecutionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/loadTreasuryExecutionWithClient";

import { TREASURY_EXECUTION_STATUS } from "../../src/domains/treasury/gateway/executions/status";

const prisma = new PrismaClient();

type FixtureStatus =
  | "CREATED"
  | "VALIDATING"
  | "AUTHORIZED"
  | "QUEUED"
  | "INITIATED"
  | "CONFIRMED";

async function createFixture(params: {
  fixtureId: string;

  status: FixtureStatus;

  updatedAt: Date;
}): Promise<string> {
  const { fixtureId, status, updatedAt } = params;

  const executionId = `smoke-reconciliation-candidate-${fixtureId}`;

  const correlationId = `correlation-${fixtureId}`;

  const createContext = {
    commandId: `command-create-${fixtureId}`,

    actorId: `actor-create-${fixtureId}`,

    correlationId,

    requestedAt: new Date(updatedAt.getTime() - 600_000),

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

        settlementEndpointId: `endpoint-${fixtureId}`,

        amount: {
          amount: "10.00",

          currency: "USD",
        },

        purpose: "Reconciliation candidate discovery smoke test",
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

    if (status === TREASURY_EXECUTION_STATUS.CREATED) {
      return;
    }

    await beginTreasuryExecutionValidationDurablyWithClient({
      command: {
        context: {
          commandId: `command-validation-${fixtureId}`,

          actorId: `actor-validation-${fixtureId}`,

          correlationId,

          requestedAt: new Date(updatedAt.getTime() - 500_000),

          idempotencyKey: `validation-${fixtureId}`,
        },

        payload: {
          executionId,
        },
      },

      eventId: `event-validation-${fixtureId}`,

      client: tx,
    });

    if (status === TREASURY_EXECUTION_STATUS.VALIDATING) {
      return;
    }

    await markTreasuryExecutionReadyForAuthorizationDurablyWithClient({
      command: {
        context: {
          commandId: `command-ready-${fixtureId}`,

          actorId: `actor-ready-${fixtureId}`,

          correlationId,

          requestedAt: new Date(updatedAt.getTime() - 400_000),

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

          authorityGrantId: `authority-${fixtureId}`,

          correlationId,

          requestedAt: new Date(updatedAt.getTime() - 300_000),

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

    if (status === TREASURY_EXECUTION_STATUS.AUTHORIZED) {
      return;
    }

    const authorized = await loadTreasuryExecutionWithClient({
      executionId,

      client: tx,
    });

    assert(authorized);

    const queuedAt = new Date(updatedAt.getTime() - 200_000);

    const queuedResult = {
      aggregate: {
        ...authorized.aggregate,

        status: TREASURY_EXECUTION_STATUS.QUEUED,

        metadata: {
          ...authorized.aggregate.metadata,

          updatedAt: queuedAt,

          lastModifiedByActorId: `actor-queued-${fixtureId}`,

          version: authorized.aggregate.metadata.version + 1,
        },
      },

      event: {
        eventType: TREASURY_EVENT_TYPE.TREASURY_EXECUTION_QUEUED,

        payload: {
          executionId,

          treasuryActionId: `action-${fixtureId}`,

          treasuryQueueJobId: `queue-${fixtureId}`,

          queuedAt,
        },

        occurredAt: queuedAt,
      },
    };

    await persistTreasuryExecutionTransitionWithClient({
      expectedVersion: authorized.aggregate.metadata.version,

      result: queuedResult,

      eventId: `event-queued-${fixtureId}`,

      context: {
        commandId: `command-queued-${fixtureId}`,

        actorId: `actor-queued-${fixtureId}`,

        correlationId,

        requestedAt: queuedAt,

        idempotencyKey: `queued-${fixtureId}`,
      },

      client: tx,
    });

    if (status === TREASURY_EXECUTION_STATUS.QUEUED) {
      return;
    }

    const queued = await loadTreasuryExecutionWithClient({
      executionId,

      client: tx,
    });

    assert(queued);

    const initiatedAt = new Date(updatedAt.getTime() - 100_000);

    const initiatedResult = {
      aggregate: {
        ...queued.aggregate,

        status: TREASURY_EXECUTION_STATUS.INITIATED,

        metadata: {
          ...queued.aggregate.metadata,

          updatedAt: initiatedAt,

          lastModifiedByActorId: `actor-initiated-${fixtureId}`,

          version: queued.aggregate.metadata.version + 1,
        },
      },

      event: {
        eventType: TREASURY_EVENT_TYPE.TREASURY_EXECUTION_INITIATED,

        payload: {
          executionId,

          treasuryActionId: `action-${fixtureId}`,

          treasuryActionStatus: "EXECUTING",

          idempotencyKey: `dispatch-${fixtureId}`,

          initiatedAt,
        },

        occurredAt: initiatedAt,
      },
    };

    await persistTreasuryExecutionTransitionWithClient({
      expectedVersion: queued.aggregate.metadata.version,

      result: initiatedResult,

      eventId: `event-initiated-${fixtureId}`,

      context: {
        commandId: `command-initiated-${fixtureId}`,

        actorId: `actor-initiated-${fixtureId}`,

        correlationId,

        requestedAt: initiatedAt,

        idempotencyKey: `initiated-${fixtureId}`,
      },

      client: tx,
    });

    if (status === TREASURY_EXECUTION_STATUS.INITIATED) {
      return;
    }

    const initiated = await loadTreasuryExecutionWithClient({
      executionId,

      client: tx,
    });

    assert(initiated);

    const confirmedResult = {
      aggregate: {
        ...initiated.aggregate,

        status: TREASURY_EXECUTION_STATUS.CONFIRMED,

        metadata: {
          ...initiated.aggregate.metadata,

          updatedAt,

          lastModifiedByActorId: `actor-confirmed-${fixtureId}`,

          version: initiated.aggregate.metadata.version + 1,
        },
      },

      event: {
        eventType: TREASURY_EVENT_TYPE.TREASURY_EXECUTION_CONFIRMED,

        payload: {
          executionId,

          treasuryActionId: `action-${fixtureId}`,

          idempotencyKey: `dispatch-${fixtureId}`,

          debitTransactionId: `debit-${fixtureId}`,

          creditTransactionId: `credit-${fixtureId}`,

          assetCode: "USD",

          amountBaseUnits: "10000000000000000000",

          confirmedAt: updatedAt,
        },

        occurredAt: updatedAt,
      },
    };

    await persistTreasuryExecutionTransitionWithClient({
      expectedVersion: initiated.aggregate.metadata.version,

      result: confirmedResult,

      eventId: `event-confirmed-${fixtureId}`,

      context: {
        commandId: `command-confirmed-${fixtureId}`,

        actorId: `actor-confirmed-${fixtureId}`,

        correlationId,

        requestedAt: updatedAt,

        idempotencyKey: `confirmed-${fixtureId}`,
      },

      client: tx,
    });
  });

  await prisma.treasuryGatewayAggregate.update({
    where: {
      aggregateType_aggregateId: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

        aggregateId: executionId,
      },
    },

    data: {
      updatedAt,
    },
  });

  return executionId;
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

  await prisma.treasuryGatewayAggregate.deleteMany({
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

  const now = Date.now();

  const fixtures = [
    {
      name: "created",

      status: TREASURY_EXECUTION_STATUS.CREATED,

      updatedAt: new Date(now - 700_000),
    },

    {
      name: "queued-oldest",

      status: TREASURY_EXECUTION_STATUS.QUEUED,

      updatedAt: new Date(now - 600_000),
    },

    {
      name: "authorized",

      status: TREASURY_EXECUTION_STATUS.AUTHORIZED,

      updatedAt: new Date(now - 500_000),
    },

    {
      name: "initiated",

      status: TREASURY_EXECUTION_STATUS.INITIATED,

      updatedAt: new Date(now - 400_000),
    },

    {
      name: "queued-newest",

      status: TREASURY_EXECUTION_STATUS.QUEUED,

      updatedAt: new Date(now - 300_000),
    },

    {
      name: "confirmed",

      status: TREASURY_EXECUTION_STATUS.CONFIRMED,

      updatedAt: new Date(now - 200_000),
    },
  ] as const;

  const executionIds: string[] = [];

  try {
    for (const fixture of fixtures) {
      executionIds.push(
        await createFixture({
          fixtureId: `${fixture.name}-${runId}`,

          status: fixture.status,

          updatedAt: fixture.updatedAt,
        }),
      );
    }

    const candidates = await prisma.$transaction(
      async (tx: TransactionClient) =>
        findTreasuryExecutionReconciliationCandidatesWithClient({
          limit: 10,

          client: tx,
        }),
    );

    const fixtureCandidates = candidates.filter(
      (candidate: LoadedTreasuryExecution) =>
        executionIds.includes(candidate.aggregate.id),
    );

    assert.deepEqual(
      fixtureCandidates.map(
        (candidate: LoadedTreasuryExecution) => candidate.aggregate.status,
      ),

      [
        TREASURY_EXECUTION_STATUS.QUEUED,
        TREASURY_EXECUTION_STATUS.INITIATED,
        TREASURY_EXECUTION_STATUS.QUEUED,
      ],
    );

    assert.deepEqual(
      fixtureCandidates.map(
        (candidate: LoadedTreasuryExecution) => candidate.aggregate.id,
      ),

      [executionIds[1], executionIds[3], executionIds[4]],
    );

    const limited = await prisma.$transaction(async (tx: TransactionClient) =>
      findTreasuryExecutionReconciliationCandidatesWithClient({
        limit: 2,

        client: tx,
      }),
    );

    const limitedFixtureCandidates = limited.filter(
      (candidate: LoadedTreasuryExecution) =>
        executionIds.includes(candidate.aggregate.id),
    );

    assert.equal(limitedFixtureCandidates.length, 2);

    assert.deepEqual(
      limitedFixtureCandidates.map(
        (candidate: LoadedTreasuryExecution) => candidate.aggregate.id,
      ),

      [executionIds[1], executionIds[3]],
    );

    await assert.rejects(
      prisma.$transaction(async (tx: TransactionClient) =>
        findTreasuryExecutionReconciliationCandidatesWithClient({
          limit: 0,

          client: tx,
        }),
      ),

      /TREASURY_GATEWAY_RECONCILIATION_CANDIDATE_LIMIT_INVALID/,
    );

    const corruptExecutionId = executionIds[1];

    const corruptRow = await prisma.treasuryGatewayAggregate.findUniqueOrThrow({
      where: {
        aggregateType_aggregateId: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

          aggregateId: corruptExecutionId,
        },
      },
    });

    await prisma.treasuryGatewayAggregate.update({
      where: {
        aggregateType_aggregateId: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

          aggregateId: corruptExecutionId,
        },
      },

      data: {
        snapshot: {
          ...(corruptRow.snapshot as Record<string, unknown>),

          status: TREASURY_EXECUTION_STATUS.CONFIRMED,
        },
      },
    });

    await assert.rejects(
      prisma.$transaction(async (tx: TransactionClient) =>
        findTreasuryExecutionReconciliationCandidatesWithClient({
          limit: 10,

          client: tx,
        }),
      ),

      /TREASURY_GATEWAY_EXECUTION_SNAPSHOT_STATUS_MISMATCH/,
    );

    await prisma.treasuryGatewayAggregate.update({
      where: {
        aggregateType_aggregateId: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

          aggregateId: corruptExecutionId,
        },
      },

      data: {
        snapshot: corruptRow.snapshot,
      },
    });

    console.log(
      "✓ Treasury Gateway reconciliation candidate discovery smoke test passed",
    );

    console.log({
      discoveredStatuses: fixtureCandidates.map(
        (candidate: LoadedTreasuryExecution) => candidate.aggregate.status,
      ),

      discoveredIds: fixtureCandidates.map(
        (candidate: LoadedTreasuryExecution) => candidate.aggregate.id,
      ),

      limitedIds: limitedFixtureCandidates.map(
        (candidate: LoadedTreasuryExecution) => candidate.aggregate.id,
      ),
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
