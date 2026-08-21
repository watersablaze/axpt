import type { TransactionClient } from "@prisma/client";

import { compareDecimals } from "../../shared/decimalAmount";

import { loadTreasuryTransferWithClient } from "../../transfers/persistence/loadTreasuryTransferWithClient";

import { TREASURY_TRANSFER_STATUS } from "../../transfers/status";

import { recordTransferCapacityAssessment } from "../recordTransferCapacityAssessment";

import { persistNewTransferCapacityAssessmentWithClient } from "../persistence/persistNewTransferCapacityAssessmentWithClient";

import type { PersistedNewTransferCapacityAssessment } from "../persistence/contracts";

import type { RecordTransferCapacityAssessmentDurably } from "./recordTransferCapacityAssessmentDurablyContracts";

export async function recordTransferCapacityAssessmentDurablyWithClient(params: {
  request: RecordTransferCapacityAssessmentDurably;

  client: TransactionClient;
}): Promise<PersistedNewTransferCapacityAssessment> {
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

  if (loadedTransfer.aggregate.status !== TREASURY_TRANSFER_STATUS.AUTHORIZED) {
    throw new Error(
      `[TRANSFER_CAPACITY_ASSESSMENT_TRANSFER_STATUS_INVALID] ${loadedTransfer.aggregate.status}`,
    );
  }

  const canonicalRequestedAmount = loadedTransfer.aggregate.requestedAmount;

  const assessmentRequestedAmount = request.payload.requestedAmount;

  if (
    canonicalRequestedAmount.currency !== assessmentRequestedAmount.currency
  ) {
    throw new Error(
      `[TRANSFER_CAPACITY_ASSESSMENT_REQUESTED_AMOUNT_CURRENCY_MISMATCH] ${assessmentRequestedAmount.currency} -> ${canonicalRequestedAmount.currency}`,
    );
  }

  if (
    compareDecimals(
      assessmentRequestedAmount.amount,
      canonicalRequestedAmount.amount,
    ) !== 0
  ) {
    throw new Error(
      `[TRANSFER_CAPACITY_ASSESSMENT_REQUESTED_AMOUNT_MISMATCH] ${assessmentRequestedAmount.amount} -> ${canonicalRequestedAmount.amount}`,
    );
  }

  const result = recordTransferCapacityAssessment({
    assessmentId: request.assessmentId,

    command: {
      context: request.context,

      payload: request.payload,
    },
  });

  return persistNewTransferCapacityAssessmentWithClient({
    result,

    eventId: request.eventId,

    context: request.context,

    client,
  });
}
