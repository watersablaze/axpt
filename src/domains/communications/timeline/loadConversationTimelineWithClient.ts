import { authorityKernel } from "@/domains/auth/AuthorityKernel";
import { PERMISSIONS } from "@/domains/auth/permissions";
import type { Principal } from "@/domains/auth/types";

import {
  requireConversationMember,
  type CommunicationMemberClient,
} from "../membership/requireConversationMember";

import type { CommunicationsDatabaseClient } from "../shared/databaseTypes";

const DEFAULT_MESSAGE_LIMIT = 100;

const DEFAULT_REFLECTION_LIMIT = 100;

const MAX_LIMIT = 100;

export const COMMUNICATION_TIMELINE_ITEM_TYPE = {
  MESSAGE: "MESSAGE",

  INSTITUTIONAL_REFLECTION: "INSTITUTIONAL_REFLECTION",
} as const;

export type CommunicationTimelineItemType =
  (typeof COMMUNICATION_TIMELINE_ITEM_TYPE)[keyof typeof COMMUNICATION_TIMELINE_ITEM_TYPE];

export type CommunicationTimelineMessageItem = Readonly<{
  itemType: typeof COMMUNICATION_TIMELINE_ITEM_TYPE.MESSAGE;

  id: string;

  occurredAt: Date;

  message: {
    id: string;

    conversationId: string;

    senderUserId: string;

    kind: unknown;

    body: string;

    createdAt: Date;

    workflowTargetType: unknown;

    workflowTargetSubtype: string | null;

    workflowTargetId: string | null;
  };
}>;

export type CommunicationTimelineReflectionItem = Readonly<{
  itemType: typeof COMMUNICATION_TIMELINE_ITEM_TYPE.INSTITUTIONAL_REFLECTION;

  id: string;

  occurredAt: Date;

  reflection: {
    id: string;

    operationalRoomId: string;

    sourceSystem: string;

    sourceEventId: string;

    sourceAggregateType: string;

    sourceAggregateId: string;

    sourceEventType: string;

    sourceOccurredAt: Date;

    targetType: unknown;

    targetSubtype: string;

    targetId: string;

    reflectionType: string;

    reflectionCode: string;

    createdAt: Date;
  };
}>;

export type CommunicationTimelineItem =
  | CommunicationTimelineMessageItem
  | CommunicationTimelineReflectionItem;

export type CommunicationTimeline = Readonly<{
  conversationId: string;

  items: readonly CommunicationTimelineItem[];

  messageCount: number;

  reflectionCount: number;
}>;

function normalizeLimit(value: number | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("COMMUNICATION_TIMELINE_LIMIT_INVALID");
  }

  return Math.min(value, MAX_LIMIT);
}

function compareTimelineItems(
  left: CommunicationTimelineItem,
  right: CommunicationTimelineItem,
) {
  const occurredDifference =
    left.occurredAt.getTime() - right.occurredAt.getTime();

  if (occurredDifference !== 0) {
    return occurredDifference;
  }

  const typeDifference = left.itemType.localeCompare(right.itemType);

  if (typeDifference !== 0) {
    return typeDifference;
  }

  return left.id.localeCompare(right.id);
}

export async function loadConversationTimelineWithClient({
  client,
  principal,
  conversationId,
  messageLimit,
  reflectionLimit,
}: {
  client: CommunicationsDatabaseClient;

  principal: Principal;

  conversationId: string;

  messageLimit?: number;

  reflectionLimit?: number;
}): Promise<CommunicationTimeline> {
  authorityKernel.require(principal, PERMISSIONS.COMMUNICATIONS_ACCESS);

  await requireConversationMember(
    client as unknown as CommunicationMemberClient,
    conversationId,
    principal.userId,
  );

  const boundedMessageLimit = normalizeLimit(
    messageLimit,
    DEFAULT_MESSAGE_LIMIT,
  );

  const boundedReflectionLimit = normalizeLimit(
    reflectionLimit,
    DEFAULT_REFLECTION_LIMIT,
  );

  const [messages, reflections] = await Promise.all([
    client.communicationMessage.findMany({
      where: {
        conversationId,
      },

      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],

      take: boundedMessageLimit,

      select: {
        id: true,

        conversationId: true,

        senderUserId: true,

        kind: true,

        body: true,

        createdAt: true,

        workflowTargetType: true,

        workflowTargetSubtype: true,

        workflowTargetId: true,
      },
    }),

    client.communicationOperationalReflection.findMany({
      where: {
        operationalRoom: {
          conversationId,
        },
      },

      orderBy: [
        {
          sourceOccurredAt: "desc",
        },
        {
          id: "desc",
        },
      ],

      take: boundedReflectionLimit,

      select: {
        id: true,

        operationalRoomId: true,

        sourceSystem: true,

        sourceEventId: true,

        sourceAggregateType: true,

        sourceAggregateId: true,

        sourceEventType: true,

        sourceOccurredAt: true,

        targetType: true,

        targetSubtype: true,

        targetId: true,

        reflectionType: true,

        reflectionCode: true,

        createdAt: true,
      },
    }),
  ]);

  const messageItems: CommunicationTimelineMessageItem[] = messages.map(
    (message) => ({
      itemType: COMMUNICATION_TIMELINE_ITEM_TYPE.MESSAGE,

      id: message.id,

      occurredAt: message.createdAt,

      message,
    }),
  );

  const reflectionItems: CommunicationTimelineReflectionItem[] =
    reflections.map((reflection) => ({
      itemType: COMMUNICATION_TIMELINE_ITEM_TYPE.INSTITUTIONAL_REFLECTION,

      id: reflection.id,

      occurredAt: reflection.sourceOccurredAt,

      reflection,
    }));

  const items = [...messageItems, ...reflectionItems].sort(
    compareTimelineItems,
  );

  return {
    conversationId,

    items,

    messageCount: messages.length,

    reflectionCount: reflections.length,
  };
}
