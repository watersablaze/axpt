import type { TransactionClient } from "@prisma/client";

import { getAvailableCapitalPositionWithClient } from "../../capital-position/application/getAvailableCapitalPositionWithClient";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../../transfers/contracts";

import { loadTreasuryTransferWithClient } from "../../transfers/persistence/loadTreasuryTransferWithClient";

import { deriveCanonicalTransferCapacityConstraints } from "../deriveCanonicalTransferCapacityConstraints";

import type { RecordTransferCapacityAssessmentDurably } from "./recordTransferCapacityAssessmentDurablyContracts";

export async function prepareCanonicalTransferCapacityAssessmentRequestWithClient(
  params: {
    request: RecordTransferCapacityAssessmentDurably;

    client: TransactionClient;
  },
): Promise<RecordTransferCapacityAssessmentDurably> {
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

  const transfer = loadedTransfer.aggregate;

  if (
    transfer.source.kind !==
    TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT
  ) {
    throw new Error(
      `[TRANSFER_CAPACITY_SOURCE_FUNDS_PROGRAM_ACCOUNT_SOURCE_REQUIRED] ${transfer.source.kind}`,
    );
  }

  const availableCapitalPosition =
    await getAvailableCapitalPositionWithClient({
      programAccountId:
        transfer.source.programAccountId,

      currency:
        transfer.requestedAmount.currency,

      client,
    });

  const constraints =
    deriveCanonicalTransferCapacityConstraints({
      transfer,

      submittedConstraints:
        request.payload.constraints,

      availableCapitalPosition,
    });

  return {
    ...request,

    payload: {
      ...request.payload,

      constraints,
    },
  };
}
