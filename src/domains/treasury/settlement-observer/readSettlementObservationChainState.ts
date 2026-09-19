import {
  decodeEventLog,
  type Hash,
} from "viem";

import {
  getPublicClient,
} from "@/lib/treasury/clients";

import type {
  SettlementObservationChainState,
  SettlementObservationObservedTransferLog,
} from "./validationContracts";

const ERC20_TRANSFER_EVENT = {
  type: "event",
  name: "Transfer",
  inputs: [
    {
      indexed: true,
      name: "from",
      type: "address",
    },
    {
      indexed: true,
      name: "to",
      type: "address",
    },
    {
      indexed: false,
      name: "value",
      type: "uint256",
    },
  ],
} as const;

export type ReadSettlementObservationChainStateInput =
  Readonly<{
    txHash: Hash;

    observedBlockNumber: bigint;

    observedBlockHash:
      | `0x${string}`
      | null;
  }>;

function decodeTransferLogs(
  logs: readonly Readonly<{
    address: string;
    data: `0x${string}`;
    topics: readonly `0x${string}`[];
    logIndex: number | null;
  }>[],
): readonly SettlementObservationObservedTransferLog[] {
  const decoded:
    SettlementObservationObservedTransferLog[] = [];

  for (const log of logs) {
    if (log.logIndex === null) {
      continue;
    }

    try {
      const event =
        decodeEventLog({
          abi: [ERC20_TRANSFER_EVENT],
          data: log.data,
          topics: log.topics as [
            signature: `0x${string}`,
            ...args: `0x${string}`[],
          ],
        });

      if (
        event.eventName !==
        "Transfer"
      ) {
        continue;
      }

      const args =
        event.args as {
          from: `0x${string}`;
          to: `0x${string}`;
          value: bigint;
        };

      decoded.push({
        logIndex:
          log.logIndex,

        tokenContractAddress:
          log.address.toLowerCase(),

        fromAddress:
          args.from.toLowerCase(),

        toAddress:
          args.to.toLowerCase(),

        amountBaseUnits:
          args.value,
      });
    } catch {
      // Receipt log is not an ERC-20 Transfer event.
    }
  }

  return decoded;
}

async function readFinalityHeads(
  client: ReturnType<
    typeof getPublicClient
  >,
) {
  const [
    latestBlockNumber,
    finalizedBlockResult,
  ] = await Promise.all([
    client.getBlockNumber(),

    client
      .getBlock({
        blockTag:
          "finalized",
      })
      .catch(() => null),
  ]);

  return {
    latestBlockNumber,

    finalizedBlockNumber:
      finalizedBlockResult?.number ??
      null,
  };
}

export async function readSettlementObservationChainState(
  input: ReadSettlementObservationChainStateInput,
): Promise<SettlementObservationChainState> {
  const {
    txHash,
    observedBlockNumber,
    observedBlockHash,
  } = input;

  const client =
    getPublicClient();

  let receipt;

  try {
    receipt =
      await client.getTransactionReceipt({
        hash: txHash,
      });
  } catch (receiptError) {
    /*
     * Receipt lookup failure alone is not chain evidence.
     *
     * When the original observed block hash is known, however,
     * independently inspect the canonical block now occupying
     * that height.
     *
     * A different canonical block hash proves the original
     * observation was reorged away. If the block still matches,
     * or the block lookup itself is unavailable, preserve the
     * observation unchanged and retry later.
     */
    if (
      observedBlockHash !==
      null
    ) {
      try {
        const canonicalBlock =
          await client.getBlock({
            blockNumber:
              observedBlockNumber,
          });

        if (
          canonicalBlock.hash
            .toLowerCase() !==
          observedBlockHash
            .toLowerCase()
        ) {
          let heads;

          try {
            heads =
              await readFinalityHeads(
                client,
              );
          } catch {
            heads = {
              latestBlockNumber:
                observedBlockNumber,

              finalizedBlockNumber:
                null,
            };
          }

          return {
            disposition:
              "AVAILABLE",

            receipt:
              null,

            latestBlockNumber:
              heads.latestBlockNumber,

            finalizedBlockNumber:
              heads.finalizedBlockNumber,
          };
        }
      } catch {
        // No independent canonicality proof available.
      }
    }

    return {
      disposition:
        "UNAVAILABLE",

      errorCode:
        receiptError instanceof Error
          ? receiptError.name
          : "UNKNOWN",
    };
  }

  try {
    const heads =
      await readFinalityHeads(
        client,
      );

    return {
      disposition:
        "AVAILABLE",

      receipt: {
        status:
          receipt.status,

        blockNumber:
          receipt.blockNumber,

        blockHash:
          receipt.blockHash,

        transferLogs:
          decodeTransferLogs(
            receipt.logs.map((log) => ({
              address:
                log.address,

              data:
                log.data,

              topics:
                log.topics,

              logIndex:
                log.logIndex,
            })),
          ),
      },

      latestBlockNumber:
        heads.latestBlockNumber,

      finalizedBlockNumber:
        heads.finalizedBlockNumber,
    };
  } catch (error) {
    return {
      disposition:
        "UNAVAILABLE",

      errorCode:
        error instanceof Error
          ? error.name
          : "UNKNOWN",
    };
  }
}
