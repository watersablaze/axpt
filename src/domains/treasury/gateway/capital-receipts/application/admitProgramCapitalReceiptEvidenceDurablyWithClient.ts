import type { TransactionClient } from "@prisma/client";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type {
  ArtifactId,
  ProgramCapitalReceiptId,
  TreasuryEventId,
} from "../../shared/identifiers";

import { admitProgramCapitalReceiptEvidence } from "../admitProgramCapitalReceiptEvidence";

import type { CapitalReceiptEvidenceType } from "../contracts";

import type { CapitalReceiptEvidenceAdmittedPayload } from "../events";

import { loadProgramCapitalReceiptWithClient } from "../persistence/loadProgramCapitalReceiptWithClient";

import { loadCapitalReceiptEvidenceWithClient } from "../persistence/loadCapitalReceiptEvidenceWithClient";

import type { PersistedProgramCapitalReceiptTransition } from "../persistence/contracts";

import { executeDurableProgramCapitalReceiptTransitionWithClient } from "./executeDurableProgramCapitalReceiptTransitionWithClient";

export async function admitProgramCapitalReceiptEvidenceDurablyWithClient(params: {
  receiptId: ProgramCapitalReceiptId;

  evidenceId: string;

  evidenceType: CapitalReceiptEvidenceType;

  artifactId: ArtifactId;

  externalReference?: string;

  recordedAt: Date;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  client: TransactionClient;
}): Promise<
  PersistedProgramCapitalReceiptTransition<CapitalReceiptEvidenceAdmittedPayload>
> {
  const {
    receiptId,
    evidenceId,
    evidenceType,
    artifactId,
    externalReference,
    recordedAt,
    eventId,
    context,
    client,
  } = params;

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

  if (admittedEvidence.some((evidence) => evidence.id === evidenceId)) {
    throw new Error(
      `[TREASURY_GATEWAY_CAPITAL_RECEIPT_EVIDENCE_ID_ALREADY_ADMITTED] ${receiptId}:${evidenceId}`,
    );
  }

  return executeDurableProgramCapitalReceiptTransitionWithClient({
    receiptId,

    eventId,

    context,

    client,

    apply: (aggregate) =>
      admitProgramCapitalReceiptEvidence(aggregate, {
        context,

        payload: {
          receiptId,

          evidenceId,

          evidenceType,

          artifactId,

          externalReference,

          recordedAt,
        },
      }),
  });
}
