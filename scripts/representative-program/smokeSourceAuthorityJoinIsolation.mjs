import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const Module = require("node:module");
const helperPath = require.resolve(
  "../../src/infrastructure/db/sourceAuthorityJoinGraph.ts"
);
const originalLoad = Module._load;
let withSourceAuthorityJoinGraph;
try {
  Module._load = function(request, parent, isMain) {
    if (request === "server-only" && parent?.filename === helperPath) {
      return {};
    }
    return originalLoad.apply(this, arguments);
  };
  ({ withSourceAuthorityJoinGraph } = require(helperPath));
} finally {
  Module._load = originalLoad;
}

const client = new PrismaClient();
try {
  assert.ok(!client._engineConfig.previewFeatures.includes("relationJoins"),
    "Main client must retain existing relation behavior");
  const adapted = withSourceAuthorityJoinGraph(client);
  assert.equal(adapted.institutionalInstrument, client.institutionalInstrument);
  assert.equal(adapted.instrumentVersion, client.instrumentVersion);
  assert.equal(adapted.sourceAuthorityProfileParticulars, client.sourceAuthorityProfileParticulars);
  assert.equal(adapted.commercialUtilityPack, client.commercialUtilityPack);
  assert.notEqual(adapted.sourceAuthorityRecord, client.sourceAuthorityRecord);
  assert.ok(global.arpSourceAuthorityJoinClient._engineConfig.previewFeatures.includes("relationJoins"));
  assert.equal(adapted.sourceAuthorityRecord, withSourceAuthorityJoinGraph(client).sourceAuthorityRecord);
  console.log("SOURCE_AUTHORITY_JOIN_ISOLATION_OK: main strategy unchanged; only graph delegate replaced; dedicated client reused; no database queries.");
} finally {
  await client.$disconnect();
  await global.arpSourceAuthorityJoinClient?.$disconnect();
}
