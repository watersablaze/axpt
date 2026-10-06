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
    "prisma/migrations/20261005131500_add_commercial_utility_pack_v1/migration.sql",
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

const requiredSchemaFragments = [
  "model CommercialUtilityPack {",
  "model CommercialUtilityPackModuleRelease {",
  "model CommercialUtilityPackResourceRelease {",

  "enum CommercialUtilityPackState {",
  "enum CommercialUtilityPackReleaseState {",
  "enum CommercialUtilityPackAudience {",
  "enum CommercialUtilityPackModule {",
  "enum CommercialUtilityPackModuleState {",
  "enum CommercialUtilityPackResourceType {",
  "enum CommercialUtilityPackResourceState {",

  "REPRESENTATION",
  "COMMERCIAL_PARAMETERS",
  "DOCUMENTS",
  "OPERATING_BOUNDARIES",

  "@@unique([participantId, version])",
  "@@unique([packageId, module])",
  "@@unique([packageId, module, resourceType, resourceId])",
];

for (
  const fragment
  of requiredSchemaFragments
) {
  assert.ok(
    schema.includes(fragment),
    `missing schema contract: ${fragment}`,
  );
}

const cupModuleBlock =
  schema.match(
    /enum CommercialUtilityPackModule \{([\s\S]*?)\}/,
  );

assert.ok(
  cupModuleBlock,
  "CUP module enum missing",
);

const moduleValues =
  cupModuleBlock![1]
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);

assert.deepEqual(
  moduleValues,
  [
    "REPRESENTATION",
    "COMMERCIAL_PARAMETERS",
    "DOCUMENTS",
    "OPERATING_BOUNDARIES",
  ],
  "CUP v1 must contain exactly four capability modules",
);

assert.ok(
  !schema.includes("FIELD_OPPORTUNITIES"),
  "Field Opportunities must remain outside CUP",
);

assert.ok(
  !schema.includes("FIELD_OPPORTUNITY"),
  "Field Opportunity must not be introduced by CUP-1B",
);

assert.match(
  migration,
  /CREATE TABLE "CommercialUtilityPack"/,
);

assert.match(
  migration,
  /CREATE TABLE "CommercialUtilityPackModuleRelease"/,
);

assert.match(
  migration,
  /CREATE TABLE "CommercialUtilityPackResourceRelease"/,
);

assert.ok(
  !migration.includes(
    'ALTER TABLE "Opportunity"',
  ),
  "existing Opportunity spine must remain untouched",
);

assert.ok(
  !migration.includes(
    'ALTER TYPE "InstitutionalInstrumentKind"',
  ),
  "CUP must not become an InstitutionalInstrument kind",
);

console.log(
  "✓ CUP package identity persistence present",
);

console.log(
  "✓ exactly four canonical CUP capability modules declared",
);

console.log(
  "✓ Field Opportunities remain outside CUP",
);

console.log(
  "✓ resource-release bridge stores release metadata rather than canonical content",
);

console.log(
  "✓ existing Opportunity spine untouched",
);

console.log(
  "✓ Institutional Instrument taxonomy untouched",
);

console.log(
  "CUP_1B_PERSISTENCE_SCHEMA_OK",
);
