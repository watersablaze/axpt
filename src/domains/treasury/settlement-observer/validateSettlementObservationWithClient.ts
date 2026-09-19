import {
  Prisma,
  type PrismaClient,
} from "@prisma/client";

import {
  classifySettlementObservationValidation,
} from "./classifySettlementObservationValidation";

import {
  readSettlementObservationChainState,
  type ReadSettlementObservationChainStateInput,
} from "./readSettlementObservationChainState";

import {
  requireEthereumMainnetSettlementConfirmations,
} from "./finalityPolicy";

import type {
  SettlementObservationChainState,
} from "./validationContracts";

export type SettlementObservationValidationClient =
  Pick<
    PrismaClient,
    "treasurySettlementObservation"
  >;

export async function validateSettlementObservationWithClient(
  params: {
    client:
      SettlementObservationValidationClient;

    observationId: string;

    readChainState?:
      (
        input:
          ReadSettlementObservationChainStateInput,
      ) => Promise<
        SettlementObservationChainState
      >;

    now?: () => Date;
  },
) {
  const {
    client,
    observationId,
  } = params;

  const observation =
    await client
      .treasurySettlementObservation
      .findUnique({
        where: {
          id:
            observationId,
        },
      });

  if (!observation) {
    throw new Error(
      `[TREASURY_SETTLEMENT_OBSERVATION_NOT_FOUND] ${observationId}`,
    );
  }

  if (
    observation.chainId !== 1 ||
    observation.network !==
      "mainnet"
  ) {
    throw new Error(
      `[TREASURY_SETTLEMENT_OBSERVATION_NETWORK_INVALID] ${observation.chainId}:${observation.network}`,
    );
  }

  requireEthereumMainnetSettlementConfirmations(
    observation.requiredConfirmations,
  );

  const readChainState =
    params.readChainState ??
    readSettlementObservationChainState;

  const chainState =
    await readChainState({
      txHash:
        observation.txHash as
          `0x${string}`,

      observedBlockNumber:
        observation.blockNumber,

      observedBlockHash:
        observation.blockHash as
          | `0x${string}`
          | null,
    });

  /*
   * Provider failure is not chain evidence.
   *
   * Preserve the durable observation unchanged and allow a
   * later validation pass to retry.
   */
  if (
    chainState.disposition ===
    "UNAVAILABLE"
  ) {
    return {
      disposition:
        "CHAIN_UNAVAILABLE" as const,

      observation,

      errorCode:
        chainState.errorCode,
    };
  }

  const now =
    params.now?.() ??
    new Date();

  const result =
    classifySettlementObservationValidation({
      observation: {
        chainId:
          observation.chainId,

        tokenContractAddress:
          observation.tokenContractAddress as
            `0x${string}`,

        txHash:
          observation.txHash as
            `0x${string}`,

        logIndex:
          observation.logIndex,

        blockNumber:
          observation.blockNumber,

        blockHash:
          observation.blockHash as
            | `0x${string}`
            | null,

        fromAddress:
          observation.fromAddress as
            `0x${string}`,

        toAddress:
          observation.toAddress as
            `0x${string}`,

        amountBaseUnits:
          BigInt(
            new Prisma.Decimal(
              observation.amountBaseUnits,
            ).toFixed(0),
          ),

        currentStatus:
          observation.status,

        requiredConfirmations:
          observation.requiredConfirmations,
      },

      receipt:
        chainState.receipt,

      latestBlockNumber:
        chainState.latestBlockNumber,

      finalizedBlockNumber:
        chainState.finalizedBlockNumber,

      now,
    });

  const updated =
    await client
      .treasurySettlementObservation
      .update({
        where: {
          id:
            observation.id,
        },

        data: {
          status:
            result.status,

          confirmationCount:
            result.confirmationCount,

          validatedAt:
            result.validatedAt,

          confirmedAt:
            result.confirmedAt,
        },
      });

  return {
    disposition:
      "VALIDATED" as const,

    observation:
      updated,

    validation:
      result,
  };
}
