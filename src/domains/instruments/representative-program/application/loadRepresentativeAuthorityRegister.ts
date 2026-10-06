import type { PrismaClient } from "@prisma/client";
import {
  REPRESENTATIVE_AUTHORITY_KEY,
  REPRESENTATIVE_AUTHORITY_TITLE,
} from "../contracts";
import { resolveRepresentativeProgramAuthorityExercisabilityWithClient } from
  "../queries/resolveRepresentativeProgramAuthorityExercisabilityWithClient";

type Client = Pick<
  PrismaClient,
  "representativeProgramAppointment" | "instrumentAuthority"
>;

export async function loadRepresentativeAuthorityRegister(params: {
  client: Client;
  appointmentId: string;
  userId: string;
}) {
  const appointmentId = params.appointmentId.trim();
  const userId = params.userId.trim();
  if (!userId || !appointmentId || appointmentId.length > 191) return null;

  const appointment: {
    participant: { userId: string | null };
  } | null = await params.client.representativeProgramAppointment.findUnique({
    where: { id: appointmentId },
    select: { participant: { select: { userId: true } } },
  });

  if (!appointment || appointment.participant.userId !== userId) return null;

  const at = new Date();
  const entries = await Promise.all(
    Object.values(REPRESENTATIVE_AUTHORITY_KEY).map(async authorityKey => {
      const result =
        await resolveRepresentativeProgramAuthorityExercisabilityWithClient({
          client: params.client,
          appointmentId,
          authorityKey,
          at,
        });

      return {
        key: authorityKey,
        title: REPRESENTATIVE_AUTHORITY_TITLE[authorityKey],
        exercisable: result.exercisable,
        reason: result.reason,
        authority: result.authority ? {
          id: result.authority.id,
          authorityClass: result.authority.authorityClass,
          action: result.authority.action,
          conditions: result.authority.conditions,
          effectiveAt: result.authority.effectiveAt,
          expiresAt: result.authority.expiresAt,
        } : null,
      };
    }),
  );

  return { appointmentId, evaluatedAt: at, entries };
}

export type RepresentativeAuthorityRegister =
  NonNullable<Awaited<ReturnType<typeof loadRepresentativeAuthorityRegister>>>;
