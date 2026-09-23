import type {
  TransactionClient,
} from "@prisma/client";

import {
  TREASURY_AGGREGATE_TYPE,
} from "../../events/aggregateTypes";

import {
  TREASURY_EVENT_TYPE,
} from "../../events/eventType";

import type {
  TreasuryMoney,
} from "../../shared/money";

import type {
  ProgramCapitalReceiptId,
} from "../../shared/identifiers";

import type {
  CapitalReceiptEvidence,
  ProgramCapitalReceipt,
} from "../contracts";

import {
  PROGRAM_CAPITAL_RECEIPT_STATUS,
} from "../status";

import {
  loadProgramCapitalReceiptWithClient,
} from "../persistence/loadProgramCapitalReceiptWithClient";

import {
  loadCapitalReceiptEvidenceWithClient,
} from "../persistence/loadCapitalReceiptEvidenceWithClient";

type UnknownRecord =
  Record<string, unknown>;

export type ProgramCapitalReceiptVerificationEventPerception =
  Readonly<{
    eventId:
      string;

    sequence:
      bigint;

    aggregateVersion:
      number;

    actorId?:
      string;

    authorityGrantId?:
      string;

    correlationId:
      string;

    causationId?:
      string;

    verifiedAmount:
      TreasuryMoney;

    selectedEvidenceIds:
      readonly string[];

    verifiedAt:
      Date;

    occurredAt:
      Date;

    recordedAt:
      Date;

    previousEventHash?:
      string;

    eventHash?:
      string;
  }>;

export type ProgramCapitalReceiptVerificationPerception =
  Readonly<{
    receipt:
      ProgramCapitalReceipt;

    admittedEvidence:
      readonly CapitalReceiptEvidence[];

    verificationEvent:
      ProgramCapitalReceiptVerificationEventPerception | null;

    selectedEvidenceIds:
      readonly string[];

    selectedEvidence:
      readonly CapitalReceiptEvidence[];

    unselectedAdmittedEvidence:
      readonly CapitalReceiptEvidence[];

    loadedAt:
      Date;
  }>;

function assertRecord(
  value:
    unknown,

  code:
    string,
): asserts value is UnknownRecord {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error(
      `[${code}]`,
    );
  }
}

function requireString(
  record:
    UnknownRecord,

  key:
    string,

  code:
    string,
): string {
  const value =
    record[key];

  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `[${code}] ${key}`,
    );
  }

  return value;
}

function requireStringArray(
  record:
    UnknownRecord,

  key:
    string,

  code:
    string,
): readonly string[] {
  const value =
    record[key];

  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some(
      (entry) =>
        typeof entry !== "string" ||
        entry.trim().length === 0,
    )
  ) {
    throw new Error(
      `[${code}] ${key}`,
    );
  }

  return value as string[];
}

function requireDate(
  record:
    UnknownRecord,

  key:
    string,

  code:
    string,
): Date {
  const value =
    requireString(
      record,
      key,
      code,
    );

  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      `[${code}] ${key}`,
    );
  }

  return date;
}

function decodeMoney(
  value:
    unknown,

  code:
    string,
): TreasuryMoney {
  assertRecord(
    value,
    code,
  );

  return {
    amount:
      requireString(
        value,
        "amount",
        code,
      ),

    currency:
      requireString(
        value,
        "currency",
        code,
      ),
  };
}

function sameMoney(
  left:
    TreasuryMoney,

  right:
    TreasuryMoney,
): boolean {
  return (
    left.amount ===
      right.amount &&
    left.currency ===
      right.currency
  );
}

function statusRequiresVerificationEvent(
  status:
    ProgramCapitalReceipt["status"],
): boolean {
  return (
    status ===
      PROGRAM_CAPITAL_RECEIPT_STATUS.VERIFIED ||
    status ===
      PROGRAM_CAPITAL_RECEIPT_STATUS.RECOGNIZED ||
    status ===
      PROGRAM_CAPITAL_RECEIPT_STATUS.REVERSED
  );
}

export async function loadProgramCapitalReceiptVerificationPerceptionWithClient(
  params: {
    receiptId:
      ProgramCapitalReceiptId;

    client:
      TransactionClient;
  },
): Promise<
  ProgramCapitalReceiptVerificationPerception | null
> {
  const {
    receiptId,
    client,
  } =
    params;

  const loadedReceipt =
    await loadProgramCapitalReceiptWithClient({
      receiptId,

      client,
    });

  if (
    !loadedReceipt
  ) {
    return null;
  }

  const receipt =
    loadedReceipt.aggregate;

  const admittedEvidence =
    await loadCapitalReceiptEvidenceWithClient({
      receiptId,

      receiptVersion:
        receipt.metadata.version,

      client,
    });

  /*
   * Evidence identity must be unique in canonical perception.
   * The admission domain already rejects duplicates, but perception
   * must fail closed if durable history is ever inconsistent.
   */
  const evidenceById =
    new Map<
      string,
      CapitalReceiptEvidence
    >();

  for (
    const evidence of
      admittedEvidence
  ) {
    if (
      evidenceById.has(
        evidence.id,
      )
    ) {
      throw new Error(
        `[TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_PERCEPTION_EVIDENCE_ID_DUPLICATE] ${receiptId}:${evidence.id}`,
      );
    }

    evidenceById.set(
      evidence.id,
      evidence,
    );
  }

  /*
   * Verification truth comes from the canonical Treasury event stream.
   *
   * Do not infer a verification judgment solely from the aggregate
   * snapshot and do not infer actor/evidence selection from current
   * aggregate metadata.
   */
  const verificationEvents =
    await client
      .treasuryGatewayEvent
      .findMany({
        where: {
          aggregateType:
            TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

          aggregateId:
            receiptId,

          aggregateVersion: {
            lte:
              receipt.metadata.version,
          },

          eventType:
            TREASURY_EVENT_TYPE.CAPITAL_RECEIPT_VERIFIED,
        },

        orderBy: {
          aggregateVersion:
            "asc",
        },

        select: {
          eventId:
            true,

          sequence:
            true,

          aggregateVersion:
            true,

          actorId:
            true,

          authorityGrantId:
            true,

          correlationId:
            true,

          causationId:
            true,

          payload:
            true,

          occurredAt:
            true,

          recordedAt:
            true,

          previousEventHash:
            true,

          eventHash:
            true,
        },
      });

  if (
    verificationEvents.length >
    1
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_EVENT_CARDINALITY_INVALID] ${receiptId}:${verificationEvents.length}`,
    );
  }

  if (
    verificationEvents.length ===
    0
  ) {
    if (
      statusRequiresVerificationEvent(
        receipt.status,
      )
    ) {
      throw new Error(
        `[TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_EVENT_MISSING] ${receiptId}:${receipt.status}`,
      );
    }

    if (
      receipt.verifiedAmount !==
        undefined ||
      receipt.verifiedAt !==
        undefined
    ) {
      throw new Error(
        `[TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_SNAPSHOT_WITHOUT_EVENT] ${receiptId}`,
      );
    }

    return {
      receipt,

      admittedEvidence,

      verificationEvent:
        null,

      selectedEvidenceIds:
        [],

      selectedEvidence:
        [],

      unselectedAdmittedEvidence:
        admittedEvidence,

      loadedAt:
        new Date(),
    };
  }

  const event =
    verificationEvents[0];

  assertRecord(
    event.payload,
    "TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_EVENT_PAYLOAD_INVALID",
  );

  const payloadReceiptId =
    requireString(
      event.payload,
      "receiptId",
      "TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_EVENT_RECEIPT_ID_INVALID",
    );

  if (
    payloadReceiptId !==
    receipt.id
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_EVENT_RECEIPT_ID_MISMATCH] ${payloadReceiptId} -> ${receipt.id}`,
    );
  }

  const verifiedAmount =
    decodeMoney(
      event.payload.verifiedAmount,
      "TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_EVENT_AMOUNT_INVALID",
    );

  const selectedEvidenceIds =
    requireStringArray(
      event.payload,
      "evidenceIds",
      "TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_EVENT_EVIDENCE_IDS_INVALID",
    );

  if (
    new Set(
      selectedEvidenceIds,
    ).size !==
    selectedEvidenceIds.length
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_EVENT_EVIDENCE_IDS_DUPLICATE] ${receiptId}`,
    );
  }

  const verifiedAt =
    requireDate(
      event.payload,
      "verifiedAt",
      "TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_EVENT_VERIFIED_AT_INVALID",
    );

  if (
    !receipt.verifiedAmount
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_SNAPSHOT_AMOUNT_MISSING] ${receiptId}`,
    );
  }

  if (
    !sameMoney(
      verifiedAmount,
      receipt.verifiedAmount,
    )
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_AMOUNT_MISMATCH] ${receiptId}`,
    );
  }

  if (
    !receipt.verifiedAt
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_SNAPSHOT_TIME_MISSING] ${receiptId}`,
    );
  }

  if (
    verifiedAt.getTime() !==
    receipt.verifiedAt.getTime()
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_TIME_MISMATCH] ${receiptId}`,
    );
  }

  if (
    event.occurredAt.getTime() !==
    verifiedAt.getTime()
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_OCCURRED_AT_MISMATCH] ${receiptId}`,
    );
  }

  /*
   * The verification event at version N may only select evidence
   * admitted before that judgment. Reconstruct that historical
   * evidence horizon rather than relying only on the current snapshot.
   */
  const evidenceAvailableAtJudgment =
    await loadCapitalReceiptEvidenceWithClient({
      receiptId,

      receiptVersion:
        event.aggregateVersion -
        1,

      client,
    });

  const evidenceAvailableAtJudgmentById =
    new Map<
      string,
      CapitalReceiptEvidence
    >();

  for (
    const evidence of
      evidenceAvailableAtJudgment
  ) {
    if (
      evidenceAvailableAtJudgmentById.has(
        evidence.id,
      )
    ) {
      throw new Error(
        `[TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_JUDGMENT_EVIDENCE_ID_DUPLICATE] ${receiptId}:${evidence.id}`,
      );
    }

    evidenceAvailableAtJudgmentById.set(
      evidence.id,
      evidence,
    );
  }

  const selectedEvidence =
    selectedEvidenceIds.map(
      (
        evidenceId,
      ) => {
        const evidence =
          evidenceAvailableAtJudgmentById.get(
            evidenceId,
          );

        if (
          !evidence
        ) {
          throw new Error(
            `[TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_SELECTED_EVIDENCE_NOT_ADMITTED] ${receiptId}:${evidenceId}`,
          );
        }

        return evidence;
      },
    );

  const selectedEvidenceIdSet =
    new Set(
      selectedEvidenceIds,
    );

  const unselectedAdmittedEvidence =
    admittedEvidence.filter(
      (
        evidence,
      ) =>
        !selectedEvidenceIdSet.has(
          evidence.id,
        ),
    );

  const verificationEvent:
    ProgramCapitalReceiptVerificationEventPerception =
    {
      eventId:
        event.eventId,

      sequence:
        event.sequence,

      aggregateVersion:
        event.aggregateVersion,

      ...(event.actorId
        ? {
            actorId:
              event.actorId,
          }
        : {}),

      ...(event.authorityGrantId
        ? {
            authorityGrantId:
              event.authorityGrantId,
          }
        : {}),

      correlationId:
        event.correlationId,

      ...(event.causationId
        ? {
            causationId:
              event.causationId,
          }
        : {}),

      verifiedAmount,

      selectedEvidenceIds,

      verifiedAt,

      occurredAt:
        event.occurredAt,

      recordedAt:
        event.recordedAt,

      ...(event.previousEventHash
        ? {
            previousEventHash:
              event.previousEventHash,
          }
        : {}),

      ...(event.eventHash
        ? {
            eventHash:
              event.eventHash,
          }
        : {}),
    };

  return {
    receipt,

    admittedEvidence,

    verificationEvent,

    selectedEvidenceIds,

    selectedEvidence,

    unselectedAdmittedEvidence,

    loadedAt:
      new Date(),
  };
}
