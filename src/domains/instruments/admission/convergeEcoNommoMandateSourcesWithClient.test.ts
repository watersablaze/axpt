import assert from "node:assert/strict";
import { test } from "node:test";
import {
  convergeEcoNommoMandateSourcesWithClient,
  type EcoNommoConvergenceReport,
} from "./convergeEcoNommoMandateSourcesWithClient";
import type { CanonicalMandateSourceClient } from "./loadCanonicalInstitutionalMandateSourcesWithClient";
import type { EcoNommoSourceAssemblyClient } from "./assembleEcoNommoReadOnlySourcesWithClient";
import type { EcoNommoMandateEvidenceCandidate } from "./assessEcoNommoMandateEvidence";

const at = new Date("2026-11-18T12:00:00.000Z");
const admission = {
  actorUserId: "holder-user", collectionKey: "ECO_NOMMO",
  libraryReference: "EN-00", sourceReference: "SYNTHETIC-SOURCE",
  sourceEdition: "Review 01", instrumentStatus: "DRAFT",
  versionStatus: "DRAFT",
} as const;
const candidate: EcoNommoMandateEvidenceCandidate = {
  mandateReference: "synthetic-mandate",
  issuerInstitutionId: "issuer-institution",
  issuerRepresentativeUserId: "issuer-user",
  representedInstitutionId: "represented-institution",
  holderUserId: "holder-user",
  holderCapacity: "DOCUMENTARY_ADMISSION",
  action: "REGISTER_DRAFT_INSTRUMENT", collectionKey: "ECO_NOMMO",
  libraryReference: "EN-00", sourceReference: "SYNTHETIC-SOURCE",
  sourceEdition: "Review 01", effectiveAt: "2026-11-01T00:00:00.000Z",
  expiresAt: "2026-12-01T00:00:00.000Z", revokedAt: null, supersededAt: null,
  evidenceReference: "evidence", evidenceCustodyReference: "custody",
  evidenceSha256: "ab".repeat(32),
  evidenceIssuerAuthenticationReference: "issuer-auth",
  evidenceIssuerCompetenceReference: "issuer-competence",
  evidenceHolderAcceptanceReference: "holder-acceptance",
  evidenceIndependentVerifierReference: "verifier",
};
const instrument = () => ({
  id: "instrument-1", reference: "MANDATE-INSTRUMENT",
  status: "DRAFT",
  parties: [{ id: "party-holder", instrumentId: "instrument-1", userId: "holder-user" }],
  authorities: [{
    id: "authority-1", instrumentId: "instrument-1",
    holderPartyId: "party-holder", authorityKey: "DRAFT-ADMISSION",
    action: "REGISTER_DRAFT_INSTRUMENT",
    effectiveAt: new Date("2026-11-01T00:00:00.000Z"),
    expiresAt: new Date("2026-12-01T00:00:00.000Z"), revokedAt: null,
  }],
  evidence: [{
    id: "evidence-1", instrumentId: "instrument-1",
    subjectId: "instrument-1", uri: "synthetic://evidence",
    contentHash: "ab".repeat(32), recordedByUserId: "recorder-user",
  }],
});
type InstrumentRow = ReturnType<typeof instrument>;
function fixture(options: {
  row?: InstrumentRow | null; holderActive?: boolean;
  issuerActive?: boolean; throwRead?: boolean;
} = {}) {
  const reads: string[] = [];
  const row = options.row === undefined ? instrument() : options.row;
  const client = {
    institutionalInstrument: { findUnique: async () => {
      reads.push("instrument");
      if (options.throwRead) throw Error("SYNTHETIC_CANONICAL_READ_FAILURE");
      return row;
    } },
    frenchWardInstitutionalParticipant: { findUnique: async () => {
      reads.push("participant");
      return {
        userId: "holder-user", reference: "FW-P",
        displayName: "Synthetic", institutionalTitle: "not authority",
        secondaryTitle: null, capacityClass: "REPRESENTATIVE",
        recognitionBasis: "unverified", provenanceReference: null,
        status: options.holderActive === false ? "INACTIVE" : "ACTIVE",
        recognizedAt: at, endedAt: options.holderActive === false ? at : null,
      };
    } },
    frenchWardGoverningOfficer: { findUnique: async () => {
      reads.push("governing");
      return {
        userId: "issuer-user", reference: "FW-G",
        displayName: "Synthetic", institutionalTitle: "not competence",
        secondaryTitle: null, governingBasis: "unverified",
        provenanceReference: null,
        status: options.issuerActive === false ? "INACTIVE" : "ACTIVE",
        recognizedAt: at, endedAt: options.issuerActive === false ? at : null,
      };
    } },
  } as unknown as CanonicalMandateSourceClient & EcoNommoSourceAssemblyClient;
  const call = (override: { sessionUserId?: string | null;
    candidate?: EcoNommoMandateEvidenceCandidate | null } = {}) =>
    convergeEcoNommoMandateSourcesWithClient({
      client, sessionUserId: override.sessionUserId === undefined
        ? "holder-user" : override.sessionUserId,
      admission,
      candidate: override.candidate === undefined ? candidate : override.candidate,
      mandateInstrumentReference: "MANDATE-INSTRUMENT", at,
    });
  return { reads, call };
}
function nonoperative(r: EcoNommoConvergenceReport) {
  assert.equal(r.operativeAuthorityEstablished, false);
  assert.equal(r.admissionAuthorized, false);
  assert.equal(r.canonical.operativeAuthorityEstablished, false);
  assert.equal(r.coverage.operativeAuthorityEstablished, false);
  assert.equal(r.findings.length, 7);
  assert.ok(r.findings.every(f => !f.authenticated && f.gaps.length > 0));
  assert.ok(r.unresolved.length > 0);
}
test("aligned canonical records still produce blocked non-operative convergence", async () => {
  const { call, reads } = fixture();
  const r = await call();
  assert.deepEqual(reads, ["instrument", "participant", "governing"]);
  assert.equal(r.canonical.standing, "SOURCE_UNAUTHENTICATED");
  assert.equal(r.disposition, "BLOCKED_SOURCE_INCOMPLETE");
  assert.ok(r.unresolved.includes("CANONICAL:CANONICAL_INSTITUTION_ID_NOT_PROVEN"));
  assert.ok(r.unresolved.includes("INSTITUTIONAL_BINDINGS:CANONICAL_INSTITUTION_ID_BINDING"));
  nonoperative(r);
});
test("mismatched session prevents ALL institutional source reads", async () => {
  const { call, reads } = fixture();
  const r = await call({ sessionUserId: "other-user" });
  assert.deepEqual(reads, []);
  assert.equal(r.disposition, "BLOCKED_SOURCE_CONFLICT");
  assert.ok(r.sourceConflicts.includes("CANONICAL:AUTHENTICATED_SESSION_HOLDER_MISMATCH"));
  nonoperative(r);
});
test("missing instrument downgrades custody and currentness coverage", async () => {
  const { call } = fixture({ row: null });
  const r = await call();
  assert.equal(r.canonical.standing, "SOURCE_NOT_FOUND");
  assert.equal(r.findings.find(f => f.key === "CUSTODY_DIGEST")?.coverage, "MISSING");
  assert.equal(r.findings.find(f => f.key === "MANDATE_CURRENTNESS")?.coverage, "MISSING");
  nonoperative(r);
});
test("orphan authority is a source conflict not a favorable record", async () => {
  const row = instrument();
  const { call } = fixture({ row: {
    ...row, authorities: [{ ...row.authorities[0], holderPartyId: "foreign-party" }],
  } });
  const r = await call();
  assert.equal(r.disposition, "BLOCKED_SOURCE_CONFLICT");
  assert.ok(r.sourceConflicts.includes("CANONICAL:AUTHORITY_HOLDER_PARTY_NOT_FOUND"));
  nonoperative(r);
});
test("inactive issuer recognition cannot be promoted to competence", async () => {
  const { call } = fixture({ issuerActive: false });
  const r = await call();
  assert.equal(r.findings.find(f => f.key === "ISSUER_COMPETENCE")?.coverage, "MISSING");
  assert.equal(r.disposition, "BLOCKED_SOURCE_INCOMPLETE");
  nonoperative(r);
});
test("candidate missing is reported without granting document scope", async () => {
  const { call } = fixture();
  const r = await call({ candidate: null });
  assert.equal(r.findings.find(f => f.key === "DOCUMENT_SCOPE")?.coverage, "MISSING");
  assert.equal(r.coverage.decisions.evidence, "SOURCE_INCOMPLETE");
  nonoperative(r);
});
test("read errors propagate and are never converted into missing authority", async () => {
  const { call } = fixture({ throwRead: true });
  await assert.rejects(call(), /SYNTHETIC_CANONICAL_READ_FAILURE/);
});
test("untrusted inputs are never promoted to verified authority facts", async () => {
  const { call } = fixture();
  const r = await call();
  assert.ok(!("mandateVerified" in r));
  assert.ok(!("mandateActive" in r));
  assert.equal(r.canonical.canonicalInstitutionId, null);
  assert.equal(r.canonical.evidenceAuthenticated, false);
  assert.equal(r.canonical.mandateCurrentAuthenticated, false);
  nonoperative(r);
});
