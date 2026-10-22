import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const messages = readFileSync(
  "src/domains/communications/realtime/loadCommunicationRealtimeSignalsWithClient.ts",
  "utf8",
);

const reflections = readFileSync(
  "src/domains/communications/realtime/loadCommunicationReflectionRealtimeSignalsWithClient.ts",
  "utf8",
);

assert.match(
  messages,
  /export async function loadCommunicationRealtimeSignalsForMemberWithClient/,
);

assert.match(
  messages,
  /userId:\s*string/,
);

assert.match(
  messages,
  /conversationIds\?: readonly string\[\]/,
);

assert.match(
  messages,
  /userId,\s*leftAt:\s*null/,
);

assert.match(
  messages,
  /conversationId:\s*\{\s*in:/,
);

assert.match(
  messages,
  /conversation:\s*\{\s*status:\s*"ACTIVE"/,
);

assert.match(
  messages,
  /export async function loadCommunicationRealtimeSignalsWithClient/,
);

assert.match(
  messages,
  /authorityKernel\.require\([\s\S]*PERMISSIONS\.COMMUNICATIONS_ACCESS/,
);

assert.match(
  messages,
  /return loadCommunicationRealtimeSignalsForMemberWithClient\(\{[\s\S]*userId:\s*principal\.userId/,
);

assert.match(
  reflections,
  /export async function loadCommunicationReflectionRealtimeSignalsForMemberWithClient/,
);

assert.match(
  reflections,
  /conversationIds\?: readonly string\[\]/,
);

assert.match(
  reflections,
  /members:\s*\{\s*some:\s*\{\s*userId,/,
);

assert.match(
  reflections,
  /id:\s*\{\s*in:\s*\[\.\.\.conversationIds\]/,
);

assert.match(
  reflections,
  /status:\s*"ACTIVE"/,
);

assert.match(
  reflections,
  /export async function loadCommunicationReflectionRealtimeSignalsWithClient/,
);

assert.match(
  reflections,
  /authorityKernel\.require\([\s\S]*PERMISSIONS\.COMMUNICATIONS_ACCESS/,
);

assert.match(
  reflections,
  /return loadCommunicationReflectionRealtimeSignalsForMemberWithClient\(\{[\s\S]*userId:\s*principal\.userId/,
);

for (const source of [
  messages,
  reflections,
]) {
  assert.doesNotMatch(
    source.match(
      /export async function .*ForMemberWithClient[\s\S]*?(?=\nexport async function |\s*$)/,
    )?.[0] ?? "",
    /COMMUNICATIONS_ACCESS/,
  );
}

console.log(
  "✓ member-scoped Communications realtime extraction contract passed",
);
