import {
  getPublicClient,
} from "@/lib/treasury/clients";

import {
  ETHEREUM_MAINNET_SETTLEMENT_POLICY,
} from "./finalityPolicy";

export type FinalizedSettlementBootstrapBlock =
  Readonly<{
    chainId: number;
    network: string;

    blockNumber: bigint;
    blockHash: string;
    blockTimestamp: Date;
  }>;

export async function resolveFinalizedSettlementBootstrapBlock():
  Promise<FinalizedSettlementBootstrapBlock> {
  const client =
    getPublicClient();

  const chainId =
    await client.getChainId();

  if (
    chainId !==
    ETHEREUM_MAINNET_SETTLEMENT_POLICY.chainId
  ) {
    throw new Error(
      `[TREASURY_SETTLEMENT_BOOTSTRAP_CHAIN_INVALID] expected=${ETHEREUM_MAINNET_SETTLEMENT_POLICY.chainId} actual=${chainId}`,
    );
  }

  const finalizedBlock =
    await client.getBlock({
      blockTag:
        "finalized",
    });

  if (
    finalizedBlock.number ===
    null
  ) {
    throw new Error(
      "[TREASURY_SETTLEMENT_BOOTSTRAP_FINALIZED_BLOCK_NUMBER_MISSING]",
    );
  }

  if (
    finalizedBlock.hash ===
    null
  ) {
    throw new Error(
      "[TREASURY_SETTLEMENT_BOOTSTRAP_FINALIZED_BLOCK_HASH_MISSING]",
    );
  }

  const exactBlock =
    await client.getBlock({
      blockNumber:
        finalizedBlock.number,
    });

  if (
    exactBlock.number !==
    finalizedBlock.number
  ) {
    throw new Error(
      `[TREASURY_SETTLEMENT_BOOTSTRAP_BLOCK_NUMBER_MISMATCH] finalized=${finalizedBlock.number.toString()} exact=${exactBlock.number?.toString() ?? "null"}`,
    );
  }

  if (
    exactBlock.hash
      .toLowerCase() !==
    finalizedBlock.hash
      .toLowerCase()
  ) {
    throw new Error(
      `[TREASURY_SETTLEMENT_BOOTSTRAP_BLOCK_HASH_MISMATCH] finalized=${finalizedBlock.hash.toLowerCase()} exact=${exactBlock.hash.toLowerCase()}`,
    );
  }

  return {
    chainId,

    network:
      ETHEREUM_MAINNET_SETTLEMENT_POLICY.network,

    blockNumber:
      exactBlock.number,

    blockHash:
      exactBlock.hash.toLowerCase(),

    blockTimestamp:
      new Date(
        Number(
          exactBlock.timestamp,
        ) * 1000,
      ),
  };
}
