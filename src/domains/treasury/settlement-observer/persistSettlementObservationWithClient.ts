import {
  Prisma,
  type PrismaClient,
} from "@prisma/client";

import {
  TREASURY_SETTLEMENT_OBSERVATION_DIRECTION,
  TREASURY_SETTLEMENT_OBSERVATION_STATUS,
} from "./contracts";

import type { UsdtTransferEvent } from "@/lib/treasury/transfers";

export type SettlementObservationPersistenceClient = Pick<
  PrismaClient,
  "treasurySettlementObservation"
>;

export async function persistSettlementObservationWithClient(params: {
  client: SettlementObservationPersistenceClient;
  transfer: UsdtTransferEvent;
  requiredConfirmations: number;
  detectedAt?: Date;
}) {
  const {
    client,
    transfer,
    requiredConfirmations,
  } = params;

  if (
    !Number.isInteger(requiredConfirmations) ||
    requiredConfirmations <= 0
  ) {
    throw new Error(
      `[TREASURY_SETTLEMENT_OBSERVATION_CONFIRMATIONS_INVALID] ${requiredConfirmations}`,
    );
  }

  const direction =
    transfer.direction === "in"
      ? TREASURY_SETTLEMENT_OBSERVATION_DIRECTION.IN
      : TREASURY_SETTLEMENT_OBSERVATION_DIRECTION.OUT;

  const detectedAt =
    params.detectedAt ?? new Date();

  return client.treasurySettlementObservation.upsert({
    where: {
      chainId_txHash_logIndex: {
        chainId: transfer.chainId,
        txHash: transfer.txHash.toLowerCase(),
        logIndex: transfer.logIndex,
      },
    },

    update: {},

    create: {
      chainId: transfer.chainId,
      network: transfer.network,

      tokenContractAddress:
        transfer.tokenContractAddress.toLowerCase(),

      txHash: transfer.txHash.toLowerCase(),
      logIndex: transfer.logIndex,

      blockNumber: transfer.blockNumber,
      blockHash:
        transfer.blockHash?.toLowerCase() ?? null,

      fromAddress:
        transfer.from.toLowerCase(),

      toAddress:
        transfer.to.toLowerCase(),

      amountBaseUnits: new Prisma.Decimal(
        transfer.amountBaseUnits.toString(),
      ),

      direction,

      status:
        TREASURY_SETTLEMENT_OBSERVATION_STATUS.DETECTED,

      detectedAt,

      confirmationCount: 0,
      requiredConfirmations,
    },
  });
}
