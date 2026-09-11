import { readFileSync } from "node:fs";
import path from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const workspacePath = path.resolve(
  "src/components/admin/communications/CommunicationsWorkspace.tsx",
);

/*
 * Read bytes first, then explicitly decode.
 *
 * This avoids relying on readFileSync overload /
 * module interop behavior in the tsx smoke runtime.
 */
const source = readFileSync(workspacePath).toString("utf8");

assert(typeof source === "string", "WORKSPACE_SOURCE_NOT_STRING");

/*
 * Timeline replaces message-only history retrieval.
 */
assert(
  source.includes("type CommunicationTimelineItem ="),
  "WORKSPACE_TIMELINE_ITEM_TYPE_MISSING",
);

assert(
  source.includes('itemType: "MESSAGE"') &&
    source.includes('itemType: "INSTITUTIONAL_REFLECTION"'),
  "WORKSPACE_TIMELINE_DISCRIMINATOR_MISSING",
);

assert(
  source.includes("timelineItems") && source.includes("setTimelineItems"),
  "WORKSPACE_TIMELINE_STATE_MISSING",
);

assert(
  source.includes("/timeline?messageLimit=100&reflectionLimit=100"),
  "WORKSPACE_TIMELINE_ENDPOINT_MISSING",
);

assert(
  !source.includes("/messages?limit=100") &&
    !source.includes("chronologicalMessages") &&
    !source.includes("setMessages(") &&
    !source.includes("loadMessages("),
  "WORKSPACE_MESSAGE_ONLY_HISTORY_REMAINS",
);

/*
 * Institutional observations are a distinct
 * presentation branch, not synthetic messages.
 */
const reflectionBranchStart = source.indexOf(
  '"INSTITUTIONAL_REFLECTION"',
  source.indexOf("timelineItems.map"),
);

assert(reflectionBranchStart !== -1, "WORKSPACE_REFLECTION_BRANCH_MISSING");

const reflectionBranchEnd = source.indexOf(
  "const message =",
  reflectionBranchStart,
);

assert(reflectionBranchEnd !== -1, "WORKSPACE_REFLECTION_BRANCH_END_MISSING");

const reflectionBranch = source.slice(
  reflectionBranchStart,
  reflectionBranchEnd,
);

assert(
  reflectionBranch.includes("Institutional Observation"),
  "WORKSPACE_REFLECTION_LABEL_MISSING",
);

assert(
  reflectionBranch.includes("reflection.reflectionCode") &&
    reflectionBranch.includes("reflection.sourceSystem") &&
    reflectionBranch.includes("reflection.sourceAggregateType") &&
    reflectionBranch.includes("reflection.sourceOccurredAt") &&
    reflectionBranch.includes("reflection.targetId"),
  "WORKSPACE_REFLECTION_PROVENANCE_PRESENTATION_INCOMPLETE",
);

assert(
  !reflectionBranch.includes("senderUserId") &&
    !reflectionBranch.includes("userLabel(") &&
    !reflectionBranch.includes('"You"'),
  "WORKSPACE_REFLECTION_SENDER_SEMANTICS_PRESENT",
);

/*
 * Read acknowledgement must select the newest
 * MESSAGE item, never the newest timeline item.
 */
const newestMessageStart = source.indexOf("const newestMessage =");

assert(newestMessageStart !== -1, "WORKSPACE_NEWEST_MESSAGE_SELECTION_MISSING");

const newestMessageEnd = source.indexOf(
  "if (newestMessage)",
  newestMessageStart,
);

assert(
  newestMessageEnd !== -1,
  "WORKSPACE_NEWEST_MESSAGE_SELECTION_END_MISSING",
);

const newestMessageSelection = source.slice(
  newestMessageStart,
  newestMessageEnd,
);

assert(
  newestMessageSelection.includes(".reverse()") &&
    newestMessageSelection.includes("item.itemType ===") &&
    newestMessageSelection.includes('"MESSAGE"'),
  "WORKSPACE_NEWEST_MESSAGE_SELECTION_INVALID",
);

const markReadStart = source.indexOf("if (newestMessage)", newestMessageEnd);

assert(markReadStart !== -1, "WORKSPACE_MESSAGE_READ_GATE_MISSING");

const markReadWindow = source.slice(markReadStart, markReadStart + 600);

assert(
  markReadWindow.includes("markRead(") &&
    markReadWindow.includes("newestMessage.message.id"),
  "WORKSPACE_MESSAGE_READ_ACKNOWLEDGEMENT_INVALID",
);

assert(
  !reflectionBranch.includes("markRead("),
  "WORKSPACE_REFLECTION_READ_ACKNOWLEDGEMENT_PRESENT",
);

/*
 * Durable message sending remains a message POST.
 */
assert(
  source.includes("clientMessageId") &&
    source.includes("workflowReference") &&
    source.includes('method:\n              "POST"'),
  "WORKSPACE_MESSAGE_SEND_CONTRACT_INCOMPLETE",
);

assert(
  source.includes("await loadTimeline("),
  "WORKSPACE_SEND_SUCCESS_TIMELINE_RELOAD_MISSING",
);

/*
 * Presentation grants no Treasury authority.
 */
for (const forbidden of [
  "approveTreasury",
  "authorizeTreasury",
  "executeTreasury",
  "confirmTreasury",
  "/api/admin/treasury",
  "treasuryGatewayAggregate.update",
  "treasuryGatewayAggregate.create",
]) {
  assert(
    !source.includes(forbidden),
    `WORKSPACE_REFLECTION_AUTHORITY_SURFACE_PRESENT:${forbidden}`,
  );
}

console.log({
  sourceDecodedAsString: true,

  timelineHistoryActive: true,

  messageAndReflectionDiscriminated: true,

  reflectionProvenancePresented: true,

  reflectionHasNoSender: true,

  newestMessageControlsReadMarker: true,

  reflectionCannotAdvanceReadMarker: true,

  messageSendContractPreserved: true,

  sendSuccessReloadsTimeline: true,

  treasuryAuthorityAbsent: true,
});
