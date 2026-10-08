import type { InstrumentAuthority } from "../../contracts";
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

  const appointment =
    await params.client.representativeProgramAppointment.findUnique({
      where: { id: appointmentId },
      include: {
        participant: true,
        instrument: true,
        instrumentParty: true,
      },
    });

  if (!appointment || appointment.participant.userId !== userId) return null;

  const at = new Date();
  const candidates: InstrumentAuthority[] = await params.client.instrumentAuthority.findMany({
    where: {
      instrumentId: appointment.instrumentId,
      authorityKey: { in: Object.values(REPRESENTATIVE_AUTHORITY_KEY) },
      revokedAt: null,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      instrumentId: true,
      authorityKey: true,
      title: true,
      authorityClass: true,
      holderPartyId: true,
      action: true,
      conditions: true,
      effectiveAt: true,
      expiresAt: true,
      revokedAt: true,
      createdByUserId: true,
    },
  });

  // Request-local read adapter. The canonical resolver retains every
  // integrity, lifecycle, standing, and authority decision.
  // These delegates support only the resolver's two known read shapes.
  const resolutionClient = {
    representativeProgramAppointment: {
      findUnique: async (query: { where: { id?: string } }) => {
        if (query.where.id !== appointmentId) {
          throw new Error("[ARP_AUTHORITY_REGISTER_READ_SCOPE_CONFLICT]");
        }
        return appointment;
      },
    },
    instrumentAuthority: {
      findMany: async (query: {
        where: {
          instrumentId?: string;
          authorityKey?: string;
          revokedAt?: null;
        };
      }) => {
        if (
          query.where.instrumentId !== appointment.instrumentId ||
          typeof query.where.authorityKey !== "string" ||
          query.where.revokedAt !== null
        ) {
          throw new Error("[ARP_AUTHORITY_REGISTER_READ_SCOPE_CONFLICT]");
        }
        return candidates.filter(candidate =>
          candidate.authorityKey === query.where.authorityKey
        );
      },
    },
  } as unknown as Client;

  const entries = await Promise.all(
    Object.values(REPRESENTATIVE_AUTHORITY_KEY).map(async authorityKey => {
      const result =
        await resolveRepresentativeProgramAuthorityExercisabilityWithClient({
          client: resolutionClient,
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
