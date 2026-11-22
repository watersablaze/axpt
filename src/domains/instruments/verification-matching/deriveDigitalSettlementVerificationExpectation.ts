import {
  getAddress,
  parseUnits,
} from "viem";

import {
  TOKENS,
} from "@/lib/treasury/config";

import {
  DIGITAL_SETTLEMENT_STATUS,
  INSTITUTIONAL_INSTRUMENT_STATUS,
} from "@/domains/instruments/contracts";

import type {
  DigitalSettlementVerificationExpectation,
} from "./contracts";

export function deriveDigitalSettlementVerificationExpectation(
  params: {
    instrument: Readonly<{
      id: string;

      reference: string;

      status: string;
    }>;

    settlement: Readonly<{
      id: string;

      settlementAsset:
        string;

      settlementNetwork:
        string;

      receivingAddress:
        string | null;

      verificationAmountUsdt: {
        toString(): string;
      };

      settlementStatus:
        string;
    }>;
  },
): DigitalSettlementVerificationExpectation {
  const {
    instrument,
    settlement,
  } = params;

  if (
    instrument.status !==
    INSTITUTIONAL_INSTRUMENT_STATUS.ISSUED
  ) {
    throw new Error(
      `[DSI_VERIFICATION_MATCH_INSTRUMENT_NOT_ISSUED] ${instrument.status}`,
    );
  }

  if (
    settlement.settlementStatus !==
    DIGITAL_SETTLEMENT_STATUS.AWAITING_VERIFICATION_TRANSFER
  ) {
    throw new Error(
      `[DSI_VERIFICATION_MATCH_STATE_INVALID] ${settlement.settlementStatus}`,
    );
  }

  if (
    settlement.settlementAsset !==
    "USDT"
  ) {
    throw new Error(
      `[DSI_VERIFICATION_MATCH_ASSET_INVALID] ${settlement.settlementAsset}`,
    );
  }

  if (
    settlement.settlementNetwork !==
    "ETHEREUM_ERC20"
  ) {
    throw new Error(
      `[DSI_VERIFICATION_MATCH_NETWORK_INVALID] ${settlement.settlementNetwork}`,
    );
  }

  if (
    !settlement.receivingAddress
  ) {
    throw new Error(
      "[DSI_VERIFICATION_MATCH_RECEIVING_ADDRESS_REQUIRED]",
    );
  }

  const receivingAddress =
    getAddress(
      settlement.receivingAddress,
    );

  const amountUsdt =
    settlement
      .verificationAmountUsdt
      .toString();

  const amountBaseUnits =
    parseUnits(
      amountUsdt,
      TOKENS.USDT.decimals,
    );

  if (
    amountBaseUnits <= 0n
  ) {
    throw new Error(
      `[DSI_VERIFICATION_MATCH_AMOUNT_INVALID] ${amountUsdt}`,
    );
  }

  return {
    instrumentId:
      instrument.id,

    instrumentReference:
      instrument.reference,

    settlementInstructionId:
      settlement.id,

    chainId:
      1,

    network:
      "ETHEREUM_ERC20",

    asset:
      "USDT",

    tokenContractAddress:
      TOKENS.USDT.address
        .toLowerCase(),

    receivingAddress:
      receivingAddress
        .toLowerCase(),

    amountBaseUnits,

    amountUsdt,
  };
}
