import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const domain = readFileSync(
  "src/domains/instruments/representative-program/communications/representativeFieldCommunications.ts",
  "utf8",
);

const ui = readFileSync(
  "app/representative/FieldCommunications.tsx",
  "utf8",
);

const css = readFileSync(
  "app/representative/field-communications.module.css",
  "utf8",
);

assert.match(
  domain,
  /lastReadMessageId:\s*true/,
);

assert.match(
  domain,
  /lastReadAt:\s*true/,
);

assert.match(
  domain,
  /lastReadMessage:\s*\{/,
);

assert.match(
  domain,
  /communicationMessage\.count/,
);

assert.match(
  domain,
  /senderUserId:\s*\{\s*not:\s*params\.userId/,
);

assert.match(
  domain,
  /representativeMembership\.lastReadMessage/,
);

assert.match(
  domain,
  /createdAt:\s*\{\s*gt:/,
);

assert.match(
  domain,
  /attention:\s*\{[\s\S]*unreadCount/,
);

assert.match(
  ui,
  /attention:\s*\{\s*unreadCount:\s*number/,
);

assert.match(
  ui,
  /\[\.\.\.nextField\.timeline\.items\][\s\S]*\.reverse\(\)[\s\S]*\.find/,
);

assert.match(
  ui,
  /item\.itemType ===\s*"MESSAGE"/,
);

assert.match(
  ui,
  /\/api\/representative\/communications\/read/,
);

assert.match(
  ui,
  /throughMessageId:\s*newestMessage\.message\.id/,
);

assert.match(
  ui,
  /nextField\.attention\.unreadCount > 0/,
);

assert.match(
  ui,
  /New activity · \{field\.attention\.unreadCount\}/,
);

assert.match(
  ui,
  /Read acknowledgement is secondary[\s\S]*to durable Field retrieval/,
);

assert.doesNotMatch(
  ui,
  /throughMessageId:\s*reflection/,
);

assert.doesNotMatch(
  ui,
  /reflectionId/,
);

assert.match(
  css,
  /\.record \.attention\s*\{/,
);

const setFieldIndex =
  ui.indexOf("setField(nextField);");

const readFetchIndex =
  ui.indexOf(
    '"/api/representative/communications/read"',
  );

assert.ok(
  setFieldIndex >= 0 &&
    readFetchIndex > setFieldIndex,
  "Field retrieval must be committed before read acknowledgement",
);

console.log(
  "✓ ARP Field attention-state contract passed",
);
