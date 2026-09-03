import type {
  CommercialProgramId,
  ProgramAccountId,
  ProgramCapitalReceiptId,
  TreasuryPartyId,
  ArtifactId,
} from "../shared/identifiers";

import type { TreasuryCommand } from "../shared/commandContext";

import type { TreasuryMoney } from "../shared/money";

import type {
  CapitalReceiptEvidenceType,
  CapitalReceiptMethod,
} from "./contracts";

export type AdmitProgramCapitalReceiptEvidence = TreasuryCommand<{
  receiptId: ProgramCapitalReceiptId;

  evidenceId: string;

  evidenceType: CapitalReceiptEvidenceType;

  artifactId: ArtifactId;

  externalReference?: string;

  recordedAt: Date;
}>;

export type ReportProgramCapitalReceipt = TreasuryCommand<{
  programId: CommercialProgramId;

  destinationProgramAccountId: ProgramAccountId;

  receivedFromPartyId?: TreasuryPartyId;

  declaredAmount: TreasuryMoney;

  receiptMethod: CapitalReceiptMethod;

  externalReference?: string;

  expectedAt?: Date;

  receivedAt?: Date;
}>;

export type BeginProgramCapitalReceiptVerification = TreasuryCommand<{
  receiptId: ProgramCapitalReceiptId;
}>;

export type VerifyProgramCapitalReceipt = TreasuryCommand<{
  receiptId: ProgramCapitalReceiptId;

  verifiedAmount: TreasuryMoney;

  evidenceIds: string[];

  verifiedAt: Date;
}>;

export type RecognizeProgramCapital = TreasuryCommand<{
  receiptId: ProgramCapitalReceiptId;

  recognizedAmount: TreasuryMoney;

  recognitionMemo?: string;
}>;

export type RejectProgramCapitalReceipt = TreasuryCommand<{
  receiptId: ProgramCapitalReceiptId;

  reason: string;
}>;

export type ReverseRecognizedProgramCapital = TreasuryCommand<{
  receiptId: ProgramCapitalReceiptId;

  reason: string;
}>;
