import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import type { TransferAuthorityAssessmentId } from "../../shared/identifiers";

import { decodeTransferAuthorityAssessmentSnapshot } from "./decodeTransferAuthorityAssessmentSnapshot";

import type { LoadedTransferAuthorityAssessment } from "./contracts";

export async function loadTransferAuthorityAssessmentWithClient(params: {
  assessmentId: TransferAuthorityAssessmentId;

  client: TransactionClient;
}): Promise<LoadedTransferAuthorityAssessment | null> {
  const { assessmentId, client } = params;

  const row = await client.treasuryGatewayAggregate.findUnique({
    where: {
      aggregateType_aggregateId: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_AUTHORITY_ASSESSMENT,

        aggregateId: assessmentId,
      },
    },
  });

  if (!row) {
    return null;
  }

  const aggregate = decodeTransferAuthorityAssessmentSnapshot(row.snapshot);

  if (aggregate.id !== row.aggregateId) {
    throw new Error(
      `[TREASURY_GATEWAY_TRANSFER_AUTHORITY_ASSESSMENT_SNAPSHOT_ID_MISMATCH] ${aggregate.id} -> ${row.aggregateId}`,
    );
  }

  if (aggregate.metadata.version !== row.version) {
    throw new Error(
      `[TREASURY_GATEWAY_TRANSFER_AUTHORITY_ASSESSMENT_SNAPSHOT_VERSION_MISMATCH] ${aggregate.metadata.version} -> ${row.version}`,
    );
  }

  if (aggregate.result !== row.status) {
    throw new Error(
      `[TREASURY_GATEWAY_TRANSFER_AUTHORITY_ASSESSMENT_SNAPSHOT_RESULT_MISMATCH] ${aggregate.result} -> ${row.status}`,
    );
  }

  return {
    aggregate,

    loadedAt: new Date(),
  };
}
