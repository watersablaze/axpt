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

    status: string;

    digitalSettlementInstruction:
      | Readonly<{
          settlementAsset: string;

          settlementNetwork: string;

          receivingAddress:
            string | null;

          verificationAmountUsdt: {
            toString(): string;
          };

          verificationTxHash:
            string | null;

          settlementStatus: string;
        }>
      | null;
  }>;

type DigitalSettlementVerificationVersionRow =
  Readonly<{
    id: string;

    number: number;

    status: string;

    issuedAt:
      Date | null;
  }>;

function toCandidate(
  observation: {
    id: string;

    txHash: string;
    logIndex: number;

    blockNumber: bigint;
    blockHash: string | null;

    chainTimestamp: Date | null;

    fromAddress: string;
    toAddress: string;

    amountBaseUnits: unknown;

    confirmedAt: Date | null;

    confirmationCount: number;
    requiredConfirmations: number;
  },
): DigitalSettlementVerificationObservationCandidate {
  if (!observation.chainTimestamp) {
    throw new Error(
      `[DSI_VERIFICATION_MATCH_CHAIN_TIMESTAMP_MISSING] ${observation.id}`,
    );
  }

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

    chainTimestamp:
      observation.chainTimestamp,

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

          versions:
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
   * Verification authority begins when the current DSI version is
   * actually issued.
   *
   * Instrument creation time is not sufficient: the settlement
   * instruction may exist in DRAFT before the buyer is authorized
   * to transmit the verification transfer.
   */
  const currentVersion =
    (
      instrument.versions as
        readonly DigitalSettlementVerificationVersionRow[]
    ).find(
      (version) =>
        version.number ===
        instrument.currentVersion,
    );

  if (
    !currentVersion ||
    currentVersion.status !==
      "ISSUED" ||
    !currentVersion.issuedAt
  ) {
    throw new Error(
      `[DSI_VERIFICATION_MATCH_CURRENT_VERSION_NOT_ISSUED] ${instrumentReference}`,
    );
  }

  const issuedAt =
    currentVersion.issuedAt;

  const instrumentVersionId =
    currentVersion.id;

  /*
   * A chain transfer can support at most one institutional
   * verification recognition.
   *
   * Build the consumed transaction set before selecting observation
   * candidates so previously recognized transfers do not create
   * false ambiguity or hide a later eligible transfer.
   */
  const otherInstruments =
    (
      await client
        .institutionalInstrument
        .findMany({
          where: {
            id: {
              not:
                instrument.id,
            },
          },

          include: {
            digitalSettlementInstruction:
              true,
          },
        })
    ) as readonly DigitalSettlementVerificationConflictInstrumentRow[];

  const consumedTransactionHashes =
    otherInstruments
      .map(
        (other) =>
          other
            .digitalSettlementInstruction
            ?.verificationTxHash
            ?.trim()
            .toLowerCase() ??
          null,
      )
      .filter(
        (transactionHash):
          transactionHash is string =>
            Boolean(
              transactionHash,
            ),
      );

  /*
   * Query at most two eligible observations.
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

          /*
           * Only canonical Ethereum time can establish whether the
           * transfer occurred after DSI issuance.
           *
           * detectedAt / validatedAt / confirmedAt are AXPT process
           * times and are deliberately not used here.
           */
          chainTimestamp: {
            gte:
              issuedAt,
          },

          ...(consumedTransactionHashes.length > 0
            ? {
                txHash: {
                  notIn:
                    consumedTransactionHashes,
                },
              }
            : {}),
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

      instrumentVersionId,

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

      instrumentVersionId,

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
  const conflictingInstrumentReferences =
    otherInstruments
      .filter(
        (other) => {
          /*
           * Only simultaneously live issued instructions can create
           * instruction-signature ambiguity.
           *
           * Consumed transaction exclusion above is broader: a tx
           * remains consumed even if its prior instrument later leaves
           * ISSUED state.
           */
          const otherSettlement =
            other
              .digitalSettlementInstruction;

          if (
            !otherSettlement
          ) {
            return false;
          }

          if (
            other.status !==
              INSTITUTIONAL_INSTRUMENT_STATUS.ISSUED ||
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

      instrumentVersionId,

      candidate,

      conflictingInstrumentReferences,
    };
  }

  return {
    disposition:
      DIGITAL_SETTLEMENT_VERIFICATION_MATCH_DISPOSITION.MATCHED,

    expectation,

    instrumentVersionId,

    candidate,

    conflictingInstrumentReferences:
      [],
  };
}
