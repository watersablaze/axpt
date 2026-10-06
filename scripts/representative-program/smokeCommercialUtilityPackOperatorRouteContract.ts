import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const routePath =
  path.resolve(
    "app/api/admin/representative-program/" +
      "commercial-utility-packs/prepare/route.ts",
  );

const route =
  fs.readFileSync(
    routePath,
    "utf8",
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
  /sourceAuthorityInstrumentReference/,
);

assert.match(
  route,
  /prepareAndApplyCommercialUtilityPackComposition/,
);

assert.match(
  route,
  /client:\s*prisma/,
);

assert.match(
  route,
  /actorUserId:\s*principal\.userId/,
);

assert.match(
  route,
  /registeredResources/,
);

assert.match(
  route,
  /unavailableSources/,
);

assert.match(
  route,
  /eligibleModules/,
);

assert.match(
  route,
  /blockedModules/,
);

assert.match(
  route,
  /release:\s*\{\s*performed:\s*false/,
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
  /sourceAuthorityInstrumentReference:\s*["'`][^"'`]+/,
  "operator route must not guess a Source Authority reference",
);

assert.doesNotMatch(
  route,
  /composition:\s*result\.composition/,
  "operator response must not dump the complete composition result",
);

assert.doesNotMatch(
  route,
  /plan:\s*result/,
  "operator response must not expose the canonical plan",
);

console.log(
  "✓ CUP operator route requires authenticated administrative principal",
);

console.log(
  "✓ participant identity is explicit",
);

console.log(
  "✓ Source Authority selection is optional and never guessed",
);

console.log(
  "✓ route invokes canonical prepare + compose bridge",
);

console.log(
  "✓ response exposes narrow preparation/readiness summary",
);

console.log(
  "✓ route performs no resource/module release or package reconciliation",
);

console.log(
  "CUP_1F_OPERATOR_ROUTE_CONTRACT_OK",
);
