import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const application =
  readFileSync(
    "src/domains/instruments/representative-program/communications/representativeFieldCommunications.ts",
    "utf8",
  );

assert.match(
  application,
  /loadConversationTimelineForMemberWithClient/,
);

assert.match(
  application,
  /userId:\s*params\.userId/,
);

assert.match(
  application,
  /conversationId:\s*room\.conversationId/,
);

assert.match(
  application,
  /messageLimit:\s*take/,
);

assert.match(
  application,
  /reflectionLimit:\s*take/,
);

assert.match(
  application,
  /item\.itemType === "MESSAGE"/,
);

assert.match(
  application,
  /params\.client\.user\.findMany/,
);

assert.match(
  application,
  /senderByUserId/,
);

assert.match(
  application,
  /messages,/,
);

assert.match(
  application,
  /timeline:\s*\{/,
);

assert.match(
  application,
  /reflectionCount:\s*timeline\.reflectionCount/,
);

assert.match(
  application,
  /"INSTITUTIONAL_REFLECTION" as const/,
);

assert.match(
  application,
  /reflection:\s*item\.reflection/,
);

assert.doesNotMatch(
  application,
  /conversation:\s*\{[\s\S]*messages:\s*\{[\s\S]*orderBy:/,
);

assert.doesNotMatch(
  application,
  /\[\.\.\.room\.conversation\.messages\]/,
);

console.log(
  "✓ ARP Field canonical timeline adoption contract passed",
);
