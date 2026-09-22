import type {
  PrismaClient,
} from "@prisma/client";

import {
  prepareDigitalSettlementTreasuryReceiptCandidateWithClient,
  type DigitalSettlementTreasuryReceiptCandidateClient,
} from "../../treasury/gateway/capital-receipts/intake/prepareDigitalSettlementTreasuryReceiptCandidateWithClient";

export type GetDigitalSettlementRecognitionReceiptCandidateHttpResult =
  | Readonly<{
      status:
        200;

      body:
        Readonly<{
          ok:
            true;

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
        }>;
    }>
  | Readonly<{
      status:
        400 | 404 | 409;

      body:
        Readonly<{
          ok:
            false;

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

          error:
            "DSI_TREASURY_RECOGNITION_NOT_READY",
        },
      };
    }

    throw error;
  }

  return {
    status:
      200,

    body: {
      ok:
        true,

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
    },
  };
}
