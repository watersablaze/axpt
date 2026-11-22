import type { PrismaClient } from "@prisma/client";

/**
 * GM-V2.1B.2B.4B — Read-only discovery of an institutional-instrument
 * candidate. A database row, document hash or operator assertion is NOT an
 * independently authenticated mandate. This loader NEVER produces Chamber
 * eligibility evidence or operative authority.
 */
export type ChamberMandateSourceClient = Pick<PrismaClient, "institutionalInstrument">;

type MandatePartyRow = {
  id: string;
  instrumentId: string;
  userId: string | null;
};

type MandateAuthorityRow = {
  id: string;
  instrumentId: string;
  holderPartyId: string | null;
  effectiveAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
};

type MandateEvidenceRow = {
  id: string;
  instrumentId: string;
};

export type ChamberMandateSourceResult = Readonly<{
  standing: "SOURCE_NOT_FOUND" | "SUBJECT_NOT_BOUND" | "SOURCE_CONFLICTED" | "SOURCE_UNAUTHENTICATED";
  reason: string;
  instrumentReference: string;
  subjectUserId: string;
  candidateAuthorityIds: readonly string[];
  evidenceIds: readonly string[];
  operationallyUsable: false;
}>;

const nonblank = (x: unknown): x is string =>
  typeof x === "string" && x.trim().length > 0 && x === x.trim();

export async function loadChamberV2InstitutionalMandateSourceWithClient(params: Readonly<{
  client: ChamberMandateSourceClient;
  instrumentReference: string;
  subjectUserId: string;
  at: Date;
}>): Promise<ChamberMandateSourceResult> {
  const { client, instrumentReference, subjectUserId, at } = params;
  if (!nonblank(instrumentReference) || !nonblank(subjectUserId) ||
      !(at instanceof Date) || !Number.isFinite(at.getTime())) {
    throw new Error("GM_MANDATE_SOURCE_INVALID_REQUEST");
  }

  const base = {
    instrumentReference,
    subjectUserId,
    operationallyUsable: false as const,
  };
  const result = (
    standing: ChamberMandateSourceResult["standing"],
    reason: string,
    candidateAuthorityIds: readonly string[] = [],
    evidenceIds: readonly string[] = [],
  ): ChamberMandateSourceResult => ({
    ...base, standing, reason, candidateAuthorityIds, evidenceIds,
  });

  const instrument = await client.institutionalInstrument.findUnique({
    where: { reference: instrumentReference },
    select: {
      id: true,
      status: true,
      parties: { select: { id: true, instrumentId: true, userId: true } },
      authorities: { select: {
        id: true, instrumentId: true, holderPartyId: true,
        effectiveAt: true, expiresAt: true, revokedAt: true,
      } },
      evidence: { select: {
        id: true, instrumentId: true, subjectType: true,
        subjectId: true, contentHash: true, uri: true,
      } },
    },
  });

  if (!instrument) return result("SOURCE_NOT_FOUND", "INSTRUMENT_ABSENT");

  const parties = instrument.parties.filter((p: MandatePartyRow) => p.userId === subjectUserId);
  if (parties.length === 0) return result("SUBJECT_NOT_BOUND", "EXACT_USER_NOT_IN_INSTRUMENT");
  if (parties.length > 1) return result("SOURCE_CONFLICTED", "MULTIPLE_EXACT_USER_PARTIES");
  const party = parties[0];
  if (party.instrumentId !== instrument.id) {
    return result("SOURCE_CONFLICTED", "PARTY_INSTRUMENT_MISMATCH");
  }

  const related = instrument.authorities.filter((a: MandateAuthorityRow) => a.holderPartyId === party.id);
  if (related.some((a: MandateAuthorityRow) => a.instrumentId !== instrument.id)) {
    return result("SOURCE_CONFLICTED", "AUTHORITY_INSTRUMENT_MISMATCH");
  }
  if (instrument.evidence.some((e: MandateEvidenceRow) => e.instrumentId !== instrument.id)) {
    return result("SOURCE_CONFLICTED", "EVIDENCE_INSTRUMENT_MISMATCH");
  }

  // Revoked, expired and malformed records cannot be silently disregarded
  // in favor of the most favorable candidate. No positive standing exists.
  const malformed = related.some((a: MandateAuthorityRow) =>
    !(a.effectiveAt instanceof Date) || !Number.isFinite(a.effectiveAt.getTime()) ||
    (a.expiresAt !== null && (!(a.expiresAt instanceof Date) ||
      !Number.isFinite(a.expiresAt.getTime()) || a.expiresAt <= a.effectiveAt)) ||
    (a.revokedAt !== null && (!(a.revokedAt instanceof Date) ||
      !Number.isFinite(a.revokedAt.getTime()))));
  if (malformed) return result("SOURCE_CONFLICTED", "INVALID_AUTHORITY_LIFECYCLE",
    related.map((a: MandateAuthorityRow) => a.id));

  const operative = related.filter((a: MandateAuthorityRow) =>
    a.revokedAt === null && a.effectiveAt <= at &&
    (a.expiresAt === null || a.expiresAt > at));
  if (operative.length > 1) return result("SOURCE_CONFLICTED", "MULTIPLE_OPERATIVE_AUTHORITY_CANDIDATES",
    operative.map((a: MandateAuthorityRow) => a.id));

  return result("SOURCE_UNAUTHENTICATED", "INDEPENDENT_ISSUER_AND_MANDATE_AUTHENTICATION_ABSENT",
    related.map((a: MandateAuthorityRow) => a.id), instrument.evidence.map((e: MandateEvidenceRow) => e.id));
}
