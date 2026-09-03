import {
  CAPITAL_RECEIPT_EVIDENCE_TYPE,
  type CapitalReceiptEvidence,
  type CapitalReceiptEvidenceType,
} from "../contracts";

type JsonRecord = Record<string, unknown>;

const CAPITAL_RECEIPT_EVIDENCE_TYPES = new Set<string>(
  Object.values(CAPITAL_RECEIPT_EVIDENCE_TYPE),
);

function assertRecord(value: unknown): asserts value is JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("[TREASURY_GATEWAY_CAPITAL_RECEIPT_EVIDENCE_INVALID]");
  }
}

function requireString(record: JsonRecord, key: string, code: string): string {
  const value = record[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`[${code}] ${key}`);
  }

  return value;
}

function requireDate(record: JsonRecord, key: string, code: string): Date {
  const value = requireString(record, key, code);

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`[${code}] ${key}`);
  }

  return date;
}

export function decodeCapitalReceiptEvidence(params: {
  payload: unknown;

  receiptId: string;
}): CapitalReceiptEvidence {
  const { payload, receiptId } = params;

  assertRecord(payload);

  const payloadReceiptId = requireString(
    payload,
    "receiptId",
    "TREASURY_GATEWAY_CAPITAL_RECEIPT_EVIDENCE_RECEIPT_ID_INVALID",
  );

  if (payloadReceiptId !== receiptId) {
    throw new Error(
      `[TREASURY_GATEWAY_CAPITAL_RECEIPT_EVIDENCE_RECEIPT_ID_MISMATCH] ${payloadReceiptId} -> ${receiptId}`,
    );
  }

  const evidenceId = requireString(
    payload,
    "evidenceId",
    "TREASURY_GATEWAY_CAPITAL_RECEIPT_EVIDENCE_ID_INVALID",
  );

  const evidenceTypeValue = requireString(
    payload,
    "evidenceType",
    "TREASURY_GATEWAY_CAPITAL_RECEIPT_EVIDENCE_TYPE_INVALID",
  );

  if (!CAPITAL_RECEIPT_EVIDENCE_TYPES.has(evidenceTypeValue)) {
    throw new Error(
      `[TREASURY_GATEWAY_CAPITAL_RECEIPT_EVIDENCE_TYPE_INVALID] ${evidenceTypeValue}`,
    );
  }

  const artifactId = requireString(
    payload,
    "artifactId",
    "TREASURY_GATEWAY_CAPITAL_RECEIPT_EVIDENCE_ARTIFACT_ID_INVALID",
  );

  const submittedByActorId = requireString(
    payload,
    "submittedByActorId",
    "TREASURY_GATEWAY_CAPITAL_RECEIPT_EVIDENCE_ACTOR_ID_INVALID",
  );

  const recordedAt = requireDate(
    payload,
    "recordedAt",
    "TREASURY_GATEWAY_CAPITAL_RECEIPT_EVIDENCE_RECORDED_AT_INVALID",
  );

  const externalReferenceValue = payload.externalReference;

  if (
    externalReferenceValue !== undefined &&
    (typeof externalReferenceValue !== "string" ||
      externalReferenceValue.trim().length === 0)
  ) {
    throw new Error(
      "[TREASURY_GATEWAY_CAPITAL_RECEIPT_EVIDENCE_EXTERNAL_REFERENCE_INVALID]",
    );
  }

  return {
    id: evidenceId,

    receiptId,

    evidenceType: evidenceTypeValue as CapitalReceiptEvidenceType,

    artifactId,

    externalReference: externalReferenceValue as string | undefined,

    submittedByActorId,

    recordedAt,
  };
}
