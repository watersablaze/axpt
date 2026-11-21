import {
  getAddress,
  parseUnits,
} from "viem";

import {
  TOKENS,
} from "@/lib/treasury/config";

export type DigitalSettlementVerificationSignature =
  Readonly<{
    settlementAsset:
      string;

    settlementNetwork:
      string;

    receivingAddress:
      string | null;

    verificationAmountUsdt: {
      toString(): string;
    };
  }>;

export function digitalSettlementVerificationSignaturesMatch(
  left:
    DigitalSettlementVerificationSignature,

  right:
    DigitalSettlementVerificationSignature,
): boolean {
  if (
    left.settlementAsset !==
      "USDT" ||
    right.settlementAsset !==
      "USDT"
  ) {
    return false;
  }

  if (
    left.settlementNetwork !==
      "ETHEREUM_ERC20" ||
    right.settlementNetwork !==
      "ETHEREUM_ERC20"
  ) {
    return false;
  }

  if (
    !left.receivingAddress ||
    !right.receivingAddress
  ) {
    return false;
  }

  let leftAddress: string;
  let rightAddress: string;

  try {
    leftAddress =
      getAddress(
        left.receivingAddress,
      ).toLowerCase();

    rightAddress =
      getAddress(
        right.receivingAddress,
      ).toLowerCase();
  } catch {
    return false;
  }

  if (
    leftAddress !==
    rightAddress
  ) {
    return false;
  }

  try {
    return (
      parseUnits(
        left.verificationAmountUsdt.toString(),
        TOKENS.USDT.decimals,
      ) ===
      parseUnits(
        right.verificationAmountUsdt.toString(),
        TOKENS.USDT.decimals,
      )
    );
  } catch {
    return false;
  }
}
