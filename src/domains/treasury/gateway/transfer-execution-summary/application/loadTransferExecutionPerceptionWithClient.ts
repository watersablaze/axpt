import type { TransactionClient } from "@prisma/client";

import type { TreasuryTransferId } from "../../shared/identifiers";

import { TREASURY_TRANSFER_STATUS } from "../../transfers/status";

import { loadTreasuryTransferPlanningEvidenceWithClient } from "../../transfers/persistence/loadTreasuryTransferPlanningEvidenceWithClient";

import { loadTreasuryTransferWithClient } from "../../transfers/persistence/loadTreasuryTransferWithClient";

import type { TransferExecutionPerception } from "../perceptionContracts";

import { loadTransferExecutionSummaryWithClient } from "./loadTransferExecutionSummaryWithClient";

export async function loadTransferExecutionPerceptionWithClient(params: {
  transferId: TreasuryTransferId;

  client: TransactionClient;
}): Promise<TransferExecutionPerception | null> {
  const { transferId, client } = params;

  const loadedTransfer = await loadTreasuryTransferWithClient({
    transferId,

    client,
  });

  if (!loadedTransfer) {
    return null;
  }

  const planningEvidence = await loadTreasuryTransferPlanningEvidenceWithClient(
    {
      transferId,

      transferVersion: loadedTransfer.aggregate.metadata.version,

      client,
    },
  );

  if (!planningEvidence) {
    if (loadedTransfer.aggregate.status === TREASURY_TRANSFER_STATUS.PLANNED) {
      throw new Error(
        `[TRANSFER_EXECUTION_PERCEPTION_PLANNED_TRANSFER_EVIDENCE_REQUIRED] ${transferId}`,
      );
    }

    return {
      kind: "PRE_EXECUTION",

      transfer: loadedTransfer.aggregate,
    };
  }

  const summary = await loadTransferExecutionSummaryWithClient({
    transferId,

    client,
  });

  if (!summary) {
    throw new Error(
      `[TRANSFER_EXECUTION_PERCEPTION_SUMMARY_TRANSFER_NOT_FOUND] ${transferId}`,
    );
  }

  return {
    kind: "EXECUTION_SUMMARY",

    summary,
  };
}
