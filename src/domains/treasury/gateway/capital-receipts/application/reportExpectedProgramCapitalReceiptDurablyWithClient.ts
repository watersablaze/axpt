import type { TransactionClient } from "@prisma/client";

import type { ReportExpectedProgramCapitalReceipt } from "../commands";
import type { CapitalReceiptReportedPayload } from "../events";
import { reportExpectedProgramCapitalReceipt } from "../reportExpectedProgramCapitalReceipt";

import type { TreasuryEventId } from "../../shared/identifiers";

import type { PersistedProgramCapitalReceiptTransition } from "../persistence/contracts";

import { executeDurableProgramCapitalReceiptTransitionWithClient } from "./executeDurableProgramCapitalReceiptTransitionWithClient";

export async function reportExpectedProgramCapitalReceiptDurablyWithClient(params: {
  command: ReportExpectedProgramCapitalReceipt;

  eventId: TreasuryEventId;

  client: TransactionClient;
}): Promise<
  PersistedProgramCapitalReceiptTransition<CapitalReceiptReportedPayload>
> {
  const { command, eventId, client } = params;

  return executeDurableProgramCapitalReceiptTransitionWithClient({
    receiptId: command.payload.receiptId,

    eventId,

    context: command.context,

    apply: (aggregate) =>
      reportExpectedProgramCapitalReceipt(aggregate, command),

    client,
  });
}
