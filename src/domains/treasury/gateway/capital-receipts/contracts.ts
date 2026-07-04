import type {
  ArtifactId,
  CommercialProgramId,
  ProgramAccountId,
  ProgramCapitalReceiptId,
  TreasuryActorId,
  TreasuryPartyId,
} from "../shared/identifiers";

import type { TreasuryAggregateMetadata } from "../shared/aggregateMetadata";

import type { TreasuryMoney } from "../shared/money";

import type { ProgramCapitalReceiptStatus } from "./status";

export const CAPITAL_RECEIPT_METHOD = {
  BANK_TRANSFER: "BANK_TRANSFER",

  SWIFT_TRANSFER: "SWIFT_TRANSFER",

  ESCROW_FUNDING: "ESCROW_FUNDING",

  DIGITAL_ASSET_TRANSFER: "DIGITAL_ASSET_TRANSFER",

  CUSTODIAL_TRANSFER: "CUSTODIAL_TRANSFER",

  MANUAL_TREASURY_RECORD: "MANUAL_TREASURY_RECORD",

  OTHER: "OTHER",
} as const;

export type CapitalReceiptMethod =
  (typeof CAPITAL_RECEIPT_METHOD)[keyof typeof CAPITAL_RECEIPT_METHOD];

export const CAPITAL_RECEIPT_EVIDENCE_TYPE = {
  BANK_ADVICE: "BANK_ADVICE",

  SWIFT_MESSAGE: "SWIFT_MESSAGE",

  ESCROW_CONFIRMATION: "ESCROW_CONFIRMATION",

  BLOCKCHAIN_TRANSACTION: "BLOCKCHAIN_TRANSACTION",

  CUSTODIAN_STATEMENT: "CUSTODIAN_STATEMENT",

  OPERATOR_CONFIRMATION: "OPERATOR_CONFIRMATION",

  OTHER: "OTHER",
} as const;

export type CapitalReceiptEvidenceType =
  (typeof CAPITAL_RECEIPT_EVIDENCE_TYPE)[keyof typeof CAPITAL_RECEIPT_EVIDENCE_TYPE];

export type ProgramCapitalReceipt = Readonly<{
  id: ProgramCapitalReceiptId;

  reference: string;

  programId: CommercialProgramId;

  destinationProgramAccountId: ProgramAccountId;

  receivedFromPartyId?: TreasuryPartyId;

  declaredAmount: TreasuryMoney;

  verifiedAmount?: TreasuryMoney;

  recognizedAmount?: TreasuryMoney;

  receiptMethod: CapitalReceiptMethod;

  externalReference?: string;

  status: ProgramCapitalReceiptStatus;

  expectedAt?: Date;

  receivedAt?: Date;

  verifiedAt?: Date;

  recognizedAt?: Date;

  metadata: TreasuryAggregateMetadata;
}>;

export type CapitalReceiptEvidence = Readonly<{
  id: string;

  receiptId: ProgramCapitalReceiptId;

  evidenceType: CapitalReceiptEvidenceType;

  artifactId: ArtifactId;

  externalReference?: string;

  submittedByActorId: TreasuryActorId;

  recordedAt: Date;
}>;
