import type {
  CommercialProgramId,
  ProgramAccountId,
  ProgramCapitalReceiptId,
} from "../shared/identifiers";

import type { TreasuryMoney } from "../shared/money";

import type { CapitalReceiptMethod } from "./contracts";

export type CapitalReceiptReportedPayload = Readonly<{
  receiptId: ProgramCapitalReceiptId;

  programId: CommercialProgramId;

  destinationProgramAccountId: ProgramAccountId;

  declaredAmount: TreasuryMoney;

  receiptMethod: CapitalReceiptMethod;

  externalReference?: string;

  expectedAt?: Date;

  receivedAt?: Date;
}>;

export type CapitalReceiptVerificationStartedPayload = Readonly<{
  receiptId: ProgramCapitalReceiptId;
}>;

export type CapitalReceiptVerifiedPayload = Readonly<{
  receiptId: ProgramCapitalReceiptId;

  verifiedAmount: TreasuryMoney;

  evidenceIds: readonly string[];

  verifiedAt: Date;
}>;

export type ProgramCapitalRecognizedPayload = Readonly<{
  receiptId: ProgramCapitalReceiptId;

  programId: CommercialProgramId;

  destinationProgramAccountId: ProgramAccountId;

  recognizedAmount: TreasuryMoney;

  recognitionMemo?: string;
}>;

export type CapitalReceiptRejectedPayload = Readonly<{
  receiptId: ProgramCapitalReceiptId;

  reason: string;
}>;

export type ProgramCapitalRecognitionReversedPayload = Readonly<{
  receiptId: ProgramCapitalReceiptId;

  reason: string;
}>;
