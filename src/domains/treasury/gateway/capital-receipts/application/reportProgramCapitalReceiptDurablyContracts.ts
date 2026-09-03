import type { ReportProgramCapitalReceipt } from "../commands";

import type {
  ProgramCapitalReceiptId,
  TreasuryEventId,
} from "../../shared/identifiers";

import type { TreasuryCommandContext } from "../../shared/commandContext";

export type ReportProgramCapitalReceiptDurably = Readonly<{
  receiptId: ProgramCapitalReceiptId;

  reference: string;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  payload: ReportProgramCapitalReceipt["payload"];
}>;
