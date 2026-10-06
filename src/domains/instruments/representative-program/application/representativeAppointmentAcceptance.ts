import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { recordInstrumentEvidenceWithClient } from "../../commands/recordInstrumentEvidenceWithClient";

type Client = Pick<
  PrismaClient,
  "representativeProgramAppointment" | "institutionalInstrument" |
  "instrumentEvidence" | "domainEvent"
>;

type Evidence = {
  id: string;
  recordedByUserId: string;
  recordedAt: Date;
  subjectId: string | null;
  metadata: unknown;
};

type Appointment = {
  id: string;
  participantId: string;
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
    evidence: Evidence[];
  };
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

export async function loadRepresentativeAppointmentReview(params: {
  client: Client;
  userId: string;
  appointmentId: string;
}) {
  const userId = params.userId.trim();
  const appointmentId = params.appointmentId.trim();
  if (!userId || !appointmentId || appointmentId.length > 191) return null;

  const appointment: Appointment | null =
    await params.client.representativeProgramAppointment.findUnique({
      where: { id: appointmentId },
      include: {
        participant: {
          include: {
            onboardingIntake: {
              include: { masterAgreementInstrument: true },
            },
          },
        },
        instrument: {
          include: {
            evidence: {
              where: {
                evidenceType: "ATTESTATION",
                subjectType: "EXECUTION",
                title: "Representative appointment acceptance",
              },
            },
          },
        },
      },
    });

  if (!appointment || appointment.participant.userId !== userId) return null;

  const participant = appointment.participant;
  const intake = participant.onboardingIntake;
  const agreement = intake?.masterAgreementInstrument;
  const scope = record(appointment.scope);

  if (
    participant.id !== appointment.participantId ||
    appointment.instrument.kind !== "REPRESENTATIVE_APPOINTMENT" ||
    !intake ||
    intake.status !== "ADMITTED" ||
    intake.admittedParticipantId !== participant.id ||
    !agreement ||
    agreement.id !== intake.masterAgreementInstrumentId ||
    agreement.kind !== "REPRESENTATIVE_PROGRAM_AGREEMENT" ||
    agreement.status !== "EXECUTED" ||
    !scope ||
    typeof scope.appointmentForm !== "string" ||
    scope.masterAgreementReference !== agreement.reference
  ) throw new Error("[ARP_APPOINTMENT_ACCEPTANCE_RECORD_CONFLICT]");

  const snapshot = {
    appointmentId: appointment.id,
    participantId: participant.id,
    instrumentId: appointment.instrument.id,
    instrumentReference: appointment.instrument.reference,
    instrumentVersion: appointment.instrument.currentVersion,
    title: appointment.instrument.title,
    appointmentClass: appointment.appointmentClass,
    appointmentForm: scope.appointmentForm,
    masterAgreementInstrumentId: agreement.id,
    masterAgreementReference: agreement.reference,
    scope: Object.fromEntries(
      Object.entries(scope).sort(([a], [b]) => a.localeCompare(b)),
    ),
    expiresAt: appointment.expiresAt?.toISOString() ?? null,
  };

  const reviewHash = createHash("sha256")
    .update(JSON.stringify(snapshot)).digest("hex");

  const evidence = appointment.instrument.evidence;
  if (evidence.length > 1) {
    throw new Error("[ARP_APPOINTMENT_ACCEPTANCE_EVIDENCE_CONFLICT]");
  }

  const existing = evidence[0];
  let acceptedAt: string | null = null;

  if (existing) {
    const fields = record(existing.metadata);
    if (
      existing.recordedByUserId !== userId ||
      existing.subjectId !== appointment.id ||
      fields?.acceptedByUserId !== userId ||
      fields.participantId !== participant.id ||
      fields.appointmentId !== appointment.id ||
      fields.instrumentReference !== appointment.instrument.reference ||
      fields.reviewHash !== reviewHash ||
      fields.acceptedAt !== existing.recordedAt.toISOString()
    ) throw new Error("[ARP_APPOINTMENT_ACCEPTANCE_EVIDENCE_CONFLICT]");
    acceptedAt = existing.recordedAt.toISOString();
  }

  return {
    ...snapshot,
    displayName: participant.displayName,
    standing: participant.standing,
    status: appointment.instrument.status,
    effectiveAt: appointment.effectiveAt,
    endedAt: appointment.endedAt,
    reviewHash,
    acceptedAt,
    canAccept:
      !acceptedAt &&
      participant.standing === "PROVISIONAL" &&
      appointment.instrument.status === "DRAFT" &&
      appointment.effectiveAt === null &&
      appointment.endedAt === null &&
      (!appointment.expiresAt || appointment.expiresAt.getTime() > Date.now()),
  };
}

export async function acceptRepresentativeAppointmentWithClient(params: {
  client: Client;
  userId: string;
  appointmentId: string;
  reviewHash: string;
  confirmAcceptance: boolean;
}) {
  if (params.confirmAcceptance !== true) {
    throw new Error("[ARP_APPOINTMENT_ACCEPTANCE_CONFIRMATION_REQUIRED]");
  }

  const review = await loadRepresentativeAppointmentReview(params);
  if (!review) throw new Error("[ARP_APPOINTMENT_ACCEPTANCE_NOT_FOUND]");
  if (review.reviewHash !== params.reviewHash) {
    throw new Error("[ARP_APPOINTMENT_ACCEPTANCE_REVIEW_CHANGED]");
  }

  if (review.acceptedAt) {
    return { appointmentId: review.appointmentId, accepted: false };
  }
  if (!review.canAccept) {
    throw new Error("[ARP_APPOINTMENT_ACCEPTANCE_STATE_CONFLICT]");
  }

  const acceptedAt = new Date();
  await recordInstrumentEvidenceWithClient({
    client: params.client,
    instrumentReference: review.instrumentReference,
    evidenceType: "ATTESTATION",
    subjectType: "EXECUTION",
    subjectId: review.appointmentId,
    title: "Representative appointment acceptance",
    recordedByUserId: params.userId.trim(),
    recordedAt: acceptedAt,
    metadata: {
      acceptedByUserId: params.userId.trim(),
      participantId: review.participantId,
      appointmentId: review.appointmentId,
      instrumentReference: review.instrumentReference,
      acceptedAt: acceptedAt.toISOString(),
      reviewHash: review.reviewHash,
      reviewedConfiguration: {
        instrumentVersion: review.instrumentVersion,
        appointmentClass: review.appointmentClass,
        appointmentForm: review.appointmentForm,
        masterAgreementReference: review.masterAgreementReference,
      },
    },
  });

  return { appointmentId: review.appointmentId, accepted: true };
}

export async function acceptRepresentativeAppointment(
  params: Omit<
    Parameters<typeof acceptRepresentativeAppointmentWithClient>[0],
    "client"
  > & { client: Pick<PrismaClient, "$transaction"> },
) {
  return params.client.$transaction(
    (tx: Client) => acceptRepresentativeAppointmentWithClient({ ...params, client: tx }),
    {
      isolationLevel: "Serializable",
      maxWait: 10000,
      timeout: 30000,
    },
  );
}

/**
 * Operator projection uses the participant's canonical linked identity.
 * The calling HTTP route must authenticate and authorize the administrator.
 */
export async function loadRepresentativeAppointmentOperatorState(params: {
  client: Client;
  participantId: string;
}) {
  const participantId = params.participantId.trim();
  if (!participantId || participantId.length > 191) {
    throw new Error("[ARP_APPOINTMENT_OPERATOR_INPUT_INVALID]");
  }

  const rows: Array<{
    id: string;
    participant: { userId: string | null };
  }> = await params.client.representativeProgramAppointment.findMany({
    where: { participantId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 1,
    select: {
      id: true,
      participant: { select: { userId: true } },
    },
  });

  if (!rows.length) return null;
  const userId = rows[0].participant.userId;
  if (!userId) {
    throw new Error("[ARP_APPOINTMENT_OPERATOR_IDENTITY_REQUIRED]");
  }

  const review = await loadRepresentativeAppointmentReview({
    client: params.client,
    userId,
    appointmentId: rows[0].id,
  });
  if (!review || review.participantId !== participantId) {
    throw new Error("[ARP_APPOINTMENT_OPERATOR_IDENTITY_CONFLICT]");
  }

  return {
    appointmentId: review.appointmentId,
    reference: review.instrumentReference,
    status: review.status,
    standing: review.standing,
    effectiveAt: review.effectiveAt,
    acceptedAt: review.acceptedAt,
    canActivate:
      Boolean(review.acceptedAt) &&
      review.status === "DRAFT" &&
      review.standing === "PROVISIONAL" &&
      review.effectiveAt === null &&
      review.endedAt === null &&
      (!review.expiresAt || new Date(review.expiresAt).getTime() > Date.now()),
  };
}
