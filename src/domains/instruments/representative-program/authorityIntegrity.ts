import {
  INSTRUMENT_AUTHORITY_CLASS,
  type InstrumentAuthorityClass,
} from "../contracts";

import type { RepresentativeAuthorityConditions } from "./contracts";

const CONDITION_KEYS = new Set([
  "transactionReferences",
  "counterpartyReferences",
  "territory",
  "requiresPriorApproval",
  "approvalAuthority",
  "documentClasses",
  "monetaryLimit",
  "allowWhileRestricted",
  "notes",
]);

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertOptionalStringArray(params: {
  value: unknown;
  field: string;
}): void {
  if (params.value === undefined) {
    return;
  }

  if (!Array.isArray(params.value)) {
    throw new Error(
      `[ARP_AUTHORITY_CONDITION_ARRAY_REQUIRED] field=${params.field}`,
    );
  }

  const normalized = params.value.map((item) => {
    if (typeof item !== "string") {
      throw new Error(
        `[ARP_AUTHORITY_CONDITION_STRING_MEMBER_REQUIRED] field=${params.field}`,
      );
    }

    const trimmed = item.trim();

    if (!trimmed) {
      throw new Error(
        `[ARP_AUTHORITY_CONDITION_BLANK_MEMBER] field=${params.field}`,
      );
    }

    return trimmed;
  });

  if (new Set(normalized).size !== normalized.length) {
    throw new Error(
      `[ARP_AUTHORITY_CONDITION_DUPLICATE_MEMBER] field=${params.field}`,
    );
  }
}

function assertOptionalBoolean(params: {
  value: unknown;
  field: string;
}): void {
  if (params.value !== undefined && typeof params.value !== "boolean") {
    throw new Error(
      `[ARP_AUTHORITY_CONDITION_BOOLEAN_REQUIRED] field=${params.field}`,
    );
  }
}

function assertOptionalNonBlankString(params: {
  value: unknown;
  field: string;
}): void {
  if (params.value === undefined) {
    return;
  }

  if (typeof params.value !== "string" || !params.value.trim()) {
    throw new Error(
      `[ARP_AUTHORITY_CONDITION_NONBLANK_STRING_REQUIRED] field=${params.field}`,
    );
  }
}

/**
 * Runtime validator for ARP authority conditions.
 *
 * The database stores conditions as JSON, so TypeScript alone
 * cannot establish that persisted or externally supplied data
 * conforms to Program doctrine.
 */
export function assertRepresentativeAuthorityConditions(
  conditions: unknown,
): asserts conditions is RepresentativeAuthorityConditions | null | undefined {
  if (conditions === undefined || conditions === null) {
    return;
  }

  if (!isPlainRecord(conditions)) {
    throw new Error("[ARP_AUTHORITY_CONDITIONS_OBJECT_REQUIRED]");
  }

  for (const key of Object.keys(conditions)) {
    if (!CONDITION_KEYS.has(key)) {
      throw new Error(`[ARP_AUTHORITY_CONDITION_UNKNOWN_FIELD] field=${key}`);
    }
  }

  assertOptionalStringArray({
    value: conditions.transactionReferences,
    field: "transactionReferences",
  });

  assertOptionalStringArray({
    value: conditions.counterpartyReferences,
    field: "counterpartyReferences",
  });

  assertOptionalStringArray({
    value: conditions.territory,
    field: "territory",
  });

  assertOptionalStringArray({
    value: conditions.documentClasses,
    field: "documentClasses",
  });

  assertOptionalBoolean({
    value: conditions.requiresPriorApproval,
    field: "requiresPriorApproval",
  });

  assertOptionalBoolean({
    value: conditions.allowWhileRestricted,
    field: "allowWhileRestricted",
  });

  assertOptionalNonBlankString({
    value: conditions.approvalAuthority,
    field: "approvalAuthority",
  });

  assertOptionalNonBlankString({
    value: conditions.monetaryLimit,
    field: "monetaryLimit",
  });

  assertOptionalNonBlankString({
    value: conditions.notes,
    field: "notes",
  });

  if (
    conditions.requiresPriorApproval === true &&
    (typeof conditions.approvalAuthority !== "string" ||
      !conditions.approvalAuthority.trim())
  ) {
    throw new Error("[ARP_AUTHORITY_APPROVAL_AUTHORITY_REQUIRED]");
  }

  if (
    conditions.approvalAuthority !== undefined &&
    conditions.requiresPriorApproval !== true
  ) {
    throw new Error("[ARP_AUTHORITY_APPROVAL_AUTHORITY_WITHOUT_REQUIREMENT]");
  }
}

/**
 * Canonical ARP holder disposition.
 *
 * RESERVED authority belongs to the principal / instrument,
 * not to the representative.
 *
 * JOINT, DELEGATED and PROHIBITED dispositions are bound to
 * the exact InstrumentParty used by the Appointment.
 */
export function expectedRepresentativeAuthorityHolderPartyId(params: {
  authorityClass: InstrumentAuthorityClass;
  appointmentInstrumentPartyId: string;
}): string | null {
  if (params.authorityClass === INSTRUMENT_AUTHORITY_CLASS.RESERVED) {
    return null;
  }

  return params.appointmentInstrumentPartyId;
}

export function assertRepresentativeAuthorityHolderIntegrity(params: {
  authorityId?: string;
  authorityClass: InstrumentAuthorityClass;
  holderPartyId: string | null;
  appointmentInstrumentPartyId: string;
}): void {
  const expected = expectedRepresentativeAuthorityHolderPartyId({
    authorityClass: params.authorityClass,
    appointmentInstrumentPartyId: params.appointmentInstrumentPartyId,
  });

  if (params.holderPartyId !== expected) {
    throw new Error(
      `[ARP_AUTHORITY_HOLDER_INTEGRITY_VIOLATION] authorityId=${params.authorityId ?? "unknown"} expected=${expected ?? "null"} actual=${params.holderPartyId ?? "null"}`,
    );
  }
}

export type RepresentativeAuthorityInterval = Readonly<{
  effectiveAt: Date;
  expiresAt: Date | null;
}>;

/**
 * Authorities use half-open time ranges:
 *
 *   [effectiveAt, expiresAt)
 *
 * A null expiresAt means no upper bound.
 */
export function representativeAuthorityIntervalsOverlap(
  left: RepresentativeAuthorityInterval,
  right: RepresentativeAuthorityInterval,
): boolean {
  assertRepresentativeAuthorityInterval(left);
  assertRepresentativeAuthorityInterval(right);

  const leftStart = left.effectiveAt.getTime();
  const rightStart = right.effectiveAt.getTime();

  const leftEnd = left.expiresAt?.getTime() ?? Number.POSITIVE_INFINITY;

  const rightEnd = right.expiresAt?.getTime() ?? Number.POSITIVE_INFINITY;

  return leftStart < rightEnd && rightStart < leftEnd;
}

export function assertRepresentativeAuthorityInterval(
  interval: RepresentativeAuthorityInterval,
): void {
  const effectiveAt = interval.effectiveAt.getTime();

  if (!Number.isFinite(effectiveAt)) {
    throw new Error("[ARP_AUTHORITY_EFFECTIVE_AT_INVALID]");
  }

  if (interval.expiresAt) {
    const expiresAt = interval.expiresAt.getTime();

    if (!Number.isFinite(expiresAt)) {
      throw new Error("[ARP_AUTHORITY_EXPIRES_AT_INVALID]");
    }

    if (expiresAt <= effectiveAt) {
      throw new Error("[ARP_AUTHORITY_INTERVAL_INVALID]");
    }
  }
}

/**
 * Future revocation is not supported while generic authority
 * discovery treats any non-null revokedAt as already revoked.
 */
function assertRepresentativeAuthorityTimestampNotFuture(params: {
  value: Date;
  now?: Date;
  invalidCode: string;
  futureCode: string;
}): void {
  const now = params.now ?? new Date();

  const valueMs = params.value.getTime();
  const nowMs = now.getTime();

  if (!Number.isFinite(valueMs)) {
    throw new Error(`[${params.invalidCode}]`);
  }

  if (!Number.isFinite(nowMs)) {
    throw new Error("[ARP_AUTHORITY_REFERENCE_TIME_INVALID]");
  }

  if (valueMs > nowMs) {
    throw new Error(`[${params.futureCode}]`);
  }
}

export function assertRepresentativeAuthorityRevocationNotFuture(params: {
  revokedAt: Date;
  now?: Date;
}): void {
  assertRepresentativeAuthorityTimestampNotFuture({
    value: params.revokedAt,
    now: params.now,
    invalidCode: "ARP_AUTHORITY_REVOKED_AT_INVALID",
    futureCode: "ARP_AUTHORITY_FUTURE_REVOCATION_NOT_SUPPORTED",
  });
}

export function assertRepresentativeAuthorityReplacementNotFuture(params: {
  replacedAt: Date;
  now?: Date;
}): void {
  assertRepresentativeAuthorityTimestampNotFuture({
    value: params.replacedAt,
    now: params.now,
    invalidCode: "ARP_AUTHORITY_REPLACED_AT_INVALID",
    futureCode: "ARP_AUTHORITY_FUTURE_REPLACEMENT_NOT_SUPPORTED",
  });
}
