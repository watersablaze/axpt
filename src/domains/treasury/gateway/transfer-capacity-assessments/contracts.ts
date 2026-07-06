import type {
  TransferCapacityAssessmentId,
  TreasuryActorId,
  TreasuryTransferId,
} from "../shared/identifiers";

import type { TreasuryAggregateMetadata } from "../shared/aggregateMetadata";

import type { TreasuryMoney } from "../shared/money";

export const TRANSFER_CAPACITY_CONSTRAINT_TYPE = {
  SOURCE_FUNDS: "SOURCE_FUNDS",

  AUTHORITY: "AUTHORITY",

  COMPLIANCE: "COMPLIANCE",

  CONVERSION: "CONVERSION",

  RAIL: "RAIL",

  COUNTERPARTY: "COUNTERPARTY",

  SETTLEMENT: "SETTLEMENT",

  ESCROW: "ESCROW",

  PROGRAM: "PROGRAM",
} as const;

export type TransferCapacityConstraintType =
  (typeof TRANSFER_CAPACITY_CONSTRAINT_TYPE)[keyof typeof TRANSFER_CAPACITY_CONSTRAINT_TYPE];

export const TRANSFER_CAPACITY_CONSTRAINT_STATUS = {
  APPLICABLE: "APPLICABLE",

  NOT_REQUIRED: "NOT_REQUIRED",

  UNDETERMINED: "UNDETERMINED",
} as const;

export type TransferCapacityConstraintStatus =
  (typeof TRANSFER_CAPACITY_CONSTRAINT_STATUS)[keyof typeof TRANSFER_CAPACITY_CONSTRAINT_STATUS];

export type TransferCapacityConstraint = Readonly<{
  type: TransferCapacityConstraintType;

  status: TransferCapacityConstraintStatus;

  limit?: TreasuryMoney;

  evidenceReferenceIds: readonly string[];

  notes?: string;
}>;

export type TransferCapacityAssessment = Readonly<{
  id: TransferCapacityAssessmentId;

  transferId: TreasuryTransferId;

  requestedAmount: TreasuryMoney;

  constraints: readonly TransferCapacityConstraint[];

  executableNow?: TreasuryMoney;

  assessedByActorId: TreasuryActorId;

  assessedAt: Date;

  notes?: string;

  metadata: TreasuryAggregateMetadata;
}>;
