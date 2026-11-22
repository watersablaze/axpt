import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const timeline = readFileSync(
  "src/domains/communications/timeline/loadConversationTimelineWithClient.ts",
  "utf8",
);

assert.match(
  timeline,
  /export async function loadConversationTimelineForMemberWithClient/,
);

assert.match(
  timeline,
  /userId:\s*string/,
);

assert.match(
  timeline,
  /requireConversationMember\([\s\S]*conversationId,[\s\S]*userId,/,
);

assert.match(
  timeline,
  /export async function loadConversationTimelineWithClient/,
);

assert.match(
  timeline,
  /authorityKernel\.require\([\s\S]*PERMISSIONS\.COMMUNICATIONS_ACCESS/,
);

assert.match(
  timeline,
  /return loadConversationTimelineForMemberWithClient\(\{[\s\S]*userId:\s*principal\.userId/,
);

assert.match(
  timeline,
  /communicationOperationalReflection\.findMany/,
);

assert.match(
  timeline,
  /const items = \[\.\.\.messageItems, \.\.\.reflectionItems\]\.sort/,
);

assert.match(
  timeline,
  /messageCount:\s*messages\.length/,
);

assert.match(
  timeline,
  /reflectionCount:\s*reflections\.length/,
);

console.log(
  "✓ member-scoped Communications timeline contract passed",
);
