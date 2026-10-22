import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const domain = readFileSync(
  "src/domains/instruments/representative-program/communications/representativeFieldCommunications.ts",
  "utf8",
);

const route = readFileSync(
  "app/api/representative/communications/stream/route.ts",
  "utf8",
);

assert.match(
  domain,
  /export async function resolveRepresentativeFieldRealtimeScopeWithClient/,
);

assert.match(
  domain,
  /resolveParticipant/,
);

assert.match(
  domain,
  /requireInstitutionalOperator/,
);

assert.match(
  domain,
  /roomClass !==\s*"GENERAL_OPERATIONS"/,
);

assert.match(
  domain,
  /conversation\.status !==\s*"ACTIVE"/,
);

assert.match(
  domain,
  /ARP_FIELD_COMMUNICATIONS_MEMBERSHIP_CONFLICT/,
);

assert.match(
  route,
  /getPrincipal\(\)/,
);

assert.match(
  route,
  /resolveRepresentativeFieldRealtimeScopeWithClient/,
);

assert.match(
  route,
  /loadCommunicationRealtimeSignalsForMemberWithClient/,
);

assert.match(
  route,
  /loadCommunicationReflectionRealtimeSignalsForMemberWithClient/,
);

assert.match(
  route,
  /conversationIds,\s*\}\)/,
);

assert.match(
  route,
  /scope\.conversationId/,
);

assert.match(
  route,
  /while \([\s\S]*active[\s\S]*!abortSignal\.aborted/,
);

const scopeResolutionMatches =
  route.match(
    /resolveRepresentativeFieldRealtimeScopeWithClient/g,
  ) ?? [];

assert.ok(
  scopeResolutionMatches.length >= 2,
  "Field scope must be resolved before opening and again during polling",
);

assert.match(
  route,
  /text\/event-stream/,
);

assert.match(
  route,
  /no-cache, no-transform/,
);

assert.match(
  route,
  /heartbeat/,
);

assert.match(
  route,
  /deliveredEventIds/,
);

assert.match(
  route,
  /deliveredReflectionIds/,
);

assert.doesNotMatch(
  route,
  /PERMISSIONS\.COMMUNICATIONS_ACCESS/,
);

assert.doesNotMatch(
  route,
  /authorityKernel/,
);

assert.doesNotMatch(
  route,
  /loadCommunicationRealtimeSignalsWithClient\(/,
);

assert.doesNotMatch(
  route,
  /loadCommunicationReflectionRealtimeSignalsWithClient\(/,
);

assert.doesNotMatch(
  route,
  /communicationMessage\.find/,
);

assert.doesNotMatch(
  route,
  /communicationOperationalReflection\.find/,
);

assert.doesNotMatch(
  route,
  /body:/,
);

assert.doesNotMatch(
  route,
  /reflectionCode/,
);

assert.doesNotMatch(
  route,
  /sourceAggregate/,
);

console.log(
  "✓ ARP Field realtime stream contract passed",
);
