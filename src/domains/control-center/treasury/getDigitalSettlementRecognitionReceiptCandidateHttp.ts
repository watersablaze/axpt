import type {
  PrismaClient,
  TransactionClient,
} from "@prisma/client";

import {
  DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE,
  isDigitalSettlementTreasuryAdmissionIntegrityError,
  type DigitalSettlementTreasuryAdmissionState,
} from "./digitalSettlementReceiptAdmissionState";

import {
  CAPITAL_RECEIPT_METHOD,
} from "../../treasury/gateway/capital-receipts/contracts";

import {
  deriveDigitalSettlementRecognitionTreasuryReceiptId,
} from "../../treasury/gateway/capital-receipts/intake/digitalSettlementRecognitionIntake";

import {
  prepareDigitalSettlementTreasuryReceiptCandidateWithClient,
  type DigitalSettlementTreasuryReceiptCandidateClient,
} from "../../treasury/gateway/capital-receipts/intake/prepareDigitalSettlementTreasuryReceiptCandidateWithClient";

import {
  loadProgramCapitalReceiptWithClient,
} from "../../treasury/gateway/capital-receipts/persistence/loadProgramCapitalReceiptWithClient";

type PerceivedTreasuryReceipt =
  Readonly<{
    id:
      string;

    reference:
      string;

    status:
      string;

    version:
      number;

    programId:
      string;

    destinationProgramAccountId:
      string;

    declaredAmount:
      Readonly<{
        amount:
          string;

        currency:
          string;
      }>;

    externalReference:
      string | null;

    receivedAt:
      string | null;

    createdAt:
      string;
  }>;

export type GetDigitalSettlementRecognitionReceiptCandidateHttpResult =
  | Readonly<{
      status:
        200;

      body:
        Readonly<{
          ok:
            true;

          state:
            DigitalSettlementTreasuryAdmissionState;

          candidate:
            Readonly<{
              recognitionEventId:
                string;

              instrumentId:
                string;

              instrumentVersionId:
                string;

              settlementInstructionId:
                string;

              observationId:
                string;

              chainId:
                number;

              transactionHash:
                string;

              logIndex:
                number;

              tokenContractAddress:
                string;

              receivingAddress:
                string;

              amount:
                Readonly<{
                  amount:
                    string;

                  currency:
                    string;
                }>;

              receivedAt:
                string;

              recognizedAt:
                string;
            }>;

          treasuryReceipt:
            PerceivedTreasuryReceipt | null;
        }>;
    }>
  | Readonly<{
      status:
        400 | 404 | 409 | 500;

      body:
        Readonly<{
          ok:
            false;

          state:
            DigitalSettlementTreasuryAdmissionState;

          error:
            string;
        }>;
    }>;

function includesCode(
  error:
    unknown,

  code:
    string,
): boolean {
  return (
    error instanceof Error &&
    error.message.includes(
      code,
    )
  );
}

function assertExistingReceiptMatchesSource(
  params: {
    receipt:
      Readonly<{
        id:
          string;

        reference:
          string;

        declaredAmount:
          Readonly<{
            amount:
              string;

            currency:
              string;
          }>;

        receiptMethod:
          string;

        externalReference?:
          string;

        receivedAt?:
          Date;
      }>;

    source:
      Readonly<{
        instrumentId:
          string;

        observationId:
          string;

        transactionHash:
          string;

        amount:
          Readonly<{
            amount:
              string;

            currency:
              string;
          }>;

        receivedAt:
          Date;
      }>;
  },
): void {
  const {
    receipt,
    source,
  } = params;

  const expectedReference =
    `DSI-RECOGNITION:${source.instrumentId}:${source.observationId}`;

  if (
    receipt.reference !==
    expectedReference
  ) {
    throw new Error(
      "[DSI_TREASURY_PERCEPTION_RECEIPT_REFERENCE_MISMATCH]",
    );
  }

  if (
    receipt.receiptMethod !==
    CAPITAL_RECEIPT_METHOD.DIGITAL_ASSET_TRANSFER
  ) {
    throw new Error(
      "[DSI_TREASURY_PERCEPTION_RECEIPT_METHOD_MISMATCH]",
    );
  }

  if (
    receipt.externalReference !==
    source.transactionHash
  ) {
    throw new Error(
      "[DSI_TREASURY_PERCEPTION_RECEIPT_TRANSACTION_MISMATCH]",
    );
  }

  if (
    receipt.declaredAmount.amount !==
      source.amount.amount ||
    receipt.declaredAmount.currency !==
      source.amount.currency
  ) {
    throw new Error(
      "[DSI_TREASURY_PERCEPTION_RECEIPT_AMOUNT_MISMATCH]",
    );
  }

  if (
    !receipt.receivedAt ||
    receipt.receivedAt.getTime() !==
      source.receivedAt.getTime()
  ) {
    throw new Error(
      "[DSI_TREASURY_PERCEPTION_RECEIPT_RECEIVED_AT_MISMATCH]",
    );
  }
}

export async function getDigitalSettlementRecognitionReceiptCandidateHttp(
  params: {
    rawInstrumentReference:
      string;

    prisma:
      PrismaClient;
  },
): Promise<
  GetDigitalSettlementRecognitionReceiptCandidateHttpResult
> {
  const instrumentReference =
    params.rawInstrumentReference
      .trim();

  if (
    instrumentReference.length ===
    0
  ) {
    return {
      status:
        400,

      body: {
        ok:
          false,

        state:
          DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.INVALID_REQUEST,

        error:
          "DSI_REFERENCE_REQUIRED",
      },
    };
  }

  let source;

  try {
    source =
      await prepareDigitalSettlementTreasuryReceiptCandidateWithClient({
        instrumentReference,

        client:
          params.prisma as PrismaClient &
            DigitalSettlementTreasuryReceiptCandidateClient,
      });
  } catch (
    error:
      unknown
  ) {
    if (
      includesCode(
        error,
        "DSI_TREASURY_CANDIDATE_NOT_FOUND",
      )
    ) {
      return {
        status:
          404,

        body: {
          ok:
            false,

          state:
            DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.NOT_FOUND,

          error:
            "DSI_TREASURY_CANDIDATE_NOT_FOUND",
        },
      };
    }

    if (
      includesCode(
        error,
        "DSI_TREASURY_CANDIDATE_RECOGNITION_BINDING_MISSING",
      )
    ) {
      return {
        status:
          409,

        body: {
          ok:
            false,

          state:
            DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.RECOGNITION_NOT_READY,

          error:
            "DSI_TREASURY_RECOGNITION_NOT_READY",
        },
      };
    }

    if (
      isDigitalSettlementTreasuryAdmissionIntegrityError(
        error,
      )
    ) {
      return {
        status:
          500,

        body: {
          ok:
            false,

          state:
            DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.INTEGRITY_FAILURE,

          error:
            "DSI_TREASURY_INTEGRITY_FAILURE",
        },
      };
    }

    throw error;
  }

  const receiptId =
    deriveDigitalSettlementRecognitionTreasuryReceiptId(
      source,
    );

  let loadedReceipt:
    Awaited<
      ReturnType<
        typeof loadProgramCapitalReceiptWithClient
      >
    >;

  try {
    loadedReceipt =
      await loadProgramCapitalReceiptWithClient({
        receiptId,

        client:
          params.prisma as unknown as
            TransactionClient,
      });

    if (
      loadedReceipt?.aggregate
    ) {
      assertExistingReceiptMatchesSource({
        receipt:
          loadedReceipt.aggregate,

        source,
      });
    }
  } catch (
    error:
      unknown
  ) {
    if (
      isDigitalSettlementTreasuryAdmissionIntegrityError(
        error,
      )
    ) {
      return {
        status:
          500,

        body: {
          ok:
            false,

          state:
            DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.INTEGRITY_FAILURE,

          error:
            "DSI_TREASURY_INTEGRITY_FAILURE",
        },
      };
    }

    throw error;
  }

  const treasuryReceipt =
    loadedReceipt?.aggregate ??
    null;

  return {
    status:
      200,

    body: {
      ok:
        true,

      state:
        treasuryReceipt
          ? DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.ALREADY_REPORTED
          : DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.REPORTABLE,

      candidate: {
        recognitionEventId:
          source.recognitionEventId,

        instrumentId:
          source.instrumentId,

        instrumentVersionId:
          source.instrumentVersionId,

        settlementInstructionId:
          source.settlementInstructionId,

        observationId:
          source.observationId,

        chainId:
          source.chainId,

        transactionHash:
          source.transactionHash,

        logIndex:
          source.logIndex,

        tokenContractAddress:
          source.tokenContractAddress,

        receivingAddress:
          source.receivingAddress,

        amount: {
          ...source.amount,
        },

        receivedAt:
          source.receivedAt
            .toISOString(),

        recognizedAt:
          source.recognizedAt
            .toISOString(),
      },

      treasuryReceipt:
        treasuryReceipt
          ? {
              id:
                treasuryReceipt.id,

              reference:
                treasuryReceipt.reference,

              status:
                treasuryReceipt.status,

              version:
                treasuryReceipt.metadata.version,

              programId:
                treasuryReceipt.programId,

              destinationProgramAccountId:
                treasuryReceipt.destinationProgramAccountId,

              declaredAmount: {
                ...treasuryReceipt.declaredAmount,
              },

              externalReference:
                treasuryReceipt.externalReference ??
                null,

              receivedAt:
                treasuryReceipt.receivedAt
                  ?.toISOString() ??
                null,

              createdAt:
                treasuryReceipt.metadata.createdAt
                  .toISOString(),
            }
          : null,
    },
  };
}
