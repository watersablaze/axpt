import type { TransactionClient } from "@prisma/client";
import type { VerifyProgramCapitalReceipt } from "../commands";
import type { CapitalReceiptVerifiedPayload } from "../events";
import { verifyProgramCapitalReceipt } from "../verifyProgramCapitalReceipt";
import type { TreasuryEventId } from "../../shared/identifiers";
import { loadProgramCapitalReceiptWithClient } from "../persistence/loadProgramCapitalReceiptWithClient";
import { loadCapitalReceiptEvidenceWithClient } from "../persistence/loadCapitalReceiptEvidenceWithClient";
import type { PersistedProgramCapitalReceiptTransition } from "../persistence/contracts";
import { executeDurableProgramCapitalReceiptTransitionWithClient } from "./executeDurableProgramCapitalReceiptTransitionWithClient";

export async function verifyProgramCapitalReceiptDurablyWithClient(params: {
  command: VerifyProgramCapitalReceipt;
  eventId: TreasuryEventId;
  client: TransactionClient;
}): Promise<
  PersistedProgramCapitalReceiptTransition<CapitalReceiptVerifiedPayload>
> {
  const { command, eventId, client } = params;

  const receiptId = command.payload.receiptId;

  const loaded = await loadProgramCapitalReceiptWithClient({
    receiptId,
    client,
  });

  if (!loaded) {
    throw new Error(
      `[TREASURY_GATEWAY_CAPITAL_RECEIPT_NOT_FOUND] ${receiptId}`,
    );
  }

  const admittedEvidence = await loadCapitalReceiptEvidenceWithClient({
    receiptId,
    receiptVersion: loaded.aggregate.metadata.version,
    client,
  });

  const admittedEvidenceIds = new Set(
    admittedEvidence.map((evidence) => evidence.id),
  );

  for (const evidenceId of command.payload.evidenceIds) {
    if (!admittedEvidenceIds.has(evidenceId)) {
      throw new Error(
        `[TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_EVIDENCE_NOT_ADMITTED] ${receiptId}:${evidenceId}`,
      );
    }
  }

  return executeDurableProgramCapitalReceiptTransitionWithClient({
    receiptId,

    eventId,

    context: command.context,

    apply: (aggregate) => verifyProgramCapitalReceipt(aggregate, command),

    client,
  });
}
