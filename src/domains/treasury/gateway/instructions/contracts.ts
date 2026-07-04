import type {
  ArtifactId,
  CommercialProgramId,
  TreasuryActorId,
  TreasuryInstructionId,
} from "../shared/identifiers";

import type { TreasuryAggregateMetadata } from "../shared/aggregateMetadata";

import type { TreasuryMoney } from "../shared/money";

import type { TreasuryInstructionStatus } from "./status";

export const TREASURY_INSTRUCTION_TYPE = {
  ALLOCATE_CAPITAL: "ALLOCATE_CAPITAL",

  ESTABLISH_RESERVE: "ESTABLISH_RESERVE",

  RELEASE_RESERVE: "RELEASE_RESERVE",

  CREATE_DISTRIBUTION: "CREATE_DISTRIBUTION",

  AMEND_DISTRIBUTION: "AMEND_DISTRIBUTION",

  CANCEL_DISTRIBUTION: "CANCEL_DISTRIBUTION",

  TRANSFER_BETWEEN_PROGRAM_ACCOUNTS: "TRANSFER_BETWEEN_PROGRAM_ACCOUNTS",

  RETURN_CAPITAL: "RETURN_CAPITAL",

  APPLY_PROGRAM_FEE: "APPLY_PROGRAM_FEE",

  OTHER: "OTHER",
} as const;

export type TreasuryInstructionType =
  (typeof TREASURY_INSTRUCTION_TYPE)[keyof typeof TREASURY_INSTRUCTION_TYPE];

export const INSTRUCTION_AUTHENTICATION_METHOD = {
  SIGNED_DOCUMENT: "SIGNED_DOCUMENT",

  AUTHENTICATED_PORTAL: "AUTHENTICATED_PORTAL",

  KNOWN_COUNTERPARTY_CHANNEL: "KNOWN_COUNTERPARTY_CHANNEL",

  MULTI_PARTY_CONFIRMATION: "MULTI_PARTY_CONFIRMATION",

  MANUAL_OPERATOR_VERIFICATION: "MANUAL_OPERATOR_VERIFICATION",

  DIGITAL_SIGNATURE: "DIGITAL_SIGNATURE",

  API_CREDENTIAL: "API_CREDENTIAL",
} as const;

export type InstructionAuthenticationMethod =
  (typeof INSTRUCTION_AUTHENTICATION_METHOD)[keyof typeof INSTRUCTION_AUTHENTICATION_METHOD];

export const INSTRUCTION_AUTHENTICATION_RESULT = {
  AUTHENTICATED: "AUTHENTICATED",

  FAILED: "FAILED",

  INCONCLUSIVE: "INCONCLUSIVE",
} as const;

export type InstructionAuthenticationResult =
  (typeof INSTRUCTION_AUTHENTICATION_RESULT)[keyof typeof INSTRUCTION_AUTHENTICATION_RESULT];

export type TreasuryInstruction = Readonly<{
  id: TreasuryInstructionId;

  reference: string;

  programId: CommercialProgramId;

  instructionType: TreasuryInstructionType;

  submittedByActorId: TreasuryActorId;

  requestedAmount?: TreasuryMoney;

  purpose: string;

  effectiveDate?: Date;

  expiryDate?: Date;

  status: TreasuryInstructionStatus;

  authenticatedAt?: Date;

  approvedAt?: Date;

  fulfilledAt?: Date;

  metadata: TreasuryAggregateMetadata;
}>;

export type InstructionAuthentication = Readonly<{
  id: string;

  instructionId: TreasuryInstructionId;

  authenticationMethod: InstructionAuthenticationMethod;

  authenticatedActorId?: TreasuryActorId;

  authenticatedByActorId: TreasuryActorId;

  evidenceArtifactId?: ArtifactId;

  result: InstructionAuthenticationResult;

  notes?: string;

  authenticatedAt: Date;
}>;
