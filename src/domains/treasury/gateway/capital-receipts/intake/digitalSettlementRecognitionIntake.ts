import type {
  CommercialProgramId,
  ProgramAccountId,
  ProgramCapitalReceiptId,
  TreasuryActorId,
  TreasuryAuthorityGrantId,
  TreasuryCausationId,
  TreasuryCommandId,
  TreasuryCorrelationId,
  TreasuryEventId,
  TreasuryIdempotencyKey,
} from "../../shared/identifiers";

import type { TreasuryMoney } from "../../shared/money";

import { assertPositiveDecimal } from "../../shared/decimalAmount";

const TRANSACTION_HASH =
  /^0x[0-9a-fA-F]{64}$/;

export type DigitalSettlementRecognitionTreasurySource =
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
      TreasuryMoney;

    receivedAt:
      Date;

    recognizedAt:
      Date;
  }>;

export type DigitalSettlementRecognitionTreasuryRouting =
  Readonly<{
    programId:
      CommercialProgramId;

    destinationProgramAccountId:
      ProgramAccountId;

    treasuryActorId:
      TreasuryActorId;

    authorityGrantId?:
      TreasuryAuthorityGrantId;
  }>;

export type DigitalSettlementRecognitionTreasuryIntake =
  Readonly<{
    source:
      DigitalSettlementRecognitionTreasurySource;

    routing:
      DigitalSettlementRecognitionTreasuryRouting;
  }>;

export type DigitalSettlementRecognitionTreasuryReceiptIdentity =
  Readonly<{
    receiptId:
      ProgramCapitalReceiptId;

    reference:
      string;

    eventId:
      TreasuryEventId;

    commandId:
      TreasuryCommandId;

    correlationId:
      TreasuryCorrelationId;

    causationId:
      TreasuryCausationId;

    idempotencyKey:
      TreasuryIdempotencyKey;
  }>;

function assertRequired(
  value: string,
  code: string,
): void {
  if (value.trim().length === 0) {
    throw new Error(code);
  }
}

export function assertDigitalSettlementRecognitionTreasuryIntake(
  intake:
    DigitalSettlementRecognitionTreasuryIntake,
): void {
  const {
    source,
    routing,
  } = intake;

  assertRequired(
    source.recognitionEventId,
    "[DSI_TREASURY_INTAKE_RECOGNITION_EVENT_ID_REQUIRED]",
  );

  assertRequired(
    source.instrumentId,
    "[DSI_TREASURY_INTAKE_INSTRUMENT_ID_REQUIRED]",
  );

  assertRequired(
    source.instrumentVersionId,
    "[DSI_TREASURY_INTAKE_INSTRUMENT_VERSION_ID_REQUIRED]",
  );

  assertRequired(
    source.settlementInstructionId,
    "[DSI_TREASURY_INTAKE_SETTLEMENT_INSTRUCTION_ID_REQUIRED]",
  );

  assertRequired(
    source.observationId,
    "[DSI_TREASURY_INTAKE_OBSERVATION_ID_REQUIRED]",
  );

  if (
    !Number.isSafeInteger(source.chainId) ||
    source.chainId <= 0
  ) {
    throw new Error(
      "[DSI_TREASURY_INTAKE_CHAIN_ID_INVALID]",
    );
  }

  if (
    !TRANSACTION_HASH.test(
      source.transactionHash,
    )
  ) {
    throw new Error(
      "[DSI_TREASURY_INTAKE_TRANSACTION_HASH_INVALID]",
    );
  }

  if (
    !Number.isSafeInteger(source.logIndex) ||
    source.logIndex < 0
  ) {
    throw new Error(
      "[DSI_TREASURY_INTAKE_LOG_INDEX_INVALID]",
    );
  }

  assertRequired(
    source.tokenContractAddress,
    "[DSI_TREASURY_INTAKE_TOKEN_CONTRACT_REQUIRED]",
  );

  assertRequired(
    source.receivingAddress,
    "[DSI_TREASURY_INTAKE_RECEIVING_ADDRESS_REQUIRED]",
  );

  if (
    source.amount.currency !==
    "USDT"
  ) {
    throw new Error(
      `[DSI_TREASURY_INTAKE_CURRENCY_INVALID] ${source.amount.currency}`,
    );
  }

  assertPositiveDecimal(
    source.amount.amount,
  );

  if (
    Number.isNaN(
      source.receivedAt.getTime(),
    )
  ) {
    throw new Error(
      "[DSI_TREASURY_INTAKE_RECEIVED_AT_INVALID]",
    );
  }

  if (
    Number.isNaN(
      source.recognizedAt.getTime(),
    )
  ) {
    throw new Error(
      "[DSI_TREASURY_INTAKE_RECOGNIZED_AT_INVALID]",
    );
  }

  if (
    source.receivedAt.getTime() >
    source.recognizedAt.getTime()
  ) {
    throw new Error(
      "[DSI_TREASURY_INTAKE_RECEIVED_AFTER_RECOGNITION]",
    );
  }

  assertRequired(
    routing.programId,
    "[DSI_TREASURY_INTAKE_PROGRAM_ID_REQUIRED]",
  );

  assertRequired(
    routing.destinationProgramAccountId,
    "[DSI_TREASURY_INTAKE_DESTINATION_PROGRAM_ACCOUNT_ID_REQUIRED]",
  );

  assertRequired(
    routing.treasuryActorId,
    "[DSI_TREASURY_INTAKE_TREASURY_ACTOR_ID_REQUIRED]",
  );

  if (
    routing.authorityGrantId !== undefined
  ) {
    assertRequired(
      routing.authorityGrantId,
      "[DSI_TREASURY_INTAKE_AUTHORITY_GRANT_ID_INVALID]",
    );
  }
}

export function deriveDigitalSettlementRecognitionTreasuryReceiptIdentity(
  intake:
    DigitalSettlementRecognitionTreasuryIntake,
): DigitalSettlementRecognitionTreasuryReceiptIdentity {
  assertDigitalSettlementRecognitionTreasuryIntake(
    intake,
  );

  const observationId =
    intake.source.observationId.trim();

  const instrumentId =
    intake.source.instrumentId.trim();

  const recognitionEventId =
    intake.source.recognitionEventId.trim();

  return {
    receiptId:
      `dsi-recognition-receipt:${observationId}`,

    reference:
      `DSI-RECOGNITION:${instrumentId}:${observationId}`,

    eventId:
      `dsi-recognition-capital-receipt-reported:${observationId}`,

    commandId:
      `dsi-recognition-report:${observationId}`,

    correlationId:
      `dsi-recognition:${instrumentId}`,

    causationId:
      recognitionEventId,

    idempotencyKey:
      `dsi-recognition-report:${observationId}`,
  };
}
