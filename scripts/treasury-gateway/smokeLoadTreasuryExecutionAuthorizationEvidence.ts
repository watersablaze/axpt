import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { createTreasuryExecution } from "../../src/domains/treasury/gateway/executions/createTreasuryExecution";

import { beginTreasuryExecutionValidationDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/beginTreasuryExecutionValidationDurablyWithClient";

import { markTreasuryExecutionReadyForAuthorizationDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/markTreasuryExecutionReadyForAuthorizationDurablyWithClient";

import { authorizeTreasuryExecutionDurablyWithClient } from "../../src/domains/treasury/gateway/executions/application/authorizeTreasuryExecutionDurablyWithClient";

import { persistNewTreasuryExecutionWithClient } from "../../src/domains/treasury/gateway/executions/persistence/persistNewTreasuryExecutionWithClient";

import { loadTreasuryExecutionAuthorizationEvidenceWithClient } from "../../src/domains/treasury/gateway/executions/persistence/loadTreasuryExecutionAuthorizationEvidenceWithClient";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const executionId = `smoke-authorization-evidence-${fixtureId}`;

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

        amount: {
          amount: "25.50",

          currency: "USD",
        },

        purpose: "Authorization evidence smoke test",
      },
    },
  });

  try {
    await prisma.$transaction(async (tx: TransactionClient) =>
      persistNewTreasuryExecutionWithClient({
        result: created,

        eventId: `event-created-${fixtureId}`,

        context: createContext,

        client: tx,
      }),
    );

    await prisma.$transaction(async (tx: TransactionClient) =>
      beginTreasuryExecutionValidationDurablyWithClient({
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
      }),
    );

    await prisma.$transaction(async (tx: TransactionClient) =>
      markTreasuryExecutionReadyForAuthorizationDurablyWithClient({
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
      }),
    );

    const approvalIds = [`approval-a-${fixtureId}`, `approval-b-${fixtureId}`];

    const authorizedAt = new Date(createdAt.getTime() + 180_000);

    const authorized = await prisma.$transaction(
      async (tx: TransactionClient) =>
        authorizeTreasuryExecutionDurablyWithClient({
          command: {
            context: {
              commandId: `command-authorized-${fixtureId}`,

              actorId: `actor-authorized-${fixtureId}`,

              authorityGrantId: `authority-grant-${fixtureId}`,

              correlationId,

              requestedAt: authorizedAt,

              idempotencyKey: `authorized-${fixtureId}`,
            },

            payload: {
              executionId,

              approvalIds,
            },
          },

          eventId: `event-authorized-${fixtureId}`,

          client: tx,
        }),
    );

    const evidence = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTreasuryExecutionAuthorizationEvidenceWithClient({
        executionId,

        executionVersion: authorized.aggregate.metadata.version,

        client: tx,
      }),
    );

    assert(evidence);

    assert.deepEqual(evidence.approvalIds, approvalIds);

    assert(evidence.authorizedAt instanceof Date);

    assert.equal(
      evidence.authorizedAt.toISOString(),
      authorizedAt.toISOString(),
    );

    assert.equal(evidence.aggregateVersion, 4);

    assert.equal(evidence.eventId, `event-authorized-${fixtureId}`);

    console.log(
      "✓ Treasury Gateway authorization evidence load smoke test passed",
    );

    console.log({
      executionId,

      aggregateVersion: evidence.aggregateVersion,

      approvalIds: evidence.approvalIds,

      authorizedAt: evidence.authorizedAt.toISOString(),
    });
  } finally {
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
