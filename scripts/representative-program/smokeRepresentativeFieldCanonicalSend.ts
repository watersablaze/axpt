import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

const primitive = read(
  "src/domains/communications/messages/sendMessageInTransaction.ts",
);

const field = read(
  "src/domains/instruments/representative-program/communications/representativeFieldCommunications.ts",
);

assert.match(
  primitive,
  /export async function sendMessageInTransactionWithResult/,
);

assert.match(
  primitive,
  /created:\s*false/,
);

assert.match(
  primitive,
  /created:\s*true/,
);

assert.match(
  primitive,
  /\.\.\.\(eventMetadata \?\? \{\}\)/,
);

assert.match(
  primitive,
  /export async function sendMessageInTransaction\(/,
);

assert.match(
  primitive,
  /return result\.message/,
);

assert.match(
  field,
  /sendMessageInTransactionWithResult/,
);

assert.match(
  field,
  /workflowReference:\s*\{[\s\S]*targetType:\s*pointer\.targetType[\s\S]*targetSubtype:\s*pointer\.targetSubtype[\s\S]*targetId:\s*pointer\.targetId/,
);

assert.match(
  field,
  /participantId:\s*participant\.id/,
);

assert.match(
  field,
  /source:\s*"ARP_FIELD_COMMUNICATIONS"/,
);

assert.match(
  field,
  /COMMUNICATION_MESSAGE_IDEMPOTENCY_COLLISION/,
);

assert.match(
  field,
  /ARP_FIELD_COMMUNICATIONS_IDEMPOTENCY_COLLISION/,
);

assert.match(
  field,
  /if \(created\) \{[\s\S]*onMessageCreated/,
);

assert.doesNotMatch(
  field,
  /const message = await tx\.communicationMessage\.create/,
);

assert.doesNotMatch(
  field,
  /await tx\.communicationConversation\.update\(\{[\s\S]*updatedAt:\s*message\.createdAt/,
);

console.log(
  "✓ ARP Field Communications canonical send convergence contract passed",
);
