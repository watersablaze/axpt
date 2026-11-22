import type { PrismaClient } from "@prisma/client";
import type { InstrumentAuthority } from "../../contracts";
import { REPRESENTATIVE_AUTHORITY_KEY } from "../contracts";
import { loadRepresentativeAppointmentReview } from "./representativeAppointmentAcceptance";
import { loadRepresentativeAuthorityRegister } from "./loadRepresentativeAuthorityRegister";

type EvidenceRow = {
  id: string;
  recordedByUserId: string;
  recordedAt: string;
  subjectId: string | null;
  metadata: unknown;
};

type AuthorityRow = Omit<InstrumentAuthority, "effectiveAt" | "expiresAt" | "revokedAt"> & {
  effectiveAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
};

type WorkspaceRow = {
  id: string;
  participantId: string;
  instrumentId: string;
  instrumentPartyId: string;
  appointmentClass: string;
  scope: unknown;
  effectiveAt: Date | null;
  expiresAt: Date | null;
  endedAt: Date | null;
  participant: {
    id: string;
    userId: string | null;
    displayName: string;
    standing: string;
    onboardingIntake: {
      status: string;
      admittedParticipantId: string | null;
      masterAgreementInstrumentId: string | null;
      masterAgreementInstrument: {
        id: string;
        reference: string;
        kind: string;
        status: string;
      } | null;
    } | null;
  };
  instrument: {
    id: string;
    reference: string;
    title: string;
    kind: string;
    status: string;
    currentVersion: number;
    evidence: EvidenceRow[];
  };
  instrumentParty: { instrumentId: string | null };
  authorities: AuthorityRow[];
};

function timestamp(value: string): Date {
  // Prisma's PostgreSQL DateTime columns use timestamp without time zone.
  // Interpret their JSON representation as UTC, just as Prisma does.
  const date = new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : value + "Z");
  if (!Number.isFinite(date.getTime())) {
    throw new Error("[ARP_WORKSPACE_READ_TIMESTAMP_INVALID]");
  }
  return date;
}

/** Workspace presentation only. Mutation paths retain their original readers. */
export async function loadRepresentativeAppointmentWorkspaceDetailsWithClient(params: {
  client: Pick<PrismaClient, "$queryRaw">;
  userId: string;
  appointmentId: string;
  at?: Date;
}) {
  const userId = params.userId.trim();
  const appointmentId = params.appointmentId.trim();
  const empty = { appointmentReview: null, authorityRegister: null };
  if (!userId || !appointmentId || appointmentId.length > 191) return empty;

  const authorityKeys = Object.values(REPRESENTATIVE_AUTHORITY_KEY);
  const rows: WorkspaceRow[] = await params.client.$queryRaw<WorkspaceRow[]>`
    SELECT a.id, a."participantId", a."instrumentId", a."instrumentPartyId",
      a."appointmentClass", a.scope, a."effectiveAt", a."expiresAt", a."endedAt",
      jsonb_build_object(
        'id', participant.id, 'userId', participant."userId",
        'displayName', participant."displayName", 'standing', participant.standing,
        'onboardingIntake', CASE WHEN intake.id IS NULL THEN NULL ELSE
          jsonb_build_object(
            'status', intake.status,
            'admittedParticipantId', intake."admittedParticipantId",
            'masterAgreementInstrumentId', intake."masterAgreementInstrumentId",
            'masterAgreementInstrument', CASE WHEN agreement.id IS NULL THEN NULL ELSE
              jsonb_build_object('id', agreement.id, 'reference', agreement.reference,
                'kind', agreement.kind, 'status', agreement.status)
            END
          ) END
      ) AS participant,
      jsonb_build_object(
        'id', instrument.id, 'reference', instrument.reference,
        'title', instrument.title, 'kind', instrument.kind,
        'status', instrument.status, 'currentVersion', instrument."currentVersion",
        'evidence', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'id', e.id, 'recordedByUserId', e."recordedByUserId",
            'recordedAt', e."recordedAt", 'subjectId', e."subjectId", 'metadata', e.metadata
          ))
          FROM public."InstrumentEvidence" e
          WHERE e."instrumentId" = instrument.id
            AND e."evidenceType" = 'ATTESTATION'
            AND e."subjectType" = 'EXECUTION'
            AND e.title = 'Representative appointment acceptance'
        ), '[]'::jsonb)
      ) AS instrument,
      jsonb_build_object('instrumentId', party."instrumentId") AS "instrumentParty",
      COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', authority.id, 'instrumentId', authority."instrumentId",
          'authorityKey', authority."authorityKey", 'title', authority.title,
          'authorityClass', authority."authorityClass", 'holderPartyId', authority."holderPartyId",
          'action', authority.action, 'conditions', authority.conditions,
          'effectiveAt', authority."effectiveAt", 'expiresAt', authority."expiresAt",
          'revokedAt', authority."revokedAt", 'createdByUserId', authority."createdByUserId"
        ) ORDER BY authority."createdAt" DESC)
        FROM public."InstrumentAuthority" authority
        WHERE authority."instrumentId" = instrument.id
          AND authority."revokedAt" IS NULL
          AND authority."authorityKey" = ANY(${authorityKeys}::text[])
      ), '[]'::jsonb) AS authorities
    FROM public."RepresentativeProgramAppointment" a
    JOIN public."RepresentativeProgramParticipant" participant ON participant.id = a."participantId"
    JOIN public."InstitutionalInstrument" instrument ON instrument.id = a."instrumentId"
    LEFT JOIN public."InstrumentParty" party ON party.id = a."instrumentPartyId"
    LEFT JOIN public."RepresentativeOnboardingIntake" intake
      ON intake."admittedParticipantId" = participant.id
    LEFT JOIN public."InstitutionalInstrument" agreement
      ON agreement.id = intake."masterAgreementInstrumentId"
    WHERE a.id = ${appointmentId} AND participant."userId" = ${userId}
  `;
  const row = rows[0];
  if (!row) return empty;

  const { authorities: authorityRows, ...appointmentRow } = row;
  const appointment = {
    ...appointmentRow,
    instrument: {
      ...row.instrument,
      evidence: row.instrument.evidence.map(evidence => ({
        ...evidence, recordedAt: timestamp(evidence.recordedAt),
      })),
    },
  };
  const authorities: InstrumentAuthority[] = authorityRows.map(authority => ({
    ...authority,
    effectiveAt: timestamp(authority.effectiveAt),
    expiresAt: authority.expiresAt === null ? null : timestamp(authority.expiresAt),
    revokedAt: authority.revokedAt === null ? null : timestamp(authority.revokedAt),
  }));

  // Narrow read adapter: only these two existing presentation loaders receive it.
  // Their integrity, acceptance-evidence and exercisability rules remain authoritative.
  const reads = {
    representativeProgramAppointment: {
      findUnique: async (query: { where: { id?: string } }) => {
        if (query.where.id !== appointmentId) {
          throw new Error("[ARP_WORKSPACE_READ_SCOPE_CONFLICT]");
        }
        return appointment;
      },
    },
    instrumentAuthority: {
      findMany: async (query: { where: {
        instrumentId?: string;
        authorityKey?: { in?: string[] };
        revokedAt?: null;
      } }) => {
        const keys = query.where.authorityKey?.in;
        if (query.where.instrumentId !== row.instrumentId ||
            query.where.revokedAt !== null || !Array.isArray(keys) ||
            keys.some(key => !authorityKeys.includes(key as typeof authorityKeys[number]))) {
          throw new Error("[ARP_WORKSPACE_READ_SCOPE_CONFLICT]");
        }
        return authorities.filter(authority => keys.includes(authority.authorityKey));
      },
    },
  };
  type ReviewClient = Parameters<typeof loadRepresentativeAppointmentReview>[0]["client"];
  type AuthorityClient = Parameters<typeof loadRepresentativeAuthorityRegister>[0]["client"];
  const [appointmentReview, authorityRegister] = await Promise.all([
    loadRepresentativeAppointmentReview({
      client: reads as unknown as ReviewClient, userId, appointmentId,
    }),
    loadRepresentativeAuthorityRegister({
      client: reads as unknown as AuthorityClient, userId, appointmentId, at: params.at,
    }),
  ]);
  return { appointmentReview, authorityRegister };
}
