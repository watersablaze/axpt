import {
  ASSET_REGISTRY,
  type AssetCode,
} from "@/lib/assets/registry";

import { formatBaseUnits } from "@/lib/money/baseUnits";

import type { VerifiedTreasuryExecutionSettlement } from "../../verifiedSettlementContracts";

import type { InternalWalletExecutionSettlementProof } from "./executionEvidenceContracts";

function isAssetCode(value: string): value is AssetCode {
  return value in ASSET_REGISTRY;
}

export function toVerifiedTreasuryExecutionSettlement(
  proof: InternalWalletExecutionSettlementProof,
): VerifiedTreasuryExecutionSettlement {
  if (!isAssetCode(proof.assetCode)) {
    throw new Error(
      `[TREASURY_GATEWAY_INTERNAL_WALLET_SETTLEMENT_ASSET_UNSUPPORTED] ${proof.assetCode}`,
    );
  }

  const asset = ASSET_REGISTRY[proof.assetCode];

  if (asset.status !== "ACTIVE") {
    throw new Error(
      `[TREASURY_GATEWAY_INTERNAL_WALLET_SETTLEMENT_ASSET_INACTIVE] ${asset.code}`,
    );
  }

  let amountBaseUnits: bigint;

  try {
    amountBaseUnits = BigInt(proof.amountBaseUnits);
  } catch {
    throw new Error(
      `[TREASURY_GATEWAY_INTERNAL_WALLET_SETTLEMENT_BASE_UNITS_INVALID] ${proof.amountBaseUnits}`,
    );
  }

  if (amountBaseUnits <= 0n) {
    throw new Error(
      `[TREASURY_GATEWAY_INTERNAL_WALLET_SETTLEMENT_AMOUNT_NOT_POSITIVE] ${proof.amountBaseUnits}`,
    );
  }

  /*
   * This assertion is the explicit compile-time authority handoff.
   *
   * The input is not arbitrary application data. It is the result of the
   * internal-wallet evidence verifier, and this translator has normalized
   * the rail-native observation into TreasuryMoney.
   *
   * Future rails must establish their own verified proof and perform the
   * same deliberate admission only after rail-specific verification.
   */
  return {
    executionId: proof.executionId,

    amount: {
      amount: formatBaseUnits(
        amountBaseUnits,
        asset.decimals,
      ),

      currency: asset.code,
    },

    verifiedAt: proof.verifiedAt,
  } as VerifiedTreasuryExecutionSettlement;
}
