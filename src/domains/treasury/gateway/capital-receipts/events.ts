import type {
  CommercialProgramId,
  ProgramAccountId,
  ProgramCapitalReceiptId,
  ArtifactId,
  TreasuryActorId,
} from "../shared/identifiers";

import type { TreasuryMoney } from "../shared/money";

import type { CapitalReceiptMethod } from "./contracts";

import type { CapitalReceiptEvidenceType } from "./contracts";

export type CapitalReceiptEvidenceAdmittedPayload = Readonly<{
  receiptId: ProgramCapitalReceiptId;

  evidenceId: string;

  evidenceType: CapitalReceiptEvidenceType;

  artifactId: ArtifactId;

  externalReference?: string;

  submittedByActorId: TreasuryActorId;

  recordedAt: Date;
}>;

export type CapitalReceiptExpectedPayload = Readonly<{
  receiptId: ProgramCapitalReceiptId;

  programId: CommercialProgramId;

  destinationProgramAccountId: ProgramAccountId;

  declaredAmount: TreasuryMoney;

  receiptMethod: CapitalReceiptMethod;

  expectedAt?: Date;
}>;

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
