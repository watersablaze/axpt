import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient, type TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import { TRANSFER_AUTHORITY_ASSESSMENT_RESULT } from "../../src/domains/treasury/gateway/transfer-authority-assessments/contracts";

import { recordTransferAuthorityAssessment } from "../../src/domains/treasury/gateway/transfer-authority-assessments/recordTransferAuthorityAssessment";

import { loadTransferAuthorityAssessmentWithClient } from "../../src/domains/treasury/gateway/transfer-authority-assessments/persistence/loadTransferAuthorityAssessmentWithClient";

import { persistNewTransferAuthorityAssessmentWithClient } from "../../src/domains/treasury/gateway/transfer-authority-assessments/persistence/persistNewTransferAuthorityAssessmentWithClient";

const prisma = new PrismaClient();

function assertErrorCode(error: unknown, code: string): void {
  assert(error instanceof Error);

  assert(
    error.message.includes(code),
    `Expected ${code}, received ${error.message}`,
  );
}

async function main(): Promise<void> {
  const fixtureId = randomUUID();

  const assessmentId = `smoke-authority-assessment-${fixtureId}`;

  const transferId = `smoke-authority-transfer-${fixtureId}`;

  const eventId = `smoke-authority-assessment-event-${fixtureId}`;

  const actorId = `smoke-authority-assessor-${fixtureId}`;

  const instructionId = `smoke-authority-instruction-${fixtureId}`;

  const authorityGrantId = `smoke-authority-grant-${fixtureId}`;

  const evidenceArtifactIds = [
    `smoke-authority-artifact-001-${fixtureId}`,
    `smoke-authority-artifact-002-${fixtureId}`,
  ] as const;

  const requestedAt = new Date("2026-08-19T17:30:00.000Z");

  const assessedAt = new Date("2026-08-19T17:29:30.000Z");

  const context = {
    commandId: `smoke-authority-command-${fixtureId}`,

    actorId,

    authorityGrantId,

    correlationId: `smoke-authority-correlation-${fixtureId}`,

    requestedAt,

    idempotencyKey: `smoke-authority-record-${fixtureId}`,
  };

  const recorded = recordTransferAuthorityAssessment({
    assessmentId,

    command: {
      context,

      payload: {
        transferId,

        result: TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,

        instructionId,

        authorityGrantId,

        evidenceArtifactIds,

        assessedAt,

        notes: "Authority verified against referenced Treasury evidence.",
      },
    },
  });

  try {
    const persisted = await prisma.$transaction(async (tx: TransactionClient) =>
      persistNewTransferAuthorityAssessmentWithClient({
        result: recorded,

        eventId,

        context,

        client: tx,
      }),
    );

    assert.equal(persisted.aggregate.id, assessmentId);

    assert.equal(persisted.aggregate.metadata.version, 1);

    assert.equal(
      persisted.aggregate.result,
      TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,
    );

    assert.equal(
      persisted.event.eventType,
      TREASURY_EVENT_TYPE.TRANSFER_AUTHORITY_ASSESSMENT_RECORDED,
    );

    assert.equal(persisted.event.aggregateVersion, 1);

    const loaded = await prisma.$transaction(async (tx: TransactionClient) =>
      loadTransferAuthorityAssessmentWithClient({
        assessmentId,

        client: tx,
      }),
    );

    assert(loaded);

    assert.equal(loaded.aggregate.id, assessmentId);

    assert.equal(loaded.aggregate.transferId, transferId);

    assert.equal(
      loaded.aggregate.result,
      TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED,
    );

    assert.equal(loaded.aggregate.instructionId, instructionId);

    assert.equal(loaded.aggregate.authorityGrantId, authorityGrantId);

    assert.deepEqual(loaded.aggregate.evidenceArtifactIds, evidenceArtifactIds);

    assert.equal(loaded.aggregate.assessedByActorId, actorId);

    assert.equal(loaded.aggregate.assessedAt.getTime(), assessedAt.getTime());

    assert.equal(
      loaded.aggregate.notes,
      "Authority verified against referenced Treasury evidence.",
    );

    assert.equal(
      loaded.aggregate.metadata.createdAt.getTime(),
      requestedAt.getTime(),
    );

    assert.equal(
      loaded.aggregate.metadata.updatedAt.getTime(),
      requestedAt.getTime(),
    );

    const row = await prisma.treasuryGatewayAggregate.findUnique({
      where: {
        aggregateType_aggregateId: {
          aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

          aggregateId: assessmentId,
        },
      },
    });

    assert(row);

    assert.equal(row.status, TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED);

    let duplicateError: unknown;

    try {
      await prisma.$transaction(async (tx: TransactionClient) =>
        persistNewTransferAuthorityAssessmentWithClient({
          result: recorded,

          eventId: `smoke-authority-assessment-duplicate-event-${fixtureId}`,

          context: {
            ...context,

            commandId: `smoke-authority-duplicate-command-${fixtureId}`,

            idempotencyKey: `smoke-authority-duplicate-${fixtureId}`,
          },

          client: tx,
        }),
      );
    } catch (error: unknown) {
      duplicateError = error;
    }

    assertErrorCode(
      duplicateError,
      "TREASURY_GATEWAY_AGGREGATE_ALREADY_EXISTS",
    );

    const eventCount = await prisma.treasuryGatewayEvent.count({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

        aggregateId: assessmentId,
      },
    });

    assert.equal(eventCount, 1);

    console.log("✓ Transfer Authority Assessment durability smoke test passed");

    console.log({
      assessment: {
        id: loaded.aggregate.id,

        transferId: loaded.aggregate.transferId,

        result: loaded.aggregate.result,

        version: loaded.aggregate.metadata.version,
      },

      evidence: {
        artifactCount: loaded.aggregate.evidenceArtifactIds.length,

        instructionRetained: loaded.aggregate.instructionId === instructionId,

        authorityGrantRetained:
          loaded.aggregate.authorityGrantId === authorityGrantId,

        assessorRetained: loaded.aggregate.assessedByActorId === actorId,
      },

      invariants: {
        assessmentRecordedAtVersionOne: true,

        assessmentAggregatePersisted: true,

        recordedEventPersisted: true,

        resultIndexedAsAggregatePosture: true,

        evidenceArtifactIdentitiesRetained: true,

        assessorIdentityRetained: true,

        authorityGrantIdentityRetained: true,

        instructionIdentityRetained: true,

        assessmentTimestampRetained: true,

        notesRetained: true,

        durableReloadReconstructsFinding: true,

        duplicateAssessmentRejected: true,

        failedDuplicateAppendsNoEvent: true,
      },
    });
  } finally {
    await prisma.treasuryGatewayEvent.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

        aggregateId: assessmentId,
      },
    });

    await prisma.treasuryGatewayAggregate.deleteMany({
      where: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

        aggregateId: assessmentId,
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
