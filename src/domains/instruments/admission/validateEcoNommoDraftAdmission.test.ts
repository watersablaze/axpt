import assert from "node:assert/strict";
import { test } from "node:test";
import { validateEcoNommoDraftAdmission } from "./validateEcoNommoDraftAdmission";

// All fixtures are synthetic. Never paste private source text, credentials, or hashes here.
const valid = () => ({
  collectionKey: "ECO_NOMMO",
  libraryReference: "EN-00",
  sourceReference: "EXAMPLE-SOURCE-01",
  sourceEdition: "Review Edition 01",
  title: "Synthetic constitutional review example",
  kind: "GENERAL",
  instrumentStatus: "DRAFT",
  versionStatus: "DRAFT",
  custodyReference: "private-fixture-key",
  sourceSha256: "ab".repeat(32),
  actorUserId: "synthetic-actor",
  correlationId: "synthetic-correlation",
});

function rejected(input: unknown, code: string) {
  const result = validateEcoNommoDraftAdmission(input);
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.includes(code), result.errors.join(", "));
}

test("accepts a synthetic draft-only application without mutation", () => {
  const candidate = valid();
  const snapshot = JSON.stringify(candidate);
  const result = validateEcoNommoDraftAdmission(candidate);
  assert.equal(result.ok, true);
  assert.equal(JSON.stringify(candidate), snapshot);
  if (result.ok) {
    assert.equal(result.value.versionStatus, "DRAFT");
    assert.equal(result.value.instrumentStatus, "DRAFT");
    assert.equal(result.value.sourceReference, "EXAMPLE-SOURCE-01");
    assert.equal(result.value.sourceSha256, "ab".repeat(32));
    assert.notEqual(result.value, candidate);
  }
});

test("rejects absence of a structured application", () => {
  rejected(null, "ADMISSION_OBJECT_REQUIRED");
  rejected([], "ADMISSION_OBJECT_REQUIRED");
});

test("rejects missing required fields", () => {
  const candidate = valid();
  delete (candidate as Partial<typeof candidate>).sourceEdition;
  rejected(candidate, "MISSING_FIELD:sourceEdition");
});

test("rejects extra keys that might falsely claim authority or operation", () => {
  rejected({ ...valid(), financialActivation: true }, "UNKNOWN_FIELD:financialActivation");
  rejected({ ...valid(), legalEffect: "RATIFIED" }, "UNKNOWN_FIELD:legalEffect");
});

test("rejects issuance, execution, and activation states", () => {
  rejected({ ...valid(), instrumentStatus: "ACTIVE" }, "DRAFT_ONLY");
  rejected({ ...valid(), instrumentStatus: "EXECUTED" }, "DRAFT_ONLY");
  rejected({ ...valid(), versionStatus: "ISSUED" }, "DRAFT_ONLY");
});

test("rejects unknown collection, identity, and kind", () => {
  rejected({ ...valid(), collectionKey: "OTHER" }, "INVALID_COLLECTION_KEY");
  rejected({ ...valid(), libraryReference: "EN-99" }, "INVALID_LIBRARY_REFERENCE");
  rejected({ ...valid(), kind: "CONSTITUTION" }, "UNQUALIFIED_INSTRUMENT_KIND");
});

test("rejects incomplete provenance and attribution", () => {
  rejected({ ...valid(), sourceReference: "" }, "INVALID_SOURCE_REFERENCE");
  rejected({ ...valid(), sourceEdition: "" }, "INVALID_SOURCE_EDITION");
  rejected({ ...valid(), title: "   " }, "INVALID_TITLE");
  rejected({ ...valid(), custodyReference: "" }, "INVALID_CUSTODY_REFERENCE");
  rejected({ ...valid(), sourceSha256: "not-a-hash" }, "INVALID_SOURCE_SHA256");
  rejected({ ...valid(), actorUserId: "" }, "INVALID_ACTOR_ID");
  rejected({ ...valid(), correlationId: "" }, "INVALID_CORRELATION_ID");
});

test("normalizes the digest without implying its verification", () => {
  const result = validateEcoNommoDraftAdmission({
    ...valid(), sourceSha256: "AB".repeat(32),
  });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.sourceSha256, "ab".repeat(32));
});
