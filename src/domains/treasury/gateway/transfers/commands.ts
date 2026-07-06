import type {
  CommercialProgramId,
  TreasuryInstructionId,
  TreasuryTransferId,
} from "../shared/identifiers";

import type { TreasuryCommand } from "../shared/commandContext";

import type { CurrencyCode, TreasuryMoney } from "../shared/money";

import type { TreasuryTransferLocation } from "./contracts";

export type CreateTreasuryTransfer = TreasuryCommand<{
  programId: CommercialProgramId;

  instructionId?: TreasuryInstructionId;

  source: TreasuryTransferLocation;

  destination: TreasuryTransferLocation;

  requestedAmount: TreasuryMoney;

  destinationCurrency: CurrencyCode;

  purpose: string;
}>;

export type BeginTreasuryTransferAuthorityReview = TreasuryCommand<{
  transferId: TreasuryTransferId;
}>;
