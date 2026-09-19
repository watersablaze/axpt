import type { PrismaClient } from "@prisma/client";

export type SettlementObservationCursorAdvanceClient = Pick<
  PrismaClient,
  "treasurySettlementObservationCursor"
>;

export async function advanceSettlementObservationCursorWithClient(params: {
  client: SettlementObservationCursorAdvanceClient;

  chainId: number;
  network: string;

  tokenContractAddress: string;
  watchedAddress: string;

  lastScannedBlock: bigint;
  lastScannedBlockHash: string | null;
}) {
  const {
    client,
    chainId,
    network,
    tokenContractAddress,
    watchedAddress,
    lastScannedBlock,
    lastScannedBlockHash,
  } = params;

  const normalizedToken =
    tokenContractAddress.toLowerCase();

  const normalizedAddress =
    watchedAddress.toLowerCase();

  const existing =
    await client.treasurySettlementObservationCursor.findUnique({
      where: {
        chainId_tokenContractAddress_watchedAddress: {
          chainId,
          tokenContractAddress: normalizedToken,
          watchedAddress: normalizedAddress,
        },
      },

      select: {
        lastScannedBlock: true,
      },
    });

  if (
    existing &&
    lastScannedBlock < existing.lastScannedBlock
  ) {
    throw new Error(
      `[TREASURY_SETTLEMENT_CURSOR_REGRESSION] ${lastScannedBlock.toString()} < ${existing.lastScannedBlock.toString()}`,
    );
  }

  return client.treasurySettlementObservationCursor.upsert({
    where: {
      chainId_tokenContractAddress_watchedAddress: {
        chainId,
        tokenContractAddress: normalizedToken,
        watchedAddress: normalizedAddress,
      },
    },

    update: {
      network,
      lastScannedBlock,
      lastScannedBlockHash,
    },

    create: {
      chainId,
      network,

      tokenContractAddress: normalizedToken,
      watchedAddress: normalizedAddress,

      lastScannedBlock,
      lastScannedBlockHash,
    },
  });
}
