import { prisma } from "@/infrastructure/db/prisma";
import type { Principal } from "@/domains/auth/types";

import { loadConversationTimelineWithClient } from "./loadConversationTimelineWithClient";

export async function loadConversationTimeline({
  principal,
  conversationId,
  messageLimit,
  reflectionLimit,
}: {
  principal: Principal;

  conversationId: string;

  messageLimit?: number;

  reflectionLimit?: number;
}) {
  return loadConversationTimelineWithClient({
    client: prisma,

    principal,

    conversationId,

    messageLimit,

    reflectionLimit,
  });
}
