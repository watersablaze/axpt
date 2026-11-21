import type { PrismaClient } from "@prisma/client";
import type { RepresentativeWorkspaceRecord } from "./loadRepresentativeWorkspace";

type WorkspaceRow = Pick<RepresentativeWorkspaceRecord,
  "participantId" | "docketReference" | "displayName" | "standing" | "admittedAt" | "intakeReference"
> & {
  appointmentId: string | null;
  appointmentClass: string | null;
  effectiveAt: Date | null;
  expiresAt: Date | null;
  endedAt: Date | null;
  instrumentId: string | null;
  instrumentReference: string | null;
  instrumentTitle: string | null;
  instrumentStatus: string | null;
};

export async function loadRepresentativeWorkspaceSnapshotWithClient(params: {
  client: Pick<PrismaClient, "$queryRaw">;
  userId: string;
}): Promise<RepresentativeWorkspaceRecord | null> {
  const userId = params.userId.trim();
  if (!userId) throw new Error("REPRESENTATIVE_WORKSPACE_USER_REQUIRED");
  const rows: WorkspaceRow[] = await params.client.$queryRaw`
    SELECT participant.id AS "participantId", participant."docketReference",
      participant."displayName", participant.standing, participant."admittedAt",
      intake.reference AS "intakeReference", appointment.id AS "appointmentId",
      appointment."appointmentClass", appointment."effectiveAt", appointment."expiresAt",
      appointment."endedAt", instrument.id AS "instrumentId",
      instrument.reference AS "instrumentReference", instrument.title AS "instrumentTitle",
      instrument.status AS "instrumentStatus"
    FROM public."RepresentativeProgramParticipant" participant
    LEFT JOIN public."RepresentativeOnboardingIntake" intake
      ON intake."admittedParticipantId" = participant.id
    LEFT JOIN LATERAL (
      SELECT a.id, a."instrumentId", a."appointmentClass", a."effectiveAt", a."expiresAt", a."endedAt"
      FROM public."RepresentativeProgramAppointment" a
      WHERE a."participantId" = participant.id
      ORDER BY a."createdAt" DESC
      LIMIT 1
    ) appointment ON true
    LEFT JOIN public."InstitutionalInstrument" instrument ON instrument.id = appointment."instrumentId"
    WHERE participant."userId" = ${userId}
  `;
  if (!rows.length) return null;
  if (rows.length !== 1) {
    throw new Error(`[REPRESENTATIVE_WORKSPACE_PARTICIPANT_CONTRADICTION] userId=${userId} count=${rows.length}`);
  }
  const row = rows[0];
  let appointment: RepresentativeWorkspaceRecord["appointment"] = null;
  if (row.appointmentId !== null) {
    if (row.appointmentClass === null || row.instrumentId === null ||
        row.instrumentReference === null || row.instrumentTitle === null || row.instrumentStatus === null) {
      throw new Error("[REPRESENTATIVE_WORKSPACE_APPOINTMENT_RECORD_CONFLICT]");
    }
    appointment = {
      id: row.appointmentId,
      appointmentClass: row.appointmentClass,
      effectiveAt: row.effectiveAt,
      expiresAt: row.expiresAt,
      endedAt: row.endedAt,
      instrument: {
        id: row.instrumentId, reference: row.instrumentReference,
        title: row.instrumentTitle, status: row.instrumentStatus,
      },
    };
  }
  return {
    participantId: row.participantId, docketReference: row.docketReference,
    displayName: row.displayName, standing: row.standing, admittedAt: row.admittedAt,
    intakeReference: row.intakeReference, appointment,
  };
}
