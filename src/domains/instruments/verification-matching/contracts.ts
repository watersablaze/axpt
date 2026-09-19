export const DIGITAL_SETTLEMENT_VERIFICATION_MATCH_DISPOSITION = {
  NO_MATCH:
    "NO_MATCH",

  MATCHED:
    "MATCHED",

  AMBIGUOUS_OBSERVATIONS:
    "AMBIGUOUS_OBSERVATIONS",

  AMBIGUOUS_INSTRUCTIONS:
    "AMBIGUOUS_INSTRUCTIONS",
} as const;

export type DigitalSettlementVerificationMatchDisposition =
  (typeof DIGITAL_SETTLEMENT_VERIFICATION_MATCH_DISPOSITION)[keyof typeof DIGITAL_SETTLEMENT_VERIFICATION_MATCH_DISPOSITION];

export type DigitalSettlementVerificationExpectation =
  Readonly<{
    instrumentId: string;

    instrumentReference: string;

    settlementInstructionId: string;

    chainId: 1;

    network:
      "ETHEREUM_ERC20";

    asset:
      "USDT";

    tokenContractAddress:
      string;

    receivingAddress:
      string;

    amountBaseUnits:
      bigint;

    amountUsdt:
      string;
  }>;

export type DigitalSettlementVerificationObservationCandidate =
  Readonly<{
    observationId:
      string;

    txHash:
      string;

    logIndex:
      number;

    blockNumber:
      bigint;

    blockHash:
      string | null;

    chainTimestamp:
      Date;

    fromAddress:
      string;

    toAddress:
      string;

    amountBaseUnits:
      bigint;

    confirmedAt:
      Date | null;

    confirmationCount:
      number;

    requiredConfirmations:
      number;
  }>;

export type DigitalSettlementVerificationMatchResult =
  | Readonly<{
      disposition:
        "NO_MATCH";

      expectation:
        DigitalSettlementVerificationExpectation;

      candidates:
        readonly [];
    }>
  | Readonly<{
      disposition:
        "MATCHED";

      expectation:
        DigitalSettlementVerificationExpectation;

      candidate:
        DigitalSettlementVerificationObservationCandidate;

      conflictingInstrumentReferences:
        readonly [];
    }>
  | Readonly<{
      disposition:
        "AMBIGUOUS_OBSERVATIONS";

      expectation:
        DigitalSettlementVerificationExpectation;

      candidates:
        readonly DigitalSettlementVerificationObservationCandidate[];
    }>
  | Readonly<{
      disposition:
        "AMBIGUOUS_INSTRUCTIONS";

      expectation:
        DigitalSettlementVerificationExpectation;

      candidate:
        DigitalSettlementVerificationObservationCandidate;

      conflictingInstrumentReferences:
        readonly string[];
    }>;
