import assert from "node:assert/strict";
import type { PrismaClient } from "@prisma/client";
import { loadChamberV2InstitutionalMandateSourceWithClient } from "../../src/domains/instruments/global-mother/loadChamberV2InstitutionalMandateSourceWithClient";

const at = new Date("2026-10-28T12:00:00.000Z");
const base = {
  id: "i1", status: "ACTIVE",
  parties: [{ id: "p1", instrumentId: "i1", userId: "u1" }],
  authorities: [{
    id: "a1", instrumentId: "i1", holderPartyId: "p1",
    effectiveAt: new Date("2026-01-01T00:00:00.000Z"),
    expiresAt: null, revokedAt: null,
  }],
  evidence: [{ id: "e1", instrumentId: "i1", subjectType: "AUTHORITY",
    subjectId: "a1", contentHash: "abc", uri: "private://document" }],
};
let checks = 0;
async function evaluate(snapshot: unknown, subjectUserId = "u1") {
  let reads = 0;
  const client = {
    institutionalInstrument: { findUnique: async () => { reads++; return snapshot; } },
  } as unknown as Pick<PrismaClient, "institutionalInstrument">;
  const answer = await loadChamberV2InstitutionalMandateSourceWithClient({
    client, instrumentReference: "MANDATE-1", subjectUserId, at,
  });
  assert.equal(reads, 1); checks++;
  assert.equal(answer.operationallyUsable, false); checks++;
  return answer;
}
async function main() {
  assert.equal((await evaluate(null)).standing, "SOURCE_NOT_FOUND"); checks++;
  assert.equal((await evaluate(base, "different")).standing, "SUBJECT_NOT_BOUND"); checks++;
  assert.equal((await evaluate({...base, parties: [...base.parties, {...base.parties[0], id: "p2"}]})).standing, "SOURCE_CONFLICTED"); checks++;
  assert.equal((await evaluate({...base, parties: [{...base.parties[0], instrumentId: "wrong"}]})).standing, "SOURCE_CONFLICTED"); checks++;
  assert.equal((await evaluate({...base, authorities: [{...base.authorities[0], instrumentId: "wrong"}]})).standing, "SOURCE_CONFLICTED"); checks++;
  assert.equal((await evaluate({...base, evidence: [{...base.evidence[0], instrumentId: "wrong"}]})).standing, "SOURCE_CONFLICTED"); checks++;
  assert.equal((await evaluate({...base, authorities: [...base.authorities, {...base.authorities[0], id: "a2"}]})).standing, "SOURCE_CONFLICTED"); checks++;
  assert.equal((await evaluate({...base, authorities: [{...base.authorities[0], effectiveAt: new Date("invalid") }]})).standing, "SOURCE_CONFLICTED"); checks++;
  assert.equal((await evaluate({...base, authorities: [{...base.authorities[0], revokedAt: at }]})).standing, "SOURCE_UNAUTHENTICATED"); checks++;
  assert.equal((await evaluate({...base, authorities: [{...base.authorities[0], expiresAt: at }]})).standing, "SOURCE_UNAUTHENTICATED"); checks++;
  assert.equal((await evaluate({...base, authorities: []})).standing, "SOURCE_UNAUTHENTICATED"); checks++;
  assert.equal((await evaluate({...base, evidence: []})).standing, "SOURCE_UNAUTHENTICATED"); checks++;
  const positiveLooking = await evaluate(base);
  assert.equal(positiveLooking.standing, "SOURCE_UNAUTHENTICATED"); checks++;
  assert.deepEqual(positiveLooking.candidateAuthorityIds, ["a1"]); checks++;
  assert.deepEqual(positiveLooking.evidenceIds, ["e1"]); checks++;
  console.log(`GM-V2.1B.2B.4B: ${checks} assertions passed; source remains unauthenticated.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
