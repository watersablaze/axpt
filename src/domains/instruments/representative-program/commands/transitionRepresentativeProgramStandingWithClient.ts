import type { PrismaClient } from "@prisma/client";

import {
  assertRepresentativeProgramStandingTransition,
  type RepresentativeProgramStanding,
} from "../contracts";

export type RepresentativeProgramStandingTransitionClient = Pick<
  PrismaClient,
  | "representativeProgramParticipant"
  | "representativeProgramStandingTransition"
>;

export async function transitionRepresentativeProgramStandingWithClient(params: {
  client: RepresentativeProgramStandingTransitionClient;
  participantId: string;
  toStanding: RepresentativeProgramStanding;
  actorUserId: string;
  reason?: string | null;
  metadata?: Readonly<Record<string, unknown>> | null;
  occurredAt?: Date;
}) {
  const participant =
    await params.client.representativeProgramParticipant.findUnique({
      where: {
        id: params.participantId,
      },
    });

  if (!participant) {
    throw new Error(
      `[ARP_STANDING_PARTICIPANT_NOT_FOUND] ${params.participantId}`,
    );
  }

  assertRepresentativeProgramStandingTransition({
    from: participant.standing,
    to: params.toStanding,
  });

  const occurredAt = params.occurredAt ?? new Date();

  const transition =
    await params.client.representativeProgramStandingTransition.create({
      data: {
        participantId: participant.id,
        fromStanding: participant.standing,
        toStanding: params.toStanding,
        actorUserId: params.actorUserId,
        reason: params.reason ?? null,
        metadata: params.metadata ?? undefined,
        occurredAt,
      },
    });

  const updated =
    await params.client.representativeProgramParticipant.update({
      where: {
        id: participant.id,
      },
      data: {
        standing: params.toStanding,
      },
    });

  return {
    participant: updated,
    transition,
  } as const;
}
