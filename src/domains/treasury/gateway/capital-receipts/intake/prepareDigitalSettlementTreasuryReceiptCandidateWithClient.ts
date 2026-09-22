import type {
  PrismaClient,
} from "@prisma/client";

import {
  getAddress,
  isAddress,
  parseUnits,
} from "viem";

import {
  TOKENS,
} from "@/lib/treasury/config";

import {
  INSTRUMENT_EVENT_TYPE,
} from "@/domains/instruments/eventTypes";

import {
  INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
} from "@/domains/instruments/stream";

import type {
  DigitalSettlementRecognitionTreasurySource,
} from "./digitalSettlementRecognitionIntake";

export type DigitalSettlementTreasuryReceiptCandidateClient =
  Pick<
    PrismaClient,
    | "institutionalInstrument"
    | "treasurySettlementObservation"
    | "domainEvent"
  >;

type UnknownRecord =
  Record<string, unknown>;

type BoundInstrumentVersionRow =
  Readonly<{
    id: string;
  }>;

type RecognitionDomainEventRow =
  Readonly<{
    id: string;

    payload: unknown;

    occurredAt: Date;
  }>;

function assertRecord(
  value: unknown,
  code: string,
): asserts value is UnknownRecord {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error(code);
  }
}

function requireString(
  value: unknown,
  code: string,
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(code);
  }

  return value.trim();
}

function requireNumber(
  value: unknown,
  code: string,
): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value)
  ) {
    throw new Error(code);
  }

  return value;
}

function normalizeTransactionHash(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase();
}

export async function prepareDigitalSettlementTreasuryReceiptCandidateWithClient(
  params: {
    instrumentReference:
      string;

    client:
      DigitalSettlementTreasuryReceiptCandidateClient;
  },
): Promise<
  DigitalSettlementRecognitionTreasurySource
> {
  const instrumentReference =
    params.instrumentReference
      .trim();

  if (!instrumentReference) {
    throw new Error(
      "[DSI_TREASURY_CANDIDATE_REFERENCE_REQUIRED]",
    );
  }

  const instrument =
    await params.client
      .institutionalInstrument
      .findUnique({
        where: {
          reference:
            instrumentReference,
        },

        include: {
          digitalSettlementInstruction:
            true,

          versions: {
            select: {
              id:
                true,
            },
          },
        },
      });

  const settlement =
    instrument
      ?.digitalSettlementInstruction;

  if (
    !instrument ||
    !settlement
  ) {
    throw new Error(
      `[DSI_TREASURY_CANDIDATE_NOT_FOUND] ${instrumentReference}`,
    );
  }

  /*
   * Reportability is established by durable recognition bindings,
   * not by the DSI's present lifecycle state.
   *
   * The DSI may legitimately advance after recognition without
   * erasing the already-established receipt fact.
   */
  if (
    !settlement.verificationTxHash ||
    !settlement.verificationObservationId ||
    !settlement.verificationInstrumentVersionId ||
    !settlement.verificationConfirmedAt
  ) {
    throw new Error(
      "[DSI_TREASURY_CANDIDATE_RECOGNITION_BINDING_MISSING]",
    );
  }

  if (
    !settlement.receivingAddress ||
    !isAddress(
      settlement.receivingAddress,
    )
  ) {
    throw new Error(
      "[DSI_TREASURY_CANDIDATE_RECEIVING_ADDRESS_INVALID]",
    );
  }

  const versionBelongsToInstrument =
    instrument.versions.some(
      (
        version:
          BoundInstrumentVersionRow,
      ) =>
        version.id ===
        settlement.verificationInstrumentVersionId,
    );

  if (
    !versionBelongsToInstrument
  ) {
    throw new Error(
      "[DSI_TREASURY_CANDIDATE_INSTRUMENT_VERSION_NOT_BOUND]",
    );
  }

  const observation =
    await params.client
      .treasurySettlementObservation
      .findUnique({
        where: {
          id:
            settlement.verificationObservationId,
        },
      });

  if (!observation) {
    throw new Error(
      `[DSI_TREASURY_CANDIDATE_OBSERVATION_NOT_FOUND] ${settlement.verificationObservationId}`,
    );
  }

  if (
    observation.status !==
      "CONFIRMED" ||
    observation.direction !==
      "IN"
  ) {
    throw new Error(
      `[DSI_TREASURY_CANDIDATE_OBSERVATION_NOT_FINAL] ${observation.status}:${observation.direction}`,
    );
  }

  if (
    !observation.chainTimestamp
  ) {
    throw new Error(
      "[DSI_TREASURY_CANDIDATE_CHAIN_TIMESTAMP_MISSING]",
    );
  }

  const persistedTransactionHash =
    normalizeTransactionHash(
      settlement.verificationTxHash,
    );

  const observedTransactionHash =
    normalizeTransactionHash(
      observation.txHash,
    );

  if (
    persistedTransactionHash !==
    observedTransactionHash
  ) {
    throw new Error(
      "[DSI_TREASURY_CANDIDATE_TRANSACTION_HASH_MISMATCH]",
    );
  }

  if (
    observation.chainId !==
    1
  ) {
    throw new Error(
      `[DSI_TREASURY_CANDIDATE_CHAIN_ID_MISMATCH] ${observation.chainId}`,
    );
  }

  if (
    observation.tokenContractAddress
      .trim()
      .toLowerCase() !==
    TOKENS.USDT.address
      .toLowerCase()
  ) {
    throw new Error(
      "[DSI_TREASURY_CANDIDATE_TOKEN_MISMATCH]",
    );
  }

  if (
    !isAddress(
      observation.toAddress,
    ) ||
    getAddress(
      observation.toAddress,
    ) !==
    getAddress(
      settlement.receivingAddress,
    )
  ) {
    throw new Error(
      "[DSI_TREASURY_CANDIDATE_RECEIVING_ADDRESS_MISMATCH]",
    );
  }

  const expectedAmountBaseUnits =
    parseUnits(
      settlement
        .verificationAmountUsdt
        .toString(),
      TOKENS.USDT.decimals,
    );

  const observedAmountBaseUnits =
    BigInt(
      observation
        .amountBaseUnits
        .toString(),
    );

  if (
    expectedAmountBaseUnits !==
    observedAmountBaseUnits
  ) {
    throw new Error(
      "[DSI_TREASURY_CANDIDATE_AMOUNT_MISMATCH]",
    );
  }

  /*
   * Reconstruct recognition from the durable event stream.
   *
   * Do not rely on transient HTTP request values and do not infer
   * recognition from chain observation alone.
   */
  const recognitionEvents:
    readonly RecognitionDomainEventRow[] =
    await params.client
      .domainEvent
      .findMany({
        where: {
          streamType:
            INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,

          streamId:
            instrument.id,

          eventType:
            INSTRUMENT_EVENT_TYPE
              .SETTLEMENT_VERIFICATION_RECOGNIZED,
        },

        orderBy: {
          occurredAt:
            "asc",
        },
      });

  const matchingRecognitionEvents =
    recognitionEvents.filter(
      (event) => {
        try {
          assertRecord(
            event.payload,
            "[DSI_TREASURY_CANDIDATE_EVENT_PAYLOAD_INVALID]",
          );

          return (
            event.payload.observationId ===
              settlement.verificationObservationId &&
            event.payload.instrumentVersionId ===
              settlement.verificationInstrumentVersionId
          );
        } catch {
          return false;
        }
      },
    );

  if (
    matchingRecognitionEvents.length !==
    1
  ) {
    throw new Error(
      `[DSI_TREASURY_CANDIDATE_RECOGNITION_EVENT_CARDINALITY] ${matchingRecognitionEvents.length}`,
    );
  }

  const recognitionEvent =
    matchingRecognitionEvents[0];

  assertRecord(
    recognitionEvent.payload,
    "[DSI_TREASURY_CANDIDATE_EVENT_PAYLOAD_INVALID]",
  );

  const payload =
    recognitionEvent.payload;

  const payloadInstrumentId =
    requireString(
      payload.instrumentId,
      "[DSI_TREASURY_CANDIDATE_EVENT_INSTRUMENT_ID_INVALID]",
    );

  const payloadSettlementInstructionId =
    requireString(
      payload.settlementInstructionId,
      "[DSI_TREASURY_CANDIDATE_EVENT_SETTLEMENT_ID_INVALID]",
    );

  const payloadInstrumentVersionId =
    requireString(
      payload.instrumentVersionId,
      "[DSI_TREASURY_CANDIDATE_EVENT_VERSION_ID_INVALID]",
    );

  const payloadObservationId =
    requireString(
      payload.observationId,
      "[DSI_TREASURY_CANDIDATE_EVENT_OBSERVATION_ID_INVALID]",
    );

  const payloadTransactionHash =
    normalizeTransactionHash(
      requireString(
        payload.transactionHash,
        "[DSI_TREASURY_CANDIDATE_EVENT_TRANSACTION_HASH_INVALID]",
      ),
    );

  const payloadObservedAmountUsdt =
    requireString(
      payload.observedAmountUsdt,
      "[DSI_TREASURY_CANDIDATE_EVENT_AMOUNT_INVALID]",
    );

  const payloadReceivingAddress =
    requireString(
      payload.observedReceivingAddress,
      "[DSI_TREASURY_CANDIDATE_EVENT_RECEIVING_ADDRESS_INVALID]",
    );

  const payloadTokenContractAddress =
    requireString(
      payload.tokenContractAddress,
      "[DSI_TREASURY_CANDIDATE_EVENT_TOKEN_INVALID]",
    );

  const payloadChainId =
    requireNumber(
      payload.chainId,
      "[DSI_TREASURY_CANDIDATE_EVENT_CHAIN_ID_INVALID]",
    );

  const payloadRecognizedAt =
    requireString(
      payload.recognizedAt,
      "[DSI_TREASURY_CANDIDATE_EVENT_RECOGNIZED_AT_INVALID]",
    );

  if (
    payloadInstrumentId !==
      instrument.id ||
    payloadSettlementInstructionId !==
      settlement.id ||
    payloadInstrumentVersionId !==
      settlement.verificationInstrumentVersionId ||
    payloadObservationId !==
      settlement.verificationObservationId
  ) {
    throw new Error(
      "[DSI_TREASURY_CANDIDATE_EVENT_BINDING_MISMATCH]",
    );
  }

  if (
    payloadTransactionHash !==
    persistedTransactionHash
  ) {
    throw new Error(
      "[DSI_TREASURY_CANDIDATE_EVENT_TRANSACTION_HASH_MISMATCH]",
    );
  }

  if (
    payloadChainId !==
    observation.chainId
  ) {
    throw new Error(
      "[DSI_TREASURY_CANDIDATE_EVENT_CHAIN_ID_MISMATCH]",
    );
  }

  if (
    payloadTokenContractAddress
      .toLowerCase() !==
    observation.tokenContractAddress
      .toLowerCase()
  ) {
    throw new Error(
      "[DSI_TREASURY_CANDIDATE_EVENT_TOKEN_MISMATCH]",
    );
  }

  if (
    !isAddress(
      payloadReceivingAddress,
    ) ||
    getAddress(
      payloadReceivingAddress,
    ) !==
    getAddress(
      observation.toAddress,
    )
  ) {
    throw new Error(
      "[DSI_TREASURY_CANDIDATE_EVENT_RECEIVING_ADDRESS_MISMATCH]",
    );
  }

  if (
    parseUnits(
      payloadObservedAmountUsdt,
      TOKENS.USDT.decimals,
    ) !==
    observedAmountBaseUnits
  ) {
    throw new Error(
      "[DSI_TREASURY_CANDIDATE_EVENT_AMOUNT_MISMATCH]",
    );
  }

  const recognizedAt =
    new Date(
      payloadRecognizedAt,
    );

  if (
    Number.isNaN(
      recognizedAt.getTime(),
    ) ||
    recognizedAt.getTime() !==
      recognitionEvent.occurredAt.getTime() ||
    recognizedAt.getTime() !==
      settlement.verificationConfirmedAt.getTime()
  ) {
    throw new Error(
      "[DSI_TREASURY_CANDIDATE_RECOGNITION_TIME_MISMATCH]",
    );
  }

  return {
    recognitionEventId:
      recognitionEvent.id,

    instrumentId:
      instrument.id,

    instrumentVersionId:
      settlement.verificationInstrumentVersionId,

    settlementInstructionId:
      settlement.id,

    observationId:
      observation.id,

    chainId:
      observation.chainId,

    transactionHash:
      observedTransactionHash,

    logIndex:
      observation.logIndex,

    tokenContractAddress:
      observation.tokenContractAddress,

    receivingAddress:
      getAddress(
        observation.toAddress,
      ),

    amount: {
      amount:
        settlement
          .verificationAmountUsdt
          .toString(),

      currency:
        "USDT",
    },

    receivedAt:
      observation.chainTimestamp,

    recognizedAt,
  };
}
