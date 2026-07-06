import type {
  CommercialProgramId,
  ProgramAccountId,
  SettlementEndpointId,
  TreasuryInstructionId,
  TreasuryPartyId,
  TreasuryTransferId,
} from "../shared/identifiers";

import type { TreasuryAggregateMetadata } from "../shared/aggregateMetadata";

import type { CurrencyCode, TreasuryMoney } from "../shared/money";

import type { TreasuryTransferStatus } from "./status";

export const TREASURY_TRANSFER_LOCATION_KIND = {
  PROGRAM_ACCOUNT: "PROGRAM_ACCOUNT",

  TREASURY_PARTY: "TREASURY_PARTY",

  SETTLEMENT_ENDPOINT: "SETTLEMENT_ENDPOINT",

  EXTERNAL_REFERENCE: "EXTERNAL_REFERENCE",

  OTHER: "OTHER",
} as const;

export type TreasuryTransferLocation =
  | Readonly<{
      kind: typeof TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT;
      programAccountId: ProgramAccountId;
    }>
  | Readonly<{
      kind: typeof TREASURY_TRANSFER_LOCATION_KIND.TREASURY_PARTY;
      treasuryPartyId: TreasuryPartyId;
    }>
  | Readonly<{
      kind: typeof TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT;
      settlementEndpointId: SettlementEndpointId;
    }>
  | Readonly<{
      kind: typeof TREASURY_TRANSFER_LOCATION_KIND.EXTERNAL_REFERENCE;
      externalReference: string;
    }>
  | Readonly<{
      kind: typeof TREASURY_TRANSFER_LOCATION_KIND.OTHER;
      reference: string;
    }>;

export type TreasuryTransfer = Readonly<{
  id: TreasuryTransferId;

  reference: string;

  programId: CommercialProgramId;

  instructionId?: TreasuryInstructionId;

  source: TreasuryTransferLocation;

  destination: TreasuryTransferLocation;

  requestedAmount: TreasuryMoney;

  destinationCurrency: CurrencyCode;

  purpose: string;

  status: TreasuryTransferStatus;

  metadata: TreasuryAggregateMetadata;
}>;
