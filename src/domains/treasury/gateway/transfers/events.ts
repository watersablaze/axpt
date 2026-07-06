import type {
  CommercialProgramId,
  TreasuryInstructionId,
  TreasuryTransferId,
  TransferAuthorityAssessmentId,
} from "../shared/identifiers";

import type { CurrencyCode, TreasuryMoney } from "../shared/money";

import type { TreasuryTransferLocation } from "./contracts";

export type TreasuryTransferCreatedPayload = Readonly<{
  transferId: TreasuryTransferId;

  programId: CommercialProgramId;

  instructionId?: TreasuryInstructionId;

  source: TreasuryTransferLocation;

  destination: TreasuryTransferLocation;

  requestedAmount: TreasuryMoney;

  destinationCurrency: CurrencyCode;

  purpose: string;
}>;

export type TreasuryTransferAuthorityReviewStartedPayload = Readonly<{
  transferId: TreasuryTransferId;
}>;

export type TreasuryTransferAuthorizedPayload = Readonly<{
  transferId: TreasuryTransferId;

  assessmentId: TransferAuthorityAssessmentId;
}>;

export type TreasuryTransferAuthorityClarificationRequiredPayload = Readonly<{
  transferId: TreasuryTransferId;

  assessmentId: TransferAuthorityAssessmentId;
}>;

export type TreasuryTransferRejectedPayload = Readonly<{
  transferId: TreasuryTransferId;

  assessmentId: TransferAuthorityAssessmentId;
}>;
