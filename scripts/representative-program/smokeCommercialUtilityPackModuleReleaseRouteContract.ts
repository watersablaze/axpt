import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync(
  "app/api/admin/representative-program/commercial-utility-packs/release-module/route.ts",
  "utf8",
);

assert.match(route, /export async function POST/);
assert.match(route, /await getPrincipal\(\)/);
assert.match(route, /!isAdmin\(principal\)/);
assert.ok(route.indexOf("!isAdmin(principal)") < route.indexOf("await request.json()"));
console.log("✓ module release is authenticated admin POST");

assert.match(route, /packageId: z\.string\(\)\.trim\(\)\.min\(1\)\.max\(191\)/);
assert.match(route, /confirmRelease: z\.literal\(true\)/);
assert.match(route, /\.strict\(\)/);
for (const module of [
  "REPRESENTATION", "COMMERCIAL_PARAMETERS",
  "DOCUMENTS", "OPERATING_BOUNDARIES",
]) {
  assert.ok(route.includes(`"${module}"`));
}
console.log("✓ strict request requires package, module, and explicit confirmation");

assert.match(route, /await releaseCommercialUtilityPackModule\(\{/);
assert.match(route, /actorUserId: principal\.userId/);
assert.equal(
  (route.match(/await releaseCommercialUtilityPackModule\(/g) || []).length,
  1,
);
console.log("✓ one canonical application owns the release decision");

assert.match(route, /private, no-store, max-age=0/);
assert.match(route, /MODULE_RELEASE_CONFLICT/);
assert.match(route, /MODULE_RELEASE_FAILED/);
assert.doesNotMatch(route, /error\.message\s*[,}]/);
console.log("✓ responses are no-store with bounded error disclosure");

assert.doesNotMatch(route, /prisma\.\w+\.(create|update|upsert|delete)/);
assert.doesNotMatch(route, /prepareAndApply|reconcileCommercialUtilityPack|releaseCommercialUtilityPackResource/);
assert.doesNotMatch(route, /canView|canDownload|canPresent|canTransmit/);
console.log("✓ route performs no independent mutation or permission change");

console.log("CUP_1G_MODULE_RELEASE_ROUTE_CONTRACT_OK");
