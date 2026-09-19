import {
  Prisma,
  type PrismaClient,
} from "@prisma/client";

import {
  TOKENS,
} from "@/lib/treasury/config";

import {
  DIGITAL_SETTLEMENT_STATUS,
  INSTITUTIONAL_INSTRUMENT_STATUS,
} from "@/domains/instruments/contracts";

import {
  DIGITAL_SETTLEMENT_VERIFICATION_MATCH_DISPOSITION,
  type DigitalSettlementVerificationMatchResult,
  type DigitalSettlementVerificationObservationCandidate,
} from "./contracts";

import {
  deriveDigitalSettlementVerificationExpectation,
} from "./deriveDigitalSettlementVerificationExpectation";

import {
  digitalSettlementVerificationSignaturesMatch,
} from "./digitalSettlementVerificationSignature";

export type DigitalSettlementVerificationMatchingClient =
  Pick<
    PrismaClient,
    | "institutionalInstrument"
    | "treasurySettlementObservation"
  >;

type DigitalSettlementVerificationConflictInstrumentRow =
  Readonly<{
    reference: string;

    digitalSettlementInstruction:
      | Readonly<{
          settlementAsset: string;

          settlementNetwork: string;

          receivingAddress:
            string | null;

          verificationAmountUsdt: {
            toString(): string;
          };

          settlementStatus: string;
        }>
      | null;
  }>;

function toCandidate(
  observation: {
    id: string;

    txHash: string;
    logIndex: number;

    blockNumber: bigint;
    blockHash: string | null;

    fromAddress: string;
    toAddress: string;

    amountBaseUnits: unknown;

    confirmedAt: Date | null;

    confirmationCount: number;
    requiredConfirmations: number;
  },
): DigitalSettlementVerificationObservationCandidate {
  return {
    observationId:
      observation.id,

    txHash:
      observation.txHash,

    logIndex:
      observation.logIndex,

    blockNumber:
      observation.blockNumber,

    blockHash:
      observation.blockHash,

    fromAddress:
      observation.fromAddress,

    toAddress:
      observation.toAddress,

    amountBaseUnits:
      BigInt(
        new Prisma.Decimal(
          observation.amountBaseUnits as any,
        ).toFixed(0),
      ),

    confirmedAt:
      observation.confirmedAt,

    confirmationCount:
      observation.confirmationCount,

    requiredConfirmations:
      observation.requiredConfirmations,
  };
}

export async function findDigitalSettlementVerificationCandidateWithClient(
  params: {
    client:
      DigitalSettlementVerificationMatchingClient;

    instrumentReference:
      string;
  },
): Promise<
  DigitalSettlementVerificationMatchResult
> {
  const {
    client,
  } = params;

  const instrumentReference =
    params.instrumentReference
      .trim();

  if (!instrumentReference) {
    throw new Error(
      "[DSI_VERIFICATION_MATCH_REFERENCE_REQUIRED]",
    );
  }

  const instrument =
    await client
      .institutionalInstrument
      .findUnique({
        where: {
          reference:
            instrumentReference,
        },

        include: {
          digitalSettlementInstruction:
            true,
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
      `[DSI_VERIFICATION_MATCH_NOT_FOUND] ${instrumentReference}`,
    );
  }

  const expectation =
    deriveDigitalSettlementVerificationExpectation({
      instrument,
      settlement,
    });

  /*
   * Query at most two.
   *
   * AO-1E never chooses between multiple matching chain facts.
   * Two is sufficient to prove ambiguity.
   */
  const observations =
    await client
      .treasurySettlementObservation
      .findMany({
        where: {
          chainId:
            expectation.chainId,

          network:
            "mainnet",

          tokenContractAddress:
            TOKENS.USDT.address
              .toLowerCase(),

          toAddress:
            expectation
              .receivingAddress,

          amountBaseUnits:
            new Prisma.Decimal(
              expectation
                .amountBaseUnits
                .toString(),
            ),

          direction:
            "IN",

          status:
            "CONFIRMED",
        },

        orderBy: [
          {
            confirmedAt:
              "asc",
          },
          {
            blockNumber:
              "asc",
          },
          {
            txHash:
              "asc",
          },
          {
            logIndex:
              "asc",
          },
        ],

        take:
          2,
      });

  const candidates =
    observations.map(
      toCandidate,
    );

  if (
    candidates.length === 0
  ) {
    return {
      disposition:
        DIGITAL_SETTLEMENT_VERIFICATION_MATCH_DISPOSITION.NO_MATCH,

      expectation,

      candidates:
        [],
    };
  }

  if (
    candidates.length > 1
  ) {
    return {
      disposition:
        DIGITAL_SETTLEMENT_VERIFICATION_MATCH_DISPOSITION.AMBIGUOUS_OBSERVATIONS,

      expectation,

      candidates,
    };
  }

  /*
   * The current DSI schema does not bind an expected sender address.
   *
   * Therefore identical live verification expectations cannot be
   * distinguished from Ethereum evidence alone. Before returning a
   * single candidate, prove that no other issued DSI is waiting on the
   * same network / asset / receiving address / amount signature.
   */
  const otherIssuedInstruments =
    (
      await client
        .institutionalInstrument
        .findMany({
          where: {
            id: {
              not:
                instrument.id,
            },

            status:
              INSTITUTIONAL_INSTRUMENT_STATUS.ISSUED,
          },

          include: {
            digitalSettlementInstruction:
              true,
          },
        })
    ) as readonly DigitalSettlementVerificationConflictInstrumentRow[];

  const conflictingInstrumentReferences =
    otherIssuedInstruments
      .filter(
        (other) => {
          const otherSettlement =
            other
              .digitalSettlementInstruction;

          if (
            !otherSettlement
          ) {
            return false;
          }

          if (
            otherSettlement
              .settlementStatus !==
            DIGITAL_SETTLEMENT_STATUS
              .AWAITING_VERIFICATION_TRANSFER
          ) {
            return false;
          }

          return digitalSettlementVerificationSignaturesMatch(
            settlement,
            otherSettlement,
          );
        },
      )
      .map(
        (other) =>
          other.reference,
      )
      .sort();

  const candidate =
    candidates[0];

  if (
    conflictingInstrumentReferences
      .length > 0
  ) {
    return {
      disposition:
        DIGITAL_SETTLEMENT_VERIFICATION_MATCH_DISPOSITION.AMBIGUOUS_INSTRUCTIONS,

      expectation,

      candidate,

      conflictingInstrumentReferences,
    };
  }

  return {
    disposition:
      DIGITAL_SETTLEMENT_VERIFICATION_MATCH_DISPOSITION.MATCHED,

    expectation,

    candidate,

    conflictingInstrumentReferences:
      [],
  };
}
