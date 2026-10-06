import assert from "node:assert/strict";
import fs from "node:fs";

const commandPath =
  "src/domains/instruments/source-authority/evidence/admitBafoulaSourceProfileEvidenceWithClient.ts";

const schemaPath =
  "prisma/schema.prisma";

const migrationPath =
  "prisma/migrations/20261003101513_add_source_authority_instrument/migration.sql";

const command =
  fs.readFileSync(
    commandPath,
    "utf8",
  );

const schema =
  fs.readFileSync(
    schemaPath,
    "utf8",
  );

const migration =
  fs.readFileSync(
    migrationPath,
    "utf8",
  );

assert.match(
  schema,
  /model SourceAuthorityEvidenceAdmission \{/,
);

assert.match(
  schema,
  /@@unique\(\[sourceAuthorityId, evidenceRole\]\)/,
);

assert.match(
  schema,
  /evidenceId\s+String\?\s+@unique/,
);

assert.match(
  migration,
  /CREATE TABLE "SourceAuthorityEvidenceAdmission"/,
);

assert.match(
  migration,
  /SourceAuthorityEvidenceAdmission_sourceAuthorityId_evidence_key/,
);

assert.match(
  migration,
  /ON DELETE CASCADE/,
);

assert.match(
  migration,
  /ON DELETE RESTRICT/,
);

assert.match(
  command,
  /sourceAuthorityEvidenceAdmission[\s\S]*createMany/,
);

assert.match(
  command,
  /skipDuplicates:\s*true/,
);

assert.match(
  command,
  /claimed\.count === 0/,
);

assert.match(
  command,
  /sourceAuthorityId_evidenceRole/,
);

assert.match(
  command,
  /recordInstrumentEvidenceWithClient/,
);

assert.match(
  command,
  /sourceAuthorityEvidenceAdmission[\s\S]*updateMany/,
);

assert.match(
  command,
  /evidenceId:\s*null/,
);

assert.match(
  command,
  /recorded\.evidence\.id/,
);

assert.match(
  command,
  /BAFOULA_SOURCE_PROFILE_EVIDENCE_ADMISSION_BIND_CONCURRENCY_CONFLICT/,
);

const claimIndex =
  command.indexOf(
    ".createMany({",
  );

const recordIndex =
  command.indexOf(
    "recordInstrumentEvidenceWithClient({",
  );

const bindIndex =
  command.indexOf(
    ".updateMany({",
  );

assert.ok(
  claimIndex >= 0,
  "CLAIM_CREATE_NOT_FOUND",
);

assert.ok(
  recordIndex > claimIndex,
  "EVIDENCE_MUST_BE_RECORDED_AFTER_CLAIM",
);

assert.ok(
  bindIndex > recordIndex,
  "CLAIM_MUST_BE_BOUND_AFTER_EVIDENCE_RECORD",
);

assert.doesNotMatch(
  command,
  /\.instrumentEvidence\s*\n?\s*\.findFirst/,
);

assert.doesNotMatch(
  command,
  /recordSourceAuthorityRecognitionWithClient/,
);

console.log(
  "✓ Bafoula evidence concurrency contract smoke passed",
);

console.log({
  genericEvidenceRemainsAppendOriented:
    true,

  sourceAuthorityAdmissionClaim:
    true,

  claimBeforeEvidence:
    true,

  skipDuplicateClaim:
    true,

  evidenceBoundAfterRecording:
    true,

  recognitionMutation:
    false,
});
