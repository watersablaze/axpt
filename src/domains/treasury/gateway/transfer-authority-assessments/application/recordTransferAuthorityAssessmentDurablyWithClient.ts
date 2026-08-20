import type { TransactionClient } from "@prisma/client";

import { TREASURY_TRANSFER_STATUS } from "../../transfers/status";

import { loadTreasuryTransferWithClient } from "../../transfers/persistence/loadTreasuryTransferWithClient";

import { recordTransferAuthorityAssessment } from "../recordTransferAuthorityAssessment";

import { persistNewTransferAuthorityAssessmentWithClient } from "../persistence/persistNewTransferAuthorityAssessmentWithClient";

import type { PersistedNewTransferAuthorityAssessment } from "../persistence/contracts";

import type { RecordTransferAuthorityAssessmentDurably } from "./recordTransferAuthorityAssessmentDurablyContracts";

export async function recordTransferAuthorityAssessmentDurablyWithClient(params: {
  request: RecordTransferAuthorityAssessmentDurably;

  client: TransactionClient;
}): Promise<PersistedNewTransferAuthorityAssessment> {
  const { request, client } = params;

  const loadedTransfer = await loadTreasuryTransferWithClient({
    transferId: request.payload.transferId,

    client,
  });

  if (!loadedTransfer) {
    throw new Error(
      `[TREASURY_GATEWAY_TRANSFER_NOT_FOUND] ${request.payload.transferId}`,
    );
  }

  if (
    loadedTransfer.aggregate.status !==
    TREASURY_TRANSFER_STATUS.AUTHORITY_REVIEW
  ) {
    throw new Error(
      `[TRANSFER_AUTHORITY_ASSESSMENT_TRANSFER_STATUS_INVALID] ${loadedTransfer.aggregate.status}`,
    );
  }

  const result = recordTransferAuthorityAssessment({
    assessmentId: request.assessmentId,

    command: {
      context: request.context,

      payload: request.payload,
    },
  });

  return persistNewTransferAuthorityAssessmentWithClient({
    result,

    eventId: request.eventId,

    context: request.context,

    client,
  });
}
