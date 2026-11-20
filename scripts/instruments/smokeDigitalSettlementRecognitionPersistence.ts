import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const schemaPath =
  path.resolve(
    process.cwd(),
    "prisma/schema.prisma",
  );

const migrationPath =
  path.resolve(
    process.cwd(),
    "prisma/migrations/20260922123000_bind_dsi_verification_recognition/migration.sql",
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
  /verificationObservationId\s+String\?\s+@unique/,
);

assert.match(
  schema,
  /verificationInstrumentVersionId\s+String\?/,
);

assert.match(
  schema,
  /verificationObservation\s+TreasurySettlementObservation\?/,
);

assert.match(
  schema,
  /verificationInstrumentVersion\s+InstrumentVersion\?/,
);

assert.match(
  schema,
  /DigitalSettlementVerificationObservation/,
);

assert.match(
  schema,
  /DigitalSettlementVerificationInstrumentVersion/,
);

assert.match(
  schema,
  /@@index\(\[verificationInstrumentVersionId\]\)/,
);

assert.match(
  migration,
  /verificationObservationId/,
);

assert.match(
  migration,
  /verificationInstrumentVersionId/,
);

assert.match(
  migration,
  /CREATE UNIQUE INDEX[\s\S]*verificationObservationId/,
);

assert.match(
  migration,
  /REFERENCES "TreasurySettlementObservation"\("id"\)/,
);

assert.match(
  migration,
  /REFERENCES "InstrumentVersion"\("id"\)/,
);

assert.doesNotMatch(
  migration,
  /UPDATE\s+"DigitalSettlementInstruction"/i,
);

assert.doesNotMatch(
  migration,
  /verificationTxHash"\s*=/,
);

assert.doesNotMatch(
  migration,
  /principalAuthorizedAt"\s*=/,
);

assert.doesNotMatch(
  migration,
  /settlementStatus"\s*=/,
);

console.log(
  "DSI_RECOGNITION_OBSERVATION_BINDING_SCHEMA_OK",
);

console.log(
  "DSI_RECOGNITION_VERSION_BINDING_SCHEMA_OK",
);

console.log(
  "DSI_RECOGNITION_OBSERVATION_UNIQUENESS_OK",
);

console.log(
  "DSI_RECOGNITION_MIGRATION_NO_LIFECYCLE_MUTATION_OK",
);
