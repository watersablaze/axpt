import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const domain = readFileSync(
  "src/domains/instruments/representative-program/communications/representativeFieldCommunications.ts",
  "utf8",
);

const route = readFileSync(
  "app/api/representative/communications/read/route.ts",
  "utf8",
);

assert.match(
  domain,
  /markConversationReadForMemberWithClient/,
);

assert.match(
  domain,
  /export async function markRepresentativeFieldReadWithClient/,
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
  /COMMUNICATIONS_MEMBERSHIP_CONFLICT/,
);

assert.match(
  domain,
  /markConversationReadForMemberWithClient\(\{/,
);

assert.match(
  domain,
  /userId:\s*params\.userId/,
);

assert.match(
  domain,
  /throughMessageId,/,
);

assert.match(
  route,
  /export async function POST/,
);

assert.doesNotMatch(
  route,
  /export async function GET/,
);

assert.match(
  route,
  /getPrincipal\(\)/,
);

assert.match(
  route,
  /markRepresentativeFieldReadWithClient/,
);

assert.match(
  route,
  /body\.throughMessageId/,
);

assert.match(
  route,
  /lastReadMessageId/,
);

assert.match(
  route,
  /lastReadAt/,
);

assert.match(
  route,
  /COMMUNICATION_READ_STATE_REGRESSION_NOT_ALLOWED/,
);

assert.doesNotMatch(
  route,
  /INSTITUTIONAL_REFLECTION/,
);

assert.doesNotMatch(
  route,
  /reflectionId/,
);

console.log(
  "✓ ARP Field read acknowledgement contract passed",
);
