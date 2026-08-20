import type { TransactionClient } from "@prisma/client";

import { loadTransferAuthorityAssessmentWithClient } from "../../transfer-authority-assessments/persistence/loadTransferAuthorityAssessmentWithClient";

import { applyTreasuryTransferAuthorityAssessment } from "../applyTreasuryTransferAuthorityAssessment";

import type {
  TransferAuthorityAssessmentId,
  TreasuryEventId,
  TreasuryTransferId,
} from "../../shared/identifiers";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type {
  TreasuryTransferAuthorizedPayload,
  TreasuryTransferAuthorityClarificationRequiredPayload,
  TreasuryTransferRejectedPayload,
} from "../events";

import type { PersistedTreasuryTransferTransition } from "../persistence/contracts";

import { executeDurableTreasuryTransferTransitionWithClient } from "./executeDurableTreasuryTransferTransitionWithClient";

type TreasuryTransferAuthorityOutcomePayload =
  | TreasuryTransferAuthorizedPayload
  | TreasuryTransferAuthorityClarificationRequiredPayload
  | TreasuryTransferRejectedPayload;

export async function applyTreasuryTransferAuthorityAssessmentDurablyWithClient(params: {
  transferId: TreasuryTransferId;

  assessmentId: TransferAuthorityAssessmentId;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  client: TransactionClient;
}): Promise<
  PersistedTreasuryTransferTransition<TreasuryTransferAuthorityOutcomePayload>
> {
  const { transferId, assessmentId, eventId, context, client } = params;

  const loadedAssessment = await loadTransferAuthorityAssessmentWithClient({
    assessmentId,

    client,
  });

  if (!loadedAssessment) {
    throw new Error(
      `[TREASURY_GATEWAY_TRANSFER_AUTHORITY_ASSESSMENT_NOT_FOUND] ${assessmentId}`,
    );
  }

  return executeDurableTreasuryTransferTransitionWithClient({
    transferId,

    eventId,

    context,

    apply: (aggregate) =>
      applyTreasuryTransferAuthorityAssessment(
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
