import type { PrismaClient } from "@prisma/client";

export type SettlementObservationCursorClient = Pick<
  PrismaClient,
  "treasurySettlementObservationCursor"
>;

export async function loadSettlementObservationCursorWithClient(params: {
  client: SettlementObservationCursorClient;

  chainId: number;
  tokenContractAddress: string;
  watchedAddress: string;
}) {
  const {
    client,
    chainId,
    tokenContractAddress,
    watchedAddress,
  } = params;

  return client.treasurySettlementObservationCursor.findUnique({
    where: {
      chainId_tokenContractAddress_watchedAddress: {
        chainId,
        tokenContractAddress:
          tokenContractAddress.toLowerCase(),
        watchedAddress:
          watchedAddress.toLowerCase(),
      },
    },
  });
}
