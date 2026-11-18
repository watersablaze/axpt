/**
 * ECN-REG-1C.2D.4D — NON-OPERATIVE canonical instrument source discovery.
 *
 * Only reads the existing InstitutionalInstrument aggregate. An instrument,
 * its party rows, its authority rows and its evidence rows are NOT independent
 * proof of issuer competence, institutional identity, signature, custody, or
 * mandate currentness. Never convert this output to TrustedAdmissionAuthorityFacts.
 *
 * The authenticated sessionUserId MUST originate at a trusted server boundary.
 * No HTTP route invokes this reader. No writes, grants or operative result.
 */
import type { PrismaClient } from "@prisma/client";

export type CanonicalMandateSourceClient = Pick<PrismaClient, "institutionalInstrument">;

export type CanonicalMandateSourceResult = Readonly<{
  standing: "SOURCE_NOT_FOUND" | "SOURCE_INCOMPLETE" | "SOURCE_CONFLICTED" | "SOURCE_UNAUTHENTICATED";
  reasons: readonly string[];
  instrumentReference: string;
  holderUserId: string;
  instrumentId: string | null;
  holderPartyId: string | null;
  // Includes ALL authority rows, including revoked, expired and unrelated
  // rows. Callers cannot claim an exhaustive cross-instrument mandate search.
  authorityCandidates: readonly Readonly<{
    id: string;
    authorityKey: string;
    holderPartyId: string | null;
    action: string;
    effectiveAt: Date;
    expiresAt: Date | null;
    revokedAt: Date | null;
  }>[];
  evidenceReferences: readonly Readonly<{
    id: string;
    subjectId: string | null;
    uri: string | null;
    contentHash: string | null;
    recordedByUserId: string;
  }>[];
  canonicalInstitutionId: null;
  issuerCompetenceAuthenticated: false;
  evidenceAuthenticated: false;
  mandateCurrentAuthenticated: false;
  operativeAuthorityEstablished: false;
  admissionAuthorized: false;
}>;

const valid = (s: unknown): s is string =>
  typeof s === "string" && s.length > 0 && s.length <= 256 &&
  s.trim() === s && !/[\u0000-\u001f\u007f]/.test(s);
const validDate = (d: unknown): d is Date =>
  d instanceof Date && Number.isFinite(d.getTime());
const validOptionalDate = (d: unknown): d is Date | null =>
  d === null || validDate(d);

/** Fail closed on actor mismatch BEFORE instrument/party data is read. */
export async function loadCanonicalInstitutionalMandateSourcesWithClient(params: Readonly<{
  client: CanonicalMandateSourceClient;
  sessionUserId: string | null;
  holderUserId: string;
  instrumentReference: string;
  at: Date;
}>): Promise<CanonicalMandateSourceResult> {
  const { sessionUserId, holderUserId, instrumentReference, at } = params;
  if (!valid(instrumentReference) || !valid(holderUserId) || !validDate(at))
    throw new Error("[ECN_MANDATE_SOURCE_INPUT_INVALID]");

  const finish = (
    standing: CanonicalMandateSourceResult["standing"],
    reasons: readonly string[],
    instrumentId: string | null = null,
    holderPartyId: string | null = null,
    authorityCandidates: CanonicalMandateSourceResult["authorityCandidates"] = [],
    evidenceReferences: CanonicalMandateSourceResult["evidenceReferences"] = [],
  ): CanonicalMandateSourceResult => ({
    standing, reasons: [...new Set(reasons)], instrumentReference, holderUserId,
    instrumentId, holderPartyId, authorityCandidates, evidenceReferences,
    canonicalInstitutionId: null,
    issuerCompetenceAuthenticated: false,
    evidenceAuthenticated: false,
    mandateCurrentAuthenticated: false,
    operativeAuthorityEstablished: false,
    admissionAuthorized: false,
  });

  if (!valid(sessionUserId) || sessionUserId !== holderUserId)
    return finish("SOURCE_CONFLICTED", ["AUTHENTICATED_SESSION_HOLDER_MISMATCH"]);

  const instrument = await params.client.institutionalInstrument.findUnique({
    where: { reference: instrumentReference },
    select: {
      id: true,
      reference: true,
      status: true,
      parties: { select: { id: true, instrumentId: true, userId: true } },
      authorities: { select: {
        id: true, instrumentId: true, holderPartyId: true,
        authorityKey: true, action: true, effectiveAt: true,
        expiresAt: true, revokedAt: true,
      } },
      evidence: { select: {
        id: true, instrumentId: true, subjectId: true, uri: true,
        contentHash: true, recordedByUserId: true,
      } },
    },
  });
  if (!instrument) return finish("SOURCE_NOT_FOUND", ["INSTRUMENT_NOT_FOUND"]);

  const allAuthorities = instrument.authorities.map(a => ({
    id: a.id, authorityKey: a.authorityKey, holderPartyId: a.holderPartyId,
    action: a.action, effectiveAt: a.effectiveAt, expiresAt: a.expiresAt,
    revokedAt: a.revokedAt,
  }));
  const allEvidence = instrument.evidence.map(e => ({
    id: e.id, subjectId: e.subjectId, uri: e.uri,
    contentHash: e.contentHash, recordedByUserId: e.recordedByUserId,
  }));
  const conflicts: string[] = [];
  const incomplete: string[] = [];
  if (!valid(instrument.id) || instrument.reference !== instrumentReference)
    conflicts.push("INSTRUMENT_IDENTITY_CONFLICT");

  const ids = new Set<string>();
  for (const party of instrument.parties) {
    if (!valid(party.id) || party.instrumentId !== instrument.id)
      conflicts.push("PARTY_INSTRUMENT_BINDING_CONFLICT");
    if (ids.has(party.id)) conflicts.push("DUPLICATE_PARTY_RECORD_ID");
    ids.add(party.id);
  }
  const holders = instrument.parties.filter(p => p.userId === holderUserId);
  if (holders.length === 0) incomplete.push("HOLDER_PARTY_NOT_FOUND");
  if (holders.length > 1) conflicts.push("DUPLICATE_HOLDER_PARTIES");
  const holder = holders.length === 1 ? holders[0] : null;
  const authorityIds = new Set<string>();
  for (const authority of instrument.authorities) {
    if (!valid(authority.id) || authority.instrumentId !== instrument.id)
      conflicts.push("AUTHORITY_INSTRUMENT_BINDING_CONFLICT");
    if (authorityIds.has(authority.id)) conflicts.push("DUPLICATE_AUTHORITY_RECORD_ID");
    authorityIds.add(authority.id);
    if (authority.holderPartyId !== null && !ids.has(authority.holderPartyId))
      conflicts.push("AUTHORITY_HOLDER_PARTY_NOT_FOUND");
    if (!valid(authority.authorityKey) || !valid(authority.action) ||
        !validDate(authority.effectiveAt) || !validOptionalDate(authority.expiresAt) ||
        !validOptionalDate(authority.revokedAt) ||
        (validDate(authority.effectiveAt) && validDate(authority.expiresAt) &&
          authority.expiresAt <= authority.effectiveAt))
      conflicts.push("AUTHORITY_RECORD_MALFORMED");
  }
  const evidenceIds = new Set<string>();
  for (const evidence of instrument.evidence) {
    if (!valid(evidence.id) || evidence.instrumentId !== instrument.id)
      conflicts.push("EVIDENCE_INSTRUMENT_BINDING_CONFLICT");
    if (evidenceIds.has(evidence.id)) conflicts.push("DUPLICATE_EVIDENCE_RECORD_ID");
    evidenceIds.add(evidence.id);
    if (!valid(evidence.recordedByUserId)) incomplete.push("EVIDENCE_RECORDER_MISSING");
  }
  const scoped = holder
    ? instrument.authorities.filter(a => a.holderPartyId === holder.id)
    : [];
  if (holder && scoped.length === 0) incomplete.push("HOLDER_AUTHORITY_NOT_FOUND");
  // A generic actor may hold multiple authorities, but identical
  // holder + authorityKey + action is ambiguous without an authenticated
  // authoritative supersession/current-slot policy.
  const slots = new Set<string>();
  for (const a of scoped) {
    const slot = JSON.stringify([a.authorityKey, a.action]);
    if (slots.has(slot)) conflicts.push("COMPETING_HOLDER_AUTHORITY_SLOT");
    slots.add(slot);
  }
  if (conflicts.length) return finish("SOURCE_CONFLICTED", conflicts,
    instrument.id, holder?.id ?? null, allAuthorities, allEvidence);
  if (incomplete.length) return finish("SOURCE_INCOMPLETE", incomplete,
    instrument.id, holder?.id ?? null, allAuthorities, allEvidence);
  return finish("SOURCE_UNAUTHENTICATED", [
    "CANONICAL_INSTITUTION_ID_NOT_PROVEN",
    "INDEPENDENT_ISSUER_AND_EVIDENCE_AUTHENTICATION_ABSENT",
    "CROSS_INSTRUMENT_MANDATE_COMPLETENESS_UNPROVEN",
  ], instrument.id, holder?.id ?? null, allAuthorities, allEvidence);
}
