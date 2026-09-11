import { authorityKernel } from "@/domains/auth/AuthorityKernel";
import { PERMISSIONS } from "@/domains/auth/permissions";
import type { Principal } from "@/domains/auth/types";

import type { CommunicationsDatabaseClient } from "../shared/databaseTypes";

export const COMMUNICATION_REFLECTION_REALTIME_SIGNAL_TYPE =
  "COMMUNICATION_INSTITUTIONAL_REFLECTION_AVAILABLE" as const;

export type CommunicationReflectionRealtimeSignal = Readonly<{
  id: string;

  type: typeof COMMUNICATION_REFLECTION_REALTIME_SIGNAL_TYPE;

  conversationId: string;

  reflectionId: string;

  operationalRoomId: string;

  createdAt: string;
}>;

export type CommunicationReflectionRealtimeRecord = Readonly<{
  createdAt: Date;

  signal: CommunicationReflectionRealtimeSignal;
}>;

type ReflectionRow = {
  id: string;
  operationalRoomId: string;
  createdAt: Date;

  operationalRoom: {
    conversationId: string;
  };
};

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 100;

function normalizeLimit(limit: number | undefined) {
  if (limit === undefined) {
    return DEFAULT_LIMIT;
  }

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error("COMMUNICATION_REFLECTION_REALTIME_LIMIT_INVALID");
  }

  return Math.min(limit, MAX_LIMIT);
}

/*
 * This is a read-side advisory projection only.
 *
 * It does not:
 * - create Communications DomainEvents
 * - inspect TreasuryGatewayEvent
 * - mutate reflections
 * - mutate read state
 * - carry reflection/Treasury payloads
 *
 * createdAt is the realtime freshness clock.
 * sourceOccurredAt remains the timeline chronology clock.
 */
export async function loadCommunicationReflectionRealtimeSignalsWithClient({
  client,
  principal,
  since,
  limit,
}: {
  client: CommunicationsDatabaseClient;

  principal: Principal;

  since: Date;

  limit?: number;
}): Promise<CommunicationReflectionRealtimeRecord[]> {
  authorityKernel.require(principal, PERMISSIONS.COMMUNICATIONS_ACCESS);

  if (Number.isNaN(since.getTime())) {
    throw new Error("COMMUNICATION_REFLECTION_REALTIME_CURSOR_INVALID");
  }

  const boundedLimit = normalizeLimit(limit);

  /*
   * Membership and ACTIVE status are resolved
   * against present authoritative state on
   * every retrieval.
   */
  const reflections = await client.communicationOperationalReflection.findMany({
    where: {
      createdAt: {
        gte: since,
      },

      operationalRoom: {
        conversation: {
          status: "ACTIVE",

          members: {
            some: {
              userId: principal.userId,

              leftAt: null,
            },
          },
        },
      },
    },

    select: {
      id: true,

      operationalRoomId: true,

      createdAt: true,

      operationalRoom: {
        select: {
          conversationId: true,
        },
      },
    },

    orderBy: [
      {
        createdAt: "asc",
      },
      {
        id: "asc",
      },
    ],

    take: boundedLimit,
  });

  return reflections.map((reflection: ReflectionRow) => ({
    createdAt: reflection.createdAt,

    signal: {
      /*
       * Prefix prevents identity collision
       * with generic DomainEvent ids in a
       * shared client-side seen-id set.
       */
      id: `reflection:${reflection.id}`,

      type: COMMUNICATION_REFLECTION_REALTIME_SIGNAL_TYPE,

      conversationId: reflection.operationalRoom.conversationId,

      reflectionId: reflection.id,

      operationalRoomId: reflection.operationalRoomId,

      createdAt: reflection.createdAt.toISOString(),
    },
  }));
}
