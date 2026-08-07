import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { decodeTreasuryTransferPlanningEvidence } from "../../src/domains/treasury/gateway/transfers/persistence/decodeTreasuryTransferPlanningEvidence";

import { loadTreasuryTransferPlanningEvidenceWithClient } from "../../src/domains/treasury/gateway/transfers/persistence/loadTreasuryTransferPlanningEvidenceWithClient";

const prisma = new PrismaClient();

function assertThrowsWithCode(fn: () => unknown, code: string): void {
  assert.throws(
    fn,
    (error: unknown) => error instanceof Error && error.message.includes(code),
  );
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const transferId = `smoke-planning-evidence-transfer-${fixtureId}`;

  const planId = `smoke-planning-evidence-plan-${fixtureId}`;

  const eventId = `smoke-planning-evidence-event-${fixtureId}`;

  const correlationId = `smoke-planning-evidence-correlation-${fixtureId}`;

  try {
    await prisma.treasuryGatewayEvent.create({
      data: {
        eventId,

        aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

        aggregateId: transferId,

        aggregateVersion: 5,

        eventType: TREASURY_EVENT_TYPE.TREASURY_TRANSFER_PLANNED,

        actorId: `smoke-planning-evidence-actor-${fixtureId}`,

        correlationId,

        payload: {
          transferId,

          planId,
        },

        occurredAt: new Date(),
      },
    });

    const loaded = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTreasuryTransferPlanningEvidenceWithClient({
        transferId,

        transferVersion: 5,

        client: tx,
      }),
    );

    assert(loaded);

    assert.equal(loaded.transferId, transferId);

    assert.equal(loaded.planId, planId);

    assert.equal(loaded.eventId, eventId);

    assert.equal(loaded.aggregateVersion, 5);

    const beforePlanningVersion = await prisma.$transaction(
      async (tx: TransactionClient) =>
        loadTreasuryTransferPlanningEvidenceWithClient({
          transferId,

          transferVersion: 4,

          client: tx,
        }),
    );

    assert.equal(beforePlanningVersion, null);

    const missing = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTreasuryTransferPlanningEvidenceWithClient({
        transferId: `missing-transfer-${fixtureId}`,

        transferVersion: 5,

        client: tx,
      }),
    );

    assert.equal(missing, null);

    assertThrowsWithCode(
      () =>
        decodeTreasuryTransferPlanningEvidence({
          payload: {
            transferId: `different-transfer-${fixtureId}`,

            planId,
          },

          eventId,

          aggregateVersion: 5,

          transferId,
        }),

      "TREASURY_GATEWAY_TRANSFER_PLANNING_EVIDENCE_ID_MISMATCH",
    );

    assertThrowsWithCode(
      () =>
        decodeTreasuryTransferPlanningEvidence({
          payload: {
            transferId,
          },

          eventId,

          aggregateVersion: 5,

          transferId,
        }),

      "TREASURY_GATEWAY_TRANSFER_PLANNING_PLAN_ID_INVALID",
    );

    console.log("✓ Treasury Transfer planning evidence load smoke test passed");

    console.log({
      evidence: {
        transferId: loaded.transferId,

        planId: loaded.planId,

        eventId: loaded.eventId,

        aggregateVersion: loaded.aggregateVersion,
      },

      invariants: {
        plannedEventResolved: true,

        exactPlanIdentityRetained: true,

        evidenceRespectsTransferVersion: true,

        missingEvidenceReturnsNull: true,

        transferMismatchRejected: true,

        missingPlanIdentityRejected: true,
      },
    });
  } finally {
    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        OR: [
          {
            eventId,
          },

          {
            aggregateId: transferId,
          },
        ],
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
