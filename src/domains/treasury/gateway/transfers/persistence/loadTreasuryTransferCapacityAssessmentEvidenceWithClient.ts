import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";
import { TREASURY_EVENT_TYPE } from "../../events/eventType";

import type {
  TransferCapacityAssessmentId,
  TreasuryTransferId,
} from "../../shared/identifiers";

export type LoadedTreasuryTransferCapacityAssessmentEvidence = Readonly<{
  transferId: TreasuryTransferId;
  assessmentId: TransferCapacityAssessmentId;
  eventId: string;
  aggregateVersion: number;
}>;

function requireNonEmptyString(value: unknown, code: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(code);
  }

  return value.trim();
}

export async function loadTreasuryTransferCapacityAssessmentEvidenceWithClient(
  params: {
    transferId: TreasuryTransferId;
    transferVersion: number;
    client: TransactionClient;
  },
): Promise<LoadedTreasuryTransferCapacityAssessmentEvidence | null> {
  const { transferId, transferVersion, client } = params;

  if (!Number.isInteger(transferVersion) || transferVersion <= 0) {
    throw new Error(
      `[TREASURY_GATEWAY_TRANSFER_VERSION_INVALID] ${transferVersion}`,
    );
  }

  const event = await client.treasuryGatewayEvent.findFirst({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_TRANSFER,

      aggregateId: transferId,

      aggregateVersion: {
        lte: transferVersion,
      },

      eventType: TREASURY_EVENT_TYPE.TREASURY_TRANSFER_CAPACITY_ASSESSED,
    },

    orderBy: {
      aggregateVersion: "desc",
    },

    select: {
      eventId: true,
      aggregateVersion: true,
      payload: true,
    },
  });

  if (!event) {
    return null;
  }

  if (
    typeof event.payload !== "object" ||
    event.payload === null ||
    Array.isArray(event.payload)
  ) {
    throw new Error(
      "[TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_EVIDENCE_PAYLOAD_INVALID]",
    );
  }

  const payload = event.payload as Record<string, unknown>;

  const payloadTransferId = requireNonEmptyString(
    payload.transferId,
    "[TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_EVIDENCE_TRANSFER_ID_INVALID]",
  );

  if (payloadTransferId !== transferId) {
    throw new Error(
      `[TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_EVIDENCE_TRANSFER_MISMATCH] ${payloadTransferId} -> ${transferId}`,
    );
  }

  const assessmentId = requireNonEmptyString(
    payload.assessmentId,
    "[TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_EVIDENCE_ASSESSMENT_ID_INVALID]",
  );

  return {
    transferId,
    assessmentId,
    eventId: event.eventId,
    aggregateVersion: event.aggregateVersion,
  };
}
