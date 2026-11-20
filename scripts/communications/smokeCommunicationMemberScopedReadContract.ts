import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  "src/domains/communications/membership/markConversationReadWithClient.ts",
  "utf8",
);

assert.match(
  source,
  /export async function markConversationReadForMemberWithClient/,
);

assert.match(
  source,
  /userId:\s*string/,
);

assert.match(
  source,
  /conversationId,\s*userId,\s*leftAt:\s*null/,
);

assert.match(
  source,
  /COMMUNICATION_CONVERSATION_ACCESS_DENIED/,
);

assert.match(
  source,
  /COMMUNICATION_READ_MESSAGE_NOT_FOUND/,
);

assert.match(
  source,
  /COMMUNICATION_READ_STATE_REGRESSION_NOT_ALLOWED/,
);

assert.match(
  source,
  /lastReadMessageId:\s*message\.id/,
);

assert.match(
  source,
  /lastReadAt:\s*new Date\(\)/,
);

assert.match(
  source,
  /export async function markConversationReadWithClient/,
);

assert.match(
  source,
  /authorityKernel\.require\([\s\S]*PERMISSIONS\.COMMUNICATIONS_ACCESS/,
);

assert.match(
  source,
  /return markConversationReadForMemberWithClient\(\{[\s\S]*userId:\s*principal\.userId/,
);

console.log(
  "✓ member-scoped Communications read contract passed",
);
