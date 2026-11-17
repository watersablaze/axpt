import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateEcoNommoAdmissionAuthority } from "./evaluateEcoNommoAdmissionAuthority";
import type { EcoNommoDraftAdmission } from "./validateEcoNommoDraftAdmission";

const at = new Date("2026-11-17T12:00:00.000Z");
const admission: EcoNommoDraftAdmission = {
  collectionKey: "ECO_NOMMO",
  libraryReference: "EN-00",
  sourceReference: "SYNTHETIC-SOURCE-001",
  sourceEdition: "Review 01",
  title: "Synthetic manifest",
  kind: "GENERAL",
  instrumentStatus: "DRAFT",
  versionStatus: "DRAFT",
  custodyReference: "synthetic-private-custody",
  sourceSha256: "ab".repeat(32),
  actorUserId: "synthetic-actor",
  correlationId: "synthetic-request",
};

const facts = () => ({
  actorUserId: "synthetic-actor",
  persistedSessionVerified: true,
  sessionEligible: true,
  permissionKeys: ["admin.access", "INSTRUMENT_DRAFT_ADMIT"],
  institutionalCapacity: "DOCUMENTARY_ADMISSION_OFFICER",
  institutionId: "synthetic-institution",
  mandateId: "synthetic-mandate",
  mandateVerified: true,
  mandateActive: true,
  mandateInstitutionId: "synthetic-institution",
  mandateHolderUserId: "synthetic-actor",
  mandateAction: "REGISTER_DRAFT_INSTRUMENT",
  mandateCollectionKey: "ECO_NOMMO",
  mandateLibraryReference: "EN-00",
  mandateSourceReference: "SYNTHETIC-SOURCE-001",
  mandateSourceEdition: "Review 01",
  mandateExpiresAt: "2026-12-31T00:00:00.000Z" as string | null,
});

function expectDenied(
  input: Parameters<typeof evaluateEcoNommoAdmissionAuthority>[1],
  reason: string,
  candidate = admission,
) {
  const result = evaluateEcoNommoAdmissionAuthority(candidate, input, at);
  assert.equal(result.permitted, false);
  if (!result.permitted) assert.ok(result.reasons.includes(reason), result.reasons.join(", "));
}

test("synthetic complete facts satisfy only further-qualification gate", () => {
  const result = evaluateEcoNommoAdmissionAuthority(admission, facts(), at);
  assert.deepEqual(result, { permitted: true, decision: "ELIGIBLE_FOR_FURTHER_QUALIFICATION" });
});

test("missing trusted facts and invalid time fail closed", () => {
  expectDenied(null, "TRUSTED_AUTHORITY_FACTS_REQUIRED");
  const result = evaluateEcoNommoAdmissionAuthority(admission, facts(), new Date(NaN));
  assert.equal(result.permitted, false);
  if (!result.permitted) assert.ok(result.reasons.includes("INVALID_DECISION_TIME"));
});

test("general admin access is insufficient", () => {
  expectDenied({ ...facts(), permissionKeys: ["admin.access"] }, "ADMISSION_PERMISSION_MISSING");
});

test("persisted verification and ongoing eligibility are both required", () => {
  expectDenied({ ...facts(), persistedSessionVerified: false }, "PERSISTED_SESSION_NOT_VERIFIED");
  expectDenied({ ...facts(), sessionEligible: false }, "SESSION_NOT_ELIGIBLE");
});

test("request actor cannot override authenticated actor", () => {
  expectDenied({ ...facts(), actorUserId: "different-actor" }, "ACTOR_BINDING_MISMATCH");
  expectDenied({ ...facts(), mandateHolderUserId: "different-actor" }, "MANDATE_HOLDER_OR_INSTITUTION_MISMATCH");
});

test("institution, capacity and qualified mandate are mandatory", () => {
  expectDenied({ ...facts(), institutionId: "" }, "INSTITUTIONAL_CAPACITY_MISSING");
  expectDenied({ ...facts(), institutionalCapacity: "" }, "INSTITUTIONAL_CAPACITY_MISSING");
  expectDenied({ ...facts(), mandateVerified: false }, "QUALIFIED_ACTIVE_MANDATE_MISSING");
  expectDenied({ ...facts(), mandateActive: false }, "QUALIFIED_ACTIVE_MANDATE_MISSING");
  expectDenied({ ...facts(), mandateInstitutionId: "other-institution" }, "MANDATE_HOLDER_OR_INSTITUTION_MISMATCH");
});

test("mandate scope binds collection, document, edition and action", () => {
  expectDenied({ ...facts(), mandateAction: "AUTHORIZE_TRANSFER" }, "MANDATE_SCOPE_MISMATCH");
  expectDenied({ ...facts(), mandateCollectionKey: "OTHER" }, "MANDATE_SCOPE_MISMATCH");
  expectDenied({ ...facts(), mandateLibraryReference: "EN-03" }, "MANDATE_SCOPE_MISMATCH");
  expectDenied({ ...facts(), mandateSourceReference: "OTHER" }, "MANDATE_SCOPE_MISMATCH");
  expectDenied({ ...facts(), mandateSourceEdition: "Edition 99" }, "MANDATE_SCOPE_MISMATCH");
});

test("issued or activated intake fails even with otherwise qualified context", () => {
  const invalid = { ...admission, versionStatus: "ISSUED" } as unknown as EcoNommoDraftAdmission;
  expectDenied(facts(), "MANDATE_SCOPE_MISMATCH", invalid);
});

test("mandate expiry is enforced at the decision instant", () => {
  expectDenied({ ...facts(), mandateExpiresAt: "2026-11-17T12:00:00.000Z" }, "MANDATE_EXPIRED_OR_INVALID");
  expectDenied({ ...facts(), mandateExpiresAt: "invalid" }, "MANDATE_EXPIRED_OR_INVALID");
  const withoutExpiry = evaluateEcoNommoAdmissionAuthority(admission, { ...facts(), mandateExpiresAt: null }, at);
  assert.equal(withoutExpiry.permitted, true);
});
