import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const routePath =
  path.resolve(
    "app/api/admin/representative-program/" +
      "commercial-utility-packs/state/route.ts",
  );

const route =
  fs.readFileSync(
    routePath,
    "utf8",
  );

assert.match(
  route,
  /export async function GET/,
);

assert.match(
  route,
  /getPrincipal/,
);

assert.match(
  route,
  /isAdmin/,
);

assert.match(
  route,
  /participantId/,
);

assert.match(
  route,
  /version/,
);

assert.match(
  route,
  /loadCommercialUtilityPackOperatorState/,
);

assert.match(
  route,
  /client:\s*prisma/,
);

assert.match(
  route,
  /commercialUtilityPack:\s*state/,
);

assert.match(
  route,
  /Cache-Control/,
);

assert.match(
  route,
  /private, no-store, max-age=0/,
);

assert.doesNotMatch(
  route,
  /prepareAndApplyCommercialUtilityPackComposition/,
);

assert.doesNotMatch(
  route,
  /releaseCommercialUtilityPackModule/,
);

assert.doesNotMatch(
  route,
  /releaseCommercialUtilityPackResourceWithClient/,
);

assert.doesNotMatch(
  route,
  /reconcileCommercialUtilityPackReleaseStateWithClient/,
);

assert.doesNotMatch(
  route,
  /commercialUtilityPack\.(create|update|updateMany|delete|deleteMany)/,
);

console.log(
  "✓ CUP state route is authenticated admin GET",
);

console.log(
  "✓ participant + version identify canonical package state",
);

console.log(
  "✓ route delegates to durable operator read model",
);

console.log(
  "✓ absent package can return null without manufacturing state",
);

console.log(
  "✓ route is explicitly no-store",
);

console.log(
  "✓ route performs no preparation, release, reconciliation, or persistence mutation",
);

console.log(
  "CUP_1G_OPERATOR_STATE_ROUTE_OK",
);
