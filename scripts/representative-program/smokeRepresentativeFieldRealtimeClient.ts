import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const hook = readFileSync(
  "src/lib/realtime/communications/useCommunicationsStream.ts",
  "utf8",
);

const field = readFileSync(
  "app/representative/FieldCommunications.tsx",
  "utf8",
);

/*
 * Shared hook remains backward-compatible.
 */
assert.match(
  hook,
  /endpoint\s*=\s*"\/api\/communications\/stream"/,
);

assert.match(
  hook,
  /new EventSource\(\s*endpoint\s*\)/,
);

assert.match(
  hook,
  /\}, \[endpoint\]\)/,
);

/*
 * Field uses its own governed SSE surface.
 */
assert.match(
  field,
  /useCommunicationsStream\(\s*"\/api\/representative\/communications\/stream"/,
);

/*
 * Retrieval owns truth.
 */
assert.match(
  field,
  /Realtime is advisory only/,
);

assert.match(
  field,
  /Signals never mutate Field state directly/,
);

assert.match(
  field,
  /void load\(\{\s*acknowledgeMessages:/,
);

/*
 * Read policy is explicit.
 */
assert.match(
  field,
  /acknowledgeMessages\?: boolean/,
);

assert.match(
  field,
  /options\?\.acknowledgeMessages\s*\?\?\s*true/,
);

assert.match(
  field,
  /acknowledgeMessages &&\s*nextField\.attention\.unreadCount > 0/,
);

/*
 * Reflection refresh cannot advance message read state.
 */
assert.match(
  field,
  /signal\.type ===\s*"COMMUNICATION_INSTITUTIONAL_REFLECTION_AVAILABLE"/,
);

assert.match(
  field,
  /acknowledgeMessages:\s*!isReflectionSignal/,
);

/*
 * Conversation signal scope remains guarded client-side.
 */
assert.match(
  field,
  /signal\.conversationId !==\s*field\.room\.conversationId/,
);

/*
 * Preview must not act as a live Field client.
 */
assert.match(
  field,
  /previewMode \|\|\s*!realtime\.lastSignal/,
);

/*
 * No direct realtime state synthesis.
 */
assert.doesNotMatch(
  field,
  /setField\(\s*realtime\.lastSignal/,
);

assert.doesNotMatch(
  field,
  /communicationOperationalReflection\.create/,
);

assert.doesNotMatch(
  field,
  /kind:\s*"SYSTEM"/,
);

console.log({
  genericStreamDefaultPreserved: true,
  representativeStreamActive: true,
  realtimeAdvisoryOnly: true,
  messageRefreshMayAcknowledge: true,
  reflectionRefreshCannotAcknowledge: true,
  conversationGuardPresent: true,
  previewRealtimeInactive: true,
});
