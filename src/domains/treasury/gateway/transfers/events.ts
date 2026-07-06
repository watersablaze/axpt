import type {
  CommercialProgramId,
  TreasuryInstructionId,
  TreasuryTransferId,
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
