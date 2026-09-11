import fs from "node:fs";
import path from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const routePath = path.resolve(
  "app/api/communications/conversations/[conversationId]/timeline/route.ts",
);

const route = fs.readFileSync(routePath, "utf8");

assert(
  route.includes('import { getPrincipal } from "@/domains/auth/getPrincipal"'),
  "TIMELINE_HTTP_GET_PRINCIPAL_IMPORT_MISSING",
);

assert(
  route.includes(
    'import { loadConversationTimeline } from "@/domains/communications/timeline/loadConversationTimeline"',
  ),
  "TIMELINE_HTTP_DOMAIN_WRAPPER_IMPORT_MISSING",
);

assert(
  route.includes(
    'import { communicationHttpError } from "@/domains/communications/http/communicationHttpError"',
  ),
  "TIMELINE_HTTP_ERROR_MAPPER_IMPORT_MISSING",
);

assert(
  route.includes("export async function GET("),
  "TIMELINE_HTTP_GET_HANDLER_MISSING",
);

assert(
  !/export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\s*\(/.test(route),
  "TIMELINE_HTTP_MUTATION_HANDLER_PRESENT",
);

assert(
  route.includes("await getPrincipal()"),
  "TIMELINE_HTTP_AUTHENTICATION_GATE_MISSING",
);

assert(
  route.includes('"COMMUNICATIONS_AUTHENTICATION_REQUIRED"') &&
    route.includes("status: 401"),
  "TIMELINE_HTTP_401_CONTRACT_MISSING",
);

assert(
  route.includes('url.searchParams.get("messageLimit")'),
  "TIMELINE_HTTP_MESSAGE_LIMIT_QUERY_MISSING",
);

assert(
  route.includes('url.searchParams.get("reflectionLimit")'),
  "TIMELINE_HTTP_REFLECTION_LIMIT_QUERY_MISSING",
);

assert(
  route.includes("loadConversationTimeline({") &&
    route.includes("principal,") &&
    route.includes("conversationId,") &&
    route.includes("messageLimit,") &&
    route.includes("reflectionLimit,"),
  "TIMELINE_HTTP_DOMAIN_FORWARDING_INVALID",
);

assert(
  route.includes("return Response.json({") &&
    route.includes("ok: true") &&
    route.includes("timeline,"),
  "TIMELINE_HTTP_SUCCESS_RESPONSE_INVALID",
);

assert(
  route.includes("return communicationHttpError(error)"),
  "TIMELINE_HTTP_SHARED_ERROR_MAPPING_MISSING",
);

assert(
  !route.includes("markConversationRead") &&
    !route.includes("lastReadMessageId") &&
    !route.includes("lastReadAt") &&
    !route.includes("/read"),
  "TIMELINE_HTTP_READ_ACKNOWLEDGEMENT_PRESENT",
);

assert(
  !route.includes("communicationMessage.create") &&
    !route.includes("COMMUNICATION_MESSAGE_SENT") &&
    !route.includes('kind: "SYSTEM"'),
  "TIMELINE_HTTP_MESSAGE_SYNTHESIS_PRESENT",
);

console.log({
  authenticatedGetSurface: true,

  missingPrincipal401Contract: true,

  messageLimitForwarded: true,

  reflectionLimitForwarded: true,

  sharedErrorMapper: true,

  successfulTimelineEnvelope: true,

  getOnly: true,

  noReadAcknowledgement: true,

  noMessageSynthesis: true,
});
