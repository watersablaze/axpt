import type { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTRUMENT_AUTHORITY_CLASS,
  isInstrumentAuthorityActive,
  type InstrumentAuthority,
} from "../../contracts";

import {
  REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON,
  REPRESENTATIVE_PROGRAM_STANDING,
  representativeAuthorityConditionsAllowRestrictedStanding,
  type RepresentativeAuthorityKey,
} from "../contracts";

import {
  assertRepresentativeAuthorityConditions,
  assertRepresentativeAuthorityHolderIntegrity,
  assertRepresentativeAuthorityInterval,
} from "../authorityIntegrity";

export type RepresentativeProgramAuthorityResolutionClient = Pick<
  PrismaClient,
  "representativeProgramAppointment" | "instrumentAuthority"
>;

export async function resolveRepresentativeProgramAuthorityExercisabilityWithClient(params: {
  client: RepresentativeProgramAuthorityResolutionClient;
  appointmentId: string;
  authorityKey: RepresentativeAuthorityKey;
  at?: Date;
}) {
  const at = params.at ?? new Date();

  const appointment =
    await params.client.representativeProgramAppointment.findUnique({
      where: {
        id: params.appointmentId,
      },
      include: {
        participant: true,
        instrument: true,
        instrumentParty: true,
      },
    });

  if (!appointment) {
    throw new Error(
      `[ARP_AUTHORITY_RESOLUTION_APPOINTMENT_NOT_FOUND] ${params.appointmentId}`,
    );
  }

  if (
    appointment.instrument.kind !==
    INSTITUTIONAL_INSTRUMENT_KIND.REPRESENTATIVE_APPOINTMENT
  ) {
    throw new Error(
      `[ARP_AUTHORITY_RESOLUTION_WRONG_INSTRUMENT_KIND] ${appointment.instrument.kind}`,
    );
  }

  if (appointment.instrumentParty.instrumentId !== appointment.instrumentId) {
    throw new Error(
      "[ARP_AUTHORITY_RESOLUTION_APPOINTMENT_PARTY_INSTRUMENT_MISMATCH]",
    );
  }

  const candidates = await params.client.instrumentAuthority.findMany({
    where: {
      instrumentId: appointment.instrumentId,
      authorityKey: params.authorityKey,
      revokedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
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

  const operative = candidates.filter((candidate: InstrumentAuthority) => {
    assertRepresentativeAuthorityInterval({
      effectiveAt: candidate.effectiveAt,
      expiresAt: candidate.expiresAt,
    });

    return isInstrumentAuthorityActive(candidate, at);
  });

  if (operative.length > 1) {
    throw new Error(
      `[ARP_AUTHORITY_RESOLUTION_CONTRADICTION] key=${params.authorityKey} count=${operative.length}`,
    );
  }

  const authority = operative[0] ?? null;

  const result = (
    exercisable: boolean,
    reason: (typeof REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON)[keyof typeof REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON],
  ) => ({
    exercisable,
    reason,
    evaluatedAt: at,
    participantId: appointment.participantId,
    participantStanding: appointment.participant.standing,
    appointmentId: appointment.id,
    appointmentClass: appointment.appointmentClass,
    instrumentId: appointment.instrumentId,
    instrumentReference: appointment.instrument.reference,
    instrumentPartyId: appointment.instrumentPartyId,
    authority,
  });

  if (!authority) {
    return result(
      false,
      REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON.AUTHORITY_NOT_RECORDED,
    );
  }

  assertRepresentativeAuthorityConditions(authority.conditions);

  assertRepresentativeAuthorityHolderIntegrity({
    authorityId: authority.id,
    authorityClass: authority.authorityClass,
    holderPartyId: authority.holderPartyId,
    appointmentInstrumentPartyId: appointment.instrumentPartyId,
  });

  if (
    appointment.effectiveAt &&
    at.getTime() < appointment.effectiveAt.getTime()
  ) {
    return result(
      false,
      REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON.APPOINTMENT_NOT_YET_EFFECTIVE,
    );
  }

  if (appointment.endedAt) {
    return result(
      false,
      REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON.APPOINTMENT_ENDED,
    );
  }

  if (
    appointment.expiresAt &&
    at.getTime() >= appointment.expiresAt.getTime()
  ) {
    return result(
      false,
      REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON.APPOINTMENT_EXPIRED,
    );
  }

  if (authority.authorityClass === INSTRUMENT_AUTHORITY_CLASS.RESERVED) {
    return result(
      false,
      REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON.AUTHORITY_RESERVED,
    );
  }

  if (authority.authorityClass === INSTRUMENT_AUTHORITY_CLASS.PROHIBITED) {
    return result(
      false,
      REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON.AUTHORITY_PROHIBITED,
    );
  }

  if (authority.authorityClass === INSTRUMENT_AUTHORITY_CLASS.JOINT) {
    return result(
      false,
      REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON.JOINT_AUTHORITY_REQUIRES_COORDINATION,
    );
  }

  switch (appointment.participant.standing) {
    case REPRESENTATIVE_PROGRAM_STANDING.ACTIVE:
      return result(
        true,
        REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON.EXERCISABLE,
      );

    case REPRESENTATIVE_PROGRAM_STANDING.PROVISIONAL:
      return result(
        false,
        REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON.PARTICIPANT_PROVISIONAL,
      );

    case REPRESENTATIVE_PROGRAM_STANDING.RESTRICTED:
      if (
        representativeAuthorityConditionsAllowRestrictedStanding(
          authority.conditions,
        )
      ) {
        return result(
          true,
          REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON.EXERCISABLE,
        );
      }

      return result(
        false,
        REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON.PARTICIPANT_RESTRICTED,
      );

    case REPRESENTATIVE_PROGRAM_STANDING.SUSPENDED:
      return result(
        false,
        REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON.PARTICIPANT_SUSPENDED,
      );

    case REPRESENTATIVE_PROGRAM_STANDING.EXPIRED:
      return result(
        false,
        REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON.PARTICIPANT_EXPIRED,
      );

    case REPRESENTATIVE_PROGRAM_STANDING.WITHDRAWN:
      return result(
        false,
        REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON.PARTICIPANT_WITHDRAWN,
      );

    case REPRESENTATIVE_PROGRAM_STANDING.REVOKED:
      return result(
        false,
        REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON.PARTICIPANT_REVOKED,
      );
  }

  throw new Error(
    `[ARP_AUTHORITY_RESOLUTION_UNKNOWN_STANDING] ${appointment.participant.standing}`,
  );
}
