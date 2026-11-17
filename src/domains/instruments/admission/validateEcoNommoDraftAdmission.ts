/**
 * ECN-REG-1C.1 — PURE PRE-ADMISSION VALIDATION ONLY.
 * Does not authenticate actors, verify source custody or legal authority,
 * create an instrument, issue a version, or authorize financial activity.
 * Source text and private custody identifiers must not be logged.
 */
export const ECO_NOMMO_DRAFT_COLLECTION_KEY = "ECO_NOMMO" as const;

export type EcoNommoDraftAdmission = Readonly<{
  collectionKey: typeof ECO_NOMMO_DRAFT_COLLECTION_KEY;
  libraryReference: "EN-00" | "EN-01" | "EN-02" | "EN-03";
  sourceReference: string;
  sourceEdition: string;
  title: string;
  kind: "GENERAL" | "COOPERATION_FRAMEWORK";
  instrumentStatus: "DRAFT";
  versionStatus: "DRAFT";
  custodyReference: string;
  sourceSha256: string;
  actorUserId: string;
  correlationId: string;
}>;

export type AdmissionValidationResult =
  | Readonly<{ ok: true; value: EcoNommoDraftAdmission }>
  | Readonly<{ ok: false; errors: readonly string[] }>;

const FIELD_NAMES = [
  "collectionKey", "libraryReference", "sourceReference", "sourceEdition",
  "title", "kind", "instrumentStatus", "versionStatus",
  "custodyReference", "sourceSha256", "actorUserId", "correlationId",
] as const;

const LIBRARY_REFERENCES = new Set(["EN-00", "EN-01", "EN-02", "EN-03"]);
const KINDS = new Set(["GENERAL", "COOPERATION_FRAMEWORK"]);

function nonemptyString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" &&
    value.length <= maxLength &&
    value.trim().length > 0 &&
    value === value.trim() &&
    !/[\u0000-\u001f\u007f]/.test(value);
}

/**
 * Validation is syntactic; all custody, hash, identity and mandate claims
 * require independent authoritative checks before any persistence.
 */
export function validateEcoNommoDraftAdmission(input: unknown): AdmissionValidationResult {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, errors: ["ADMISSION_OBJECT_REQUIRED"] };
  }

  const record = input as Record<string, unknown>;
  const errors: string[] = [];

  for (const name of Object.keys(record)) {
    if (!(FIELD_NAMES as readonly string[]).includes(name)) {
      errors.push("UNKNOWN_FIELD:" + name);
    }
  }
  for (const name of FIELD_NAMES) {
    if (!Object.prototype.hasOwnProperty.call(record, name)) {
      errors.push("MISSING_FIELD:" + name);
    }
  }

  if (record.collectionKey !== ECO_NOMMO_DRAFT_COLLECTION_KEY) {
    errors.push("INVALID_COLLECTION_KEY");
  }
  if (!LIBRARY_REFERENCES.has(record.libraryReference as string)) {
    errors.push("INVALID_LIBRARY_REFERENCE");
  }
  if (!nonemptyString(record.sourceReference, 128)) {
    errors.push("INVALID_SOURCE_REFERENCE");
  }
  if (!nonemptyString(record.sourceEdition, 128)) {
    errors.push("INVALID_SOURCE_EDITION");
  }
  if (!nonemptyString(record.title, 256)) {
    errors.push("INVALID_TITLE");
  }
  if (!KINDS.has(record.kind as string)) {
    errors.push("UNQUALIFIED_INSTRUMENT_KIND");
  }
  if (record.instrumentStatus !== "DRAFT" || record.versionStatus !== "DRAFT") {
    errors.push("DRAFT_ONLY");
  }
  if (!nonemptyString(record.custodyReference, 256)) {
    errors.push("INVALID_CUSTODY_REFERENCE");
  }
  if (typeof record.sourceSha256 !== "string" ||
      !/^[a-fA-F0-9]{64}$/.test(record.sourceSha256)) {
    errors.push("INVALID_SOURCE_SHA256");
  }
  if (!nonemptyString(record.actorUserId, 128)) {
    errors.push("INVALID_ACTOR_ID");
  }
  if (!nonemptyString(record.correlationId, 128)) {
    errors.push("INVALID_CORRELATION_ID");
  }

  if (errors.length) return { ok: false, errors };

  // Deliberately rebuild the object: do not retain caller prototypes or extraneous data.
  return {
    ok: true,
    value: {
      collectionKey: ECO_NOMMO_DRAFT_COLLECTION_KEY,
      libraryReference: record.libraryReference as EcoNommoDraftAdmission["libraryReference"],
      sourceReference: record.sourceReference as string,
      sourceEdition: record.sourceEdition as string,
      title: record.title as string,
      kind: record.kind as EcoNommoDraftAdmission["kind"],
      instrumentStatus: "DRAFT",
      versionStatus: "DRAFT",
      custodyReference: record.custodyReference as string,
      sourceSha256: (record.sourceSha256 as string).toLowerCase(),
      actorUserId: record.actorUserId as string,
      correlationId: record.correlationId as string,
    },
  };
}
