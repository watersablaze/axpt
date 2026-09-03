import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../events/eventType";

import type { ProgramCapitalReceiptId } from "../../shared/identifiers";

import type { CapitalReceiptEvidence } from "../contracts";

import { decodeCapitalReceiptEvidence } from "./decodeCapitalReceiptEvidence";

export async function loadCapitalReceiptEvidenceWithClient(params: {
  receiptId: ProgramCapitalReceiptId;

  receiptVersion: number;

  client: TransactionClient;
}): Promise<readonly CapitalReceiptEvidence[]> {
  const { receiptId, receiptVersion, client } = params;

  if (!Number.isInteger(receiptVersion) || receiptVersion <= 0) {
    throw new Error(
      `[TREASURY_GATEWAY_CAPITAL_RECEIPT_VERSION_INVALID] ${receiptVersion}`,
    );
  }

  const events: Array<{
    payload: unknown;
  }> = await client.treasuryGatewayEvent.findMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

      aggregateId: receiptId,

      aggregateVersion: {
        lte: receiptVersion,
      },

      eventType: TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_EVIDENCE_ADMITTED,
    },

    orderBy: {
      aggregateVersion: "asc",
    },

    select: {
      payload: true,
    },
  });

  return events.map((event) =>
    decodeCapitalReceiptEvidence({
      payload: event.payload,

      receiptId,
    }),
  );
}
