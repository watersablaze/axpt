import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import type { TransferCapacityAssessmentId } from "../../shared/identifiers";

import { decodeTransferCapacityAssessmentSnapshot } from "./decodeTransferCapacityAssessmentSnapshot";

import type { LoadedTransferCapacityAssessment } from "./contracts";

function capacityPosture(executableNow: unknown): string {
  return executableNow === undefined ? "UNDETERMINED" : "DETERMINATE";
}

export async function loadTransferCapacityAssessmentWithClient(params: {
  assessmentId: TransferCapacityAssessmentId;

  client: TransactionClient;
}): Promise<LoadedTransferCapacityAssessment | null> {
  const { assessmentId, client } = params;

  const row = await client.treasuryGatewayAggregate.findUnique({
    where: {
      aggregateType_aggregateId: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_CAPACITY_ASSESSMENT,

        aggregateId: assessmentId,
      },
    },
  });

  if (!row) {
    return null;
  }

  const aggregate = decodeTransferCapacityAssessmentSnapshot(row.snapshot);

  if (aggregate.id !== row.aggregateId) {
    throw new Error(
      `[TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_SNAPSHOT_ID_MISMATCH] ${aggregate.id} -> ${row.aggregateId}`,
    );
  }

  if (aggregate.metadata.version !== row.version) {
    throw new Error(
      `[TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_SNAPSHOT_VERSION_MISMATCH] ${aggregate.metadata.version} -> ${row.version}`,
    );
  }

  const expectedPosture = capacityPosture(aggregate.executableNow);

  if (expectedPosture !== row.status) {
    throw new Error(
      `[TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_SNAPSHOT_POSTURE_MISMATCH] ${expectedPosture} -> ${row.status}`,
    );
  }

  return {
    aggregate,

    loadedAt: new Date(),
  };
}
