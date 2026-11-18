import assert from "node:assert/strict";
import { test } from "node:test";
import {
  loadCanonicalInstitutionalMandateSourcesWithClient,
  type CanonicalMandateSourceClient,
} from "./loadCanonicalInstitutionalMandateSourcesWithClient";

const at = new Date("2026-11-18T12:00:00.000Z");
type Row = {
  id: string; reference: string; status: string;
  parties: { id: string; instrumentId: string; userId: string | null }[];
  authorities: {
    id: string; instrumentId: string; holderPartyId: string | null;
    authorityKey: string; action: string; effectiveAt: Date;
    expiresAt: Date | null; revokedAt: Date | null;
  }[];
  evidence: {
    id: string; instrumentId: string; subjectId: string | null;
    uri: string | null; contentHash: string | null; recordedByUserId: string;
  }[];
};
const fixture = (): Row => ({
  id: "instrument-1", reference: "SYNTHETIC-MANDATE", status: "DRAFT",
  parties: [{ id: "party-1", instrumentId: "instrument-1", userId: "holder-1" }],
  authorities: [{
    id: "authority-1", instrumentId: "instrument-1", holderPartyId: "party-1",
    authorityKey: "DRAFT-ADMISSION", action: "REGISTER_DRAFT_INSTRUMENT",
    effectiveAt: new Date("2026-11-01T00:00:00.000Z"),
    expiresAt: new Date("2026-12-01T00:00:00.000Z"), revokedAt: null,
  }],
  evidence: [{
    id: "evidence-1", instrumentId: "instrument-1",
    subjectId: "instrument-1", uri: "synthetic://source",
    contentHash: "ab".repeat(32), recordedByUserId: "recorder-1",
  }],
});
const create = (row: Row | null = fixture(), fail = false) => {
  const calls: string[] = [];
  const client = { institutionalInstrument: {
    findUnique: async ({ where }: { where: { reference: string } }) => {
      calls.push(where.reference);
      if (fail) throw new Error("SYNTHETIC_SOURCE_READ_FAILED");
      return row;
    },
  } } as unknown as CanonicalMandateSourceClient;
  return { client, calls };
};
const load = (client: CanonicalMandateSourceClient, sessionUserId: string | null = "holder-1") =>
  loadCanonicalInstitutionalMandateSourcesWithClient({
    client, sessionUserId, holderUserId: "holder-1",
    instrumentReference: "SYNTHETIC-MANDATE", at,
  });
function nonoperative(r: Awaited<ReturnType<typeof load>>) {
  assert.equal(r.canonicalInstitutionId, null);
  assert.equal(r.issuerCompetenceAuthenticated, false);
  assert.equal(r.evidenceAuthenticated, false);
  assert.equal(r.mandateCurrentAuthenticated, false);
  assert.equal(r.operativeAuthorityEstablished, false);
  assert.equal(r.admissionAuthorized, false);
}
test("complete canonical associations remain unauthenticated and nonoperative", async () => {
  const { client, calls } = create();
  const r = await load(client);
  assert.equal(r.standing, "SOURCE_UNAUTHENTICATED");
  assert.deepEqual(calls, ["SYNTHETIC-MANDATE"]);
  assert.equal(r.holderPartyId, "party-1");
  assert.deepEqual(r.authorityCandidates.map(x => x.id), ["authority-1"]);
  assert.deepEqual(r.evidenceReferences.map(x => x.id), ["evidence-1"]);
  assert.ok(r.reasons.includes("CANONICAL_INSTITUTION_ID_NOT_PROVEN"));
  nonoperative(r);
});
test("session must match holder before any institutional lookup", async () => {
  const { client, calls } = create();
  const r = await load(client, "attacker-user");
  assert.equal(r.standing, "SOURCE_CONFLICTED");
  assert.deepEqual(calls, []);
  nonoperative(r);
  const absent = await load(client, null);
  assert.equal(absent.standing, "SOURCE_CONFLICTED");
  assert.deepEqual(calls, []);
});
test("missing instrument is distinct from missing authority", async () => {
  const { client } = create(null);
  const r = await load(client);
  assert.equal(r.standing, "SOURCE_NOT_FOUND");
  nonoperative(r);
});
test("missing holder and duplicate holder fail closed", async () => {
  const row = fixture();
  // Missing holder plus an authority referencing that absent party is a
  // conflict, not merely an incomplete record. Preserve fail-closed priority.
  const missingWithOrphan = await load(create({ ...row, parties: [] }).client);
  assert.equal(missingWithOrphan.standing, "SOURCE_CONFLICTED");
  assert.ok(missingWithOrphan.reasons.includes("AUTHORITY_HOLDER_PARTY_NOT_FOUND"));
  nonoperative(missingWithOrphan);
  // Without the orphan authority, a missing holder is incomplete only.
  const missing = await load(create({ ...row, parties: [], authorities: [] }).client);
  assert.equal(missing.standing, "SOURCE_INCOMPLETE");
  assert.ok(missing.reasons.includes("HOLDER_PARTY_NOT_FOUND"));
  nonoperative(missing);
  const duplicate = await load(create({
    ...row, parties: [...row.parties, { ...row.parties[0], id: "party-2" }],
  }).client);
  assert.equal(duplicate.standing, "SOURCE_CONFLICTED");
  assert.ok(duplicate.reasons.includes("DUPLICATE_HOLDER_PARTIES"));
  nonoperative(duplicate);
});
test("cross-instrument parties, authorities and evidence are rejected", async () => {
  const row = fixture();
  for (const altered of [
    { ...row, parties: [{ ...row.parties[0], instrumentId: "foreign" }] },
    { ...row, authorities: [{ ...row.authorities[0], instrumentId: "foreign" }] },
    { ...row, evidence: [{ ...row.evidence[0], instrumentId: "foreign" }] },
  ]) {
    const r = await load(create(altered).client);
    assert.equal(r.standing, "SOURCE_CONFLICTED");
    nonoperative(r);
  }
});
test("orphan authority holder and malformed lifecycle are explicit conflicts", async () => {
  const row = fixture();
  const orphan = await load(create({ ...row, authorities: [{
    ...row.authorities[0], holderPartyId: "not-in-this-instrument",
  }] }).client);
  assert.ok(orphan.reasons.includes("AUTHORITY_HOLDER_PARTY_NOT_FOUND"));
  nonoperative(orphan);
  const malformed = await load(create({ ...row, authorities: [{
    ...row.authorities[0], expiresAt: new Date("2026-10-01T00:00:00.000Z"),
  }] }).client);
  assert.ok(malformed.reasons.includes("AUTHORITY_RECORD_MALFORMED"));
  nonoperative(malformed);
});
test("competing same-holder authority slots never choose newest or favorable row", async () => {
  const row = fixture();
  const r = await load(create({ ...row, authorities: [
    row.authorities[0], {
      ...row.authorities[0], id: "authority-2",
      revokedAt: new Date("2026-11-15T00:00:00.000Z"),
    },
  ] }).client);
  assert.equal(r.standing, "SOURCE_CONFLICTED");
  assert.ok(r.reasons.includes("COMPETING_HOLDER_AUTHORITY_SLOT"));
  assert.equal(r.authorityCandidates.length, 2);
  nonoperative(r);
});
test("unrelated and revoked authority records remain visible without granting", async () => {
  const row = fixture();
  const r = await load(create({ ...row, authorities: [
    { ...row.authorities[0], revokedAt: new Date("2026-11-17T00:00:00.000Z") },
    { ...row.authorities[0], id: "unrelated", holderPartyId: null,
      authorityKey: "OTHER", action: "OTHER" },
  ] }).client);
  assert.equal(r.standing, "SOURCE_UNAUTHENTICATED");
  assert.equal(r.authorityCandidates.length, 2);
  nonoperative(r);
});
test("missing holder authority and evidence attribution are incomplete", async () => {
  const row = fixture();
  const missingAuthority = await load(create({ ...row, authorities: [] }).client);
  assert.equal(missingAuthority.standing, "SOURCE_INCOMPLETE");
  assert.ok(missingAuthority.reasons.includes("HOLDER_AUTHORITY_NOT_FOUND"));
  const missingRecorder = await load(create({ ...row, evidence: [{
    ...row.evidence[0], recordedByUserId: "",
  }] }).client);
  assert.equal(missingRecorder.standing, "SOURCE_INCOMPLETE");
  assert.ok(missingRecorder.reasons.includes("EVIDENCE_RECORDER_MISSING"));
  nonoperative(missingRecorder);
});
test("database read failures propagate instead of fabricating absence", async () => {
  const { client } = create(fixture(), true);
  await assert.rejects(load(client), /SYNTHETIC_SOURCE_READ_FAILED/);
});
