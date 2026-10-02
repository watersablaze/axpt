import type { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTITUTIONAL_INSTRUMENT_STATUS,
  INSTRUMENT_EVIDENCE_SUBJECT,
  INSTRUMENT_EVIDENCE_TYPE,
  INSTRUMENT_PARTY_ROLE,
  INSTRUMENT_RELATION_TYPE,
  INSTRUMENT_VERSION_STATUS,
} from "../../contracts";

import { createInstrumentRelationWithClient } from "../../commands/createInstrumentRelationWithClient";
import { recordInstrumentEvidenceWithClient } from "../../commands/recordInstrumentEvidenceWithClient";
import { INSTRUMENT_EVENT_TYPE } from "../../eventTypes";
import { INSTITUTIONAL_INSTRUMENT_STREAM_TYPE } from "../../stream";

import {
  REPRESENTATIVE_PROGRAM_STANDING,
  type RepresentativeAppointmentClass,
  type RepresentativeAppointmentForm,
} from "../contracts";

import { REPRESENTATIVE_ONBOARDING_STATUS } from "../onboarding/contracts";

import { createRepresentativeProgramAppointmentWithClient } from "./createRepresentativeProgramAppointmentWithClient";

export type RepresentativeProgramAppointmentPreparationClient = Pick<
  PrismaClient,
  | "user"
  | "representativeProgramParticipant"
  | "representativeProgramAppointment"
  | "institutionalInstrument"
  | "instrumentParty"
  | "instrumentRelation"
  | "instrumentEvidence"
  | "domainEvent"
>;

type Runner = Pick<PrismaClient, "$transaction">;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function appointmentScopeMatches(params: {
  scope: unknown;
  appointmentForm: RepresentativeAppointmentForm;
  masterAgreementReference: string;
}): boolean {
  if (!isPlainRecord(params.scope)) {
    return false;
  }

  const keys = Object.keys(params.scope).sort();

  return (
    keys.length === 2 &&
    keys[0] === "appointmentForm" &&
    keys[1] === "masterAgreementReference" &&
    params.scope.appointmentForm === params.appointmentForm &&
    params.scope.masterAgreementReference === params.masterAgreementReference
  );
}

/**
 * APPT-1
 *
 * Prepare the institutional Appointment Instrument for an
 * already-admitted Program Participant.
 *
 * This operation:
 * - requires a bound EXECUTED Program Master Agreement;
 * - requires the Participant to remain PROVISIONAL;
 * - creates a DRAFT Appointment Instrument;
 * - binds the Appointment record to that Instrument;
 * - records its derivation from the Master Agreement;
 * - creates no authority;
 * - does not activate the Participant or Appointment Instrument.
 */
export async function prepareRepresentativeProgramAppointmentWithClient(params: {
  client: RepresentativeProgramAppointmentPreparationClient;
  participantId: string;
  reference: string;
  title: string;
  appointmentClass: RepresentativeAppointmentClass;
  appointmentForm: RepresentativeAppointmentForm;
  actorUserId: string;
  occurredAt?: Date;
}) {
  const participantId = params.participantId.trim();
  const reference = params.reference.trim();
  const title = params.title.trim();
  const actorUserId = params.actorUserId.trim();
  const occurredAt = params.occurredAt ?? new Date();

  if (
    !participantId ||
    !reference ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/.test(reference) ||
    !title ||
    !actorUserId ||
    !Number.isFinite(occurredAt.getTime())
  ) {
    throw new Error("[ARP_APPOINTMENT_PREPARATION_INPUT_INVALID]");
  }

  const actor = await params.client.user.findUnique({
    where: {
      id: actorUserId,
    },
    select: {
      isAdmin: true,
    },
  });

  if (!actor?.isAdmin) {
    throw new Error("[ARP_APPOINTMENT_PREPARATION_ADMIN_REQUIRED]");
  }

  const participant =
    await params.client.representativeProgramParticipant.findUnique({
      where: {
        id: participantId,
      },
      include: {
        onboardingIntake: {
          include: {
            masterAgreementInstrument: true,
          },
        },
      },
    });

  if (!participant) {
    throw new Error(
      `[ARP_APPOINTMENT_PREPARATION_PARTICIPANT_NOT_FOUND] ${participantId}`,
    );
  }

  if (participant.standing !== REPRESENTATIVE_PROGRAM_STANDING.PROVISIONAL) {
    throw new Error(
      `[ARP_APPOINTMENT_PREPARATION_PARTICIPANT_NOT_PROVISIONAL] ${participant.standing}`,
    );
  }

  const intake = participant.onboardingIntake;

  if (
    !intake ||
    intake.status !== REPRESENTATIVE_ONBOARDING_STATUS.ADMITTED ||
    intake.admittedParticipantId !== participant.id ||
    !intake.masterAgreementInstrumentId ||
    !intake.masterAgreementInstrument
  ) {
    throw new Error("[ARP_APPOINTMENT_PREPARATION_ADMISSION_BINDING_REQUIRED]");
  }

  const masterAgreement = intake.masterAgreementInstrument;

  if (
    masterAgreement.kind !==
    INSTITUTIONAL_INSTRUMENT_KIND.REPRESENTATIVE_PROGRAM_AGREEMENT
  ) {
    throw new Error(
      "[ARP_APPOINTMENT_PREPARATION_MASTER_AGREEMENT_KIND_INVALID]",
    );
  }

  if (masterAgreement.status !== INSTITUTIONAL_INSTRUMENT_STATUS.EXECUTED) {
    throw new Error(
      `[ARP_APPOINTMENT_PREPARATION_MASTER_AGREEMENT_NOT_EXECUTED] ${masterAgreement.status}`,
    );
  }

  const appointmentScope = {
    appointmentForm: params.appointmentForm,
    masterAgreementReference: masterAgreement.reference,
  };

  const existing = await params.client.institutionalInstrument.findUnique({
    where: {
      reference,
    },
    include: {
      versions: {
        where: {
          number: 1,
        },
      },
      parties: true,
      representativeProgramAppointment: true,
      outboundRelations: {
        where: {
          relationType: INSTRUMENT_RELATION_TYPE.DERIVES_FROM,
        },
      },
    },
  });

  if (existing) {
    const appointment = existing.representativeProgramAppointment;

    const sameAppointment =
      existing.kind ===
        INSTITUTIONAL_INSTRUMENT_KIND.REPRESENTATIVE_APPOINTMENT &&
      existing.title === title &&
      existing.status === INSTITUTIONAL_INSTRUMENT_STATUS.DRAFT &&
      existing.versions.some(
        (version: { number: number; status: string | null }) =>
          version.number === 1 &&
          version.status === INSTRUMENT_VERSION_STATUS.DRAFT,
      ) &&
      appointment?.participantId === participant.id &&
      appointment.appointmentClass === params.appointmentClass &&
      appointment.effectiveAt === null &&
      appointment.expiresAt === null &&
      appointmentScopeMatches({
        scope: appointment.scope,
        appointmentForm: params.appointmentForm,
        masterAgreementReference: masterAgreement.reference,
      }) &&
      existing.outboundRelations.some(
        (relation: { targetInstrumentId: string; relationType: string }) =>
          relation.targetInstrumentId === masterAgreement.id &&
          relation.relationType === INSTRUMENT_RELATION_TYPE.DERIVES_FROM,
      );

    if (!sameAppointment) {
      throw new Error("[ARP_APPOINTMENT_PREPARATION_REFERENCE_CONFLICT]");
    }

    return {
      instrumentId: existing.id,
      appointmentId: appointment.id,
      reference,
      appointmentClass: appointment.appointmentClass,
      appointmentForm: params.appointmentForm,
      masterAgreementInstrumentId: masterAgreement.id,
      masterAgreementReference: masterAgreement.reference,
      created: false,
    } as const;
  }

  const instrument = await params.client.institutionalInstrument.create({
    data: {
      reference,
      title,
      kind: INSTITUTIONAL_INSTRUMENT_KIND.REPRESENTATIVE_APPOINTMENT,
      status: INSTITUTIONAL_INSTRUMENT_STATUS.DRAFT,
      currentVersion: 1,
      createdByUserId: actorUserId,

      versions: {
        create: {
          number: 1,
          status: INSTRUMENT_VERSION_STATUS.DRAFT,
          createdByUserId: actorUserId,
        },
      },

      parties: {
        create: [
          {
            displayName: "French-Ward, Inc.",
            role: INSTRUMENT_PARTY_ROLE.PRINCIPAL,
          },
          {
            userId: participant.userId,
            displayName: participant.displayName,
            role: INSTRUMENT_PARTY_ROLE.COMMERCIAL_PARTICIPANT,
          },
        ],
      },
    },
    include: {
      versions: {
        where: {
          number: 1,
        },
      },
    },
  });

  const version = instrument.versions[0];

  if (!version) {
    throw new Error("[ARP_APPOINTMENT_PREPARATION_VERSION_MISSING]");
  }

  await params.client.domainEvent.createMany({
    data: [
      {
        streamType: INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
        streamId: instrument.id,
        eventType: INSTRUMENT_EVENT_TYPE.INSTRUMENT_CREATED,
        payload: {
          reference,
          kind: instrument.kind,
          title,
        },
        metadata: {
          actorUserId,
          source: "representative-program.appointment-preparation",
        },
        occurredAt,
      },
      {
        streamType: INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
        streamId: instrument.id,
        eventType: INSTRUMENT_EVENT_TYPE.INSTRUMENT_VERSION_CREATED,
        payload: {
          versionId: version.id,
          versionNumber: 1,
        },
        metadata: {
          actorUserId,
          source: "representative-program.appointment-preparation",
        },
        occurredAt,
      },
    ],
  });

  const appointmentResult =
    await createRepresentativeProgramAppointmentWithClient({
      client: params.client,
      participantId: participant.id,
      instrumentId: instrument.id,
      appointmentClass: params.appointmentClass,
      scope: appointmentScope,
      effectiveAt: null,
      expiresAt: null,
      actorUserId,
    });

  await createInstrumentRelationWithClient({
    client: params.client,
    sourceInstrumentReference: reference,
    targetInstrumentReference: masterAgreement.reference,
    relationType: INSTRUMENT_RELATION_TYPE.DERIVES_FROM,
    label: "Appointment derives from executed Program Master Agreement",
    metadata: {
      participantId: participant.id,
      docketReference: participant.docketReference,
    },
    createdByUserId: actorUserId,
    occurredAt,
  });

  await recordInstrumentEvidenceWithClient({
    client: params.client,
    instrumentReference: reference,
    evidenceType: INSTRUMENT_EVIDENCE_TYPE.ATTESTATION,
    subjectType: INSTRUMENT_EVIDENCE_SUBJECT.INSTRUMENT,
    title: "Appointment participant designation",
    metadata: {
      participantId: participant.id,
      docketReference: participant.docketReference,
      candidateEmail: intake.candidateEmail,
      appointmentClass: params.appointmentClass,
      appointmentForm: params.appointmentForm,
      masterAgreementInstrumentId: masterAgreement.id,
      masterAgreementReference: masterAgreement.reference,
    },
    recordedByUserId: actorUserId,
    recordedAt: occurredAt,
  });

  return {
    instrumentId: instrument.id,
    appointmentId: appointmentResult.appointment.id,
    reference,
    appointmentClass: params.appointmentClass,
    appointmentForm: params.appointmentForm,
    masterAgreementInstrumentId: masterAgreement.id,
    masterAgreementReference: masterAgreement.reference,
    created: true,
  } as const;
}

export async function prepareRepresentativeProgramAppointment(
  params: Omit<
    Parameters<typeof prepareRepresentativeProgramAppointmentWithClient>[0],
    "client"
  > & {
    client: Runner;
  },
) {
  return params.client.$transaction(
    (tx: RepresentativeProgramAppointmentPreparationClient) =>
      prepareRepresentativeProgramAppointmentWithClient({
        ...params,
        client: tx,
      }),
    {
      maxWait: 10_000,
      timeout: 30_000,
    },
  );
}
