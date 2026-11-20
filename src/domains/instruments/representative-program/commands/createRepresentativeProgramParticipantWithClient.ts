import type { PrismaClient } from "@prisma/client";

import {
  isRepresentativeProgramInitialStanding,
  type RepresentativeProgramStanding,
} from "../contracts";
import { allocateRepresentativeProgramDocketWithClient } from "./allocateRepresentativeProgramDocketWithClient";

export type RepresentativeProgramParticipantCreationClient = Pick<
  PrismaClient,
  | "representativeProgramDocketSequence"
  | "representativeProgramParticipant"
  | "representativeProgramStandingTransition"
>;

export async function createRepresentativeProgramParticipantWithClient(params: {
  client: RepresentativeProgramParticipantCreationClient;
  displayName: string;
  standing: RepresentativeProgramStanding;
  actorUserId: string;
  userId?: string | null;
  occurredAt?: Date;
}) {
  const displayName = params.displayName.trim();

  if (!displayName) {
    throw new Error("[ARP_PARTICIPANT_DISPLAY_NAME_REQUIRED]");
  }

  if (!isRepresentativeProgramInitialStanding(params.standing)) {
    throw new Error(
      `[ARP_PARTICIPANT_INVALID_INITIAL_STANDING] ${params.standing}`,
    );
  }

  const occurredAt = params.occurredAt ?? new Date();

  const docketReference =
    await allocateRepresentativeProgramDocketWithClient({
      client: params.client,
      year: occurredAt.getUTCFullYear(),
    });

  const participant =
    await params.client.representativeProgramParticipant.create({
      data: {
        docketReference,
        userId: params.userId ?? null,
        displayName,
        standing: params.standing,
        admittedAt: occurredAt,
        createdByUserId: params.actorUserId,

        standingTransitions: {
          create: {
            fromStanding: null,
            toStanding: params.standing,
            actorUserId: params.actorUserId,
            reason: "Initial Program admission",
            occurredAt,
          },
        },
      },
      include: {
        standingTransitions: {
          orderBy: {
            occurredAt: "asc",
          },
        },
      },
    });

  return participant;
}
