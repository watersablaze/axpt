import type { TransactionClient } from "@prisma/client";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type {
  TransferCapacityAssessmentId,
  TreasuryEventId,
  TreasuryTransferId,
} from "../../shared/identifiers";

import { loadTransferCapacityAssessmentWithClient } from "../../transfer-capacity-assessments/persistence/loadTransferCapacityAssessmentWithClient";

import { applyTreasuryTransferCapacityAssessment } from "../applyTreasuryTransferCapacityAssessment";

import type {
  TreasuryTransferCapacityAssessedPayload,
  TreasuryTransferCapacityUndeterminedPayload,
} from "../events";

import type { PersistedTreasuryTransferTransition } from "../persistence/contracts";

import { executeDurableTreasuryTransferTransitionWithClient } from "./executeDurableTreasuryTransferTransitionWithClient";

type TreasuryTransferCapacityOutcomePayload =
  | TreasuryTransferCapacityAssessedPayload
  | TreasuryTransferCapacityUndeterminedPayload;

export async function applyTreasuryTransferCapacityAssessmentDurablyWithClient(params: {
  transferId: TreasuryTransferId;

  assessmentId: TransferCapacityAssessmentId;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  client: TransactionClient;
}): Promise<
  PersistedTreasuryTransferTransition<TreasuryTransferCapacityOutcomePayload>
> {
  const { transferId, assessmentId, eventId, context, client } = params;

  const loadedAssessment = await loadTransferCapacityAssessmentWithClient({
    assessmentId,

    client,
  });

  if (!loadedAssessment) {
    throw new Error(
      `[TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_NOT_FOUND] ${assessmentId}`,
    );
  }

  return executeDurableTreasuryTransferTransitionWithClient({
    transferId,

    eventId,

    context,

    apply: (aggregate) =>
      applyTreasuryTransferCapacityAssessment(
        aggregate,

        loadedAssessment.aggregate,

        {
          context,

          payload: {
            transferId,

            assessmentId,
          },
        },
      ),

    client,
  });
}
