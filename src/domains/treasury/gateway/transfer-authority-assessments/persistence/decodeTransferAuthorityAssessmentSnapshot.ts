import {
  TRANSFER_AUTHORITY_ASSESSMENT_RESULT,
  type TransferAuthorityAssessment,
} from "../contracts";

type JsonRecord = Record<string, unknown>;

function assertRecord(
  value: unknown,
  code: string,
): asserts value is JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`[${code}]`);
  }
}

function requireString(record: JsonRecord, key: string, code: string): string {
  const value = record[key];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`[${code}] ${key}`);
  }

  return value;
}

function optionalString(
  record: JsonRecord,
  key: string,
  code: string,
): string | undefined {
  const value = record[key];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`[${code}] ${key}`);
  }

  return value;
}

function requireNumber(record: JsonRecord, key: string, code: string): number {
  const value = record[key];

  if (typeof value !== "number" || !Number.isInteger(value)) {
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

function decodeStringArray(value: unknown, code: string): readonly string[] {
  if (!Array.isArray(value)) {
    throw new Error(`[${code}]`);
  }

  return value.map((entry, index) => {
    if (typeof entry !== "string" || entry.length === 0) {
      throw new Error(`[${code}] ${index}`);
    }

    return entry;
  });
}

export function decodeTransferAuthorityAssessmentSnapshot(
  snapshot: unknown,
): TransferAuthorityAssessment {
  assertRecord(
    snapshot,
    "TREASURY_GATEWAY_TRANSFER_AUTHORITY_ASSESSMENT_SNAPSHOT_INVALID",
  );

  const metadata = snapshot.metadata;

  assertRecord(
    metadata,
    "TREASURY_GATEWAY_TRANSFER_AUTHORITY_ASSESSMENT_METADATA_INVALID",
  );

  const result = requireString(
    snapshot,
    "result",
    "TREASURY_GATEWAY_TRANSFER_AUTHORITY_ASSESSMENT_RESULT_INVALID",
  );

  if (
    !Object.values(TRANSFER_AUTHORITY_ASSESSMENT_RESULT).includes(
      result as TransferAuthorityAssessment["result"],
    )
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_TRANSFER_AUTHORITY_ASSESSMENT_RESULT_INVALID] ${result}`,
    );
  }

  return {
    id: requireString(
      snapshot,
      "id",
      "TREASURY_GATEWAY_TRANSFER_AUTHORITY_ASSESSMENT_SNAPSHOT_INVALID",
    ),

    transferId: requireString(
      snapshot,
      "transferId",
      "TREASURY_GATEWAY_TRANSFER_AUTHORITY_ASSESSMENT_SNAPSHOT_INVALID",
    ),

    result: result as TransferAuthorityAssessment["result"],

    instructionId: optionalString(
      snapshot,
      "instructionId",
      "TREASURY_GATEWAY_TRANSFER_AUTHORITY_ASSESSMENT_SNAPSHOT_INVALID",
    ),

    authorityGrantId: optionalString(
      snapshot,
      "authorityGrantId",
      "TREASURY_GATEWAY_TRANSFER_AUTHORITY_ASSESSMENT_SNAPSHOT_INVALID",
    ),

    evidenceArtifactIds: decodeStringArray(
      snapshot.evidenceArtifactIds,
      "TREASURY_GATEWAY_TRANSFER_AUTHORITY_ASSESSMENT_EVIDENCE_INVALID",
    ),

    assessedByActorId: requireString(
      snapshot,
      "assessedByActorId",
      "TREASURY_GATEWAY_TRANSFER_AUTHORITY_ASSESSMENT_SNAPSHOT_INVALID",
    ),

    assessedAt: requireDate(
      snapshot,
      "assessedAt",
      "TREASURY_GATEWAY_TRANSFER_AUTHORITY_ASSESSMENT_SNAPSHOT_INVALID",
    ),

    notes: optionalString(
      snapshot,
      "notes",
      "TREASURY_GATEWAY_TRANSFER_AUTHORITY_ASSESSMENT_SNAPSHOT_INVALID",
    ),

    metadata: {
      createdAt: requireDate(
        metadata,
        "createdAt",
        "TREASURY_GATEWAY_TRANSFER_AUTHORITY_ASSESSMENT_METADATA_INVALID",
      ),

      updatedAt: requireDate(
        metadata,
        "updatedAt",
        "TREASURY_GATEWAY_TRANSFER_AUTHORITY_ASSESSMENT_METADATA_INVALID",
      ),

      createdByActorId: requireString(
        metadata,
        "createdByActorId",
        "TREASURY_GATEWAY_TRANSFER_AUTHORITY_ASSESSMENT_METADATA_INVALID",
      ),

      lastModifiedByActorId: requireString(
        metadata,
        "lastModifiedByActorId",
        "TREASURY_GATEWAY_TRANSFER_AUTHORITY_ASSESSMENT_METADATA_INVALID",
      ),

      version: requireNumber(
        metadata,
        "version",
        "TREASURY_GATEWAY_TRANSFER_AUTHORITY_ASSESSMENT_METADATA_INVALID",
      ),
    },
  };
}
