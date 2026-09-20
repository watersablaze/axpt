import type { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTRUMENT_AUTHORITY_CLASS,
  isInstrumentAuthorityActive,
  type InstrumentAuthority,
  type InstrumentAuthorityClass,
} from "../../contracts";

import { recordInstrumentAuthorityWithClient } from "../../commands/recordInstrumentAuthorityWithClient";

import {
  REPRESENTATIVE_AUTHORITY_TITLE,
  isRepresentativeProgramTerminalStanding,
  type RepresentativeAuthorityConditions,
  type RepresentativeAuthorityKey,
} from "../contracts";

export type RepresentativeProgramAuthorityRecordingClient = Pick<
  PrismaClient,
  | "representativeProgramAppointment"
  | "institutionalInstrument"
  | "instrumentParty"
  | "instrumentAuthority"
  | "domainEvent"
>;

function canonicalizeJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalizeJson);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalizeJson(child)]),
    );
  }

  return value;
}

function equalJson(left: unknown, right: unknown): boolean {
  return (
    JSON.stringify(canonicalizeJson(left)) ===
    JSON.stringify(canonicalizeJson(right))
  );
}

export async function recordRepresentativeProgramAuthorityWithClient(params: {
  client: RepresentativeProgramAuthorityRecordingClient;
  appointmentId: string;
  authorityKey: RepresentativeAuthorityKey;
  authorityClass: InstrumentAuthorityClass;
  action: string;
  conditions?: RepresentativeAuthorityConditions;
  effectiveAt?: Date;
  expiresAt?: Date | null;
  actorUserId: string;
}) {
  const action = params.action.trim();

  if (!action) {
    throw new Error("[ARP_AUTHORITY_ACTION_REQUIRED]");
  }

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
      `[ARP_AUTHORITY_APPOINTMENT_NOT_FOUND] ${params.appointmentId}`,
    );
  }

  if (
    appointment.instrument.kind !==
    INSTITUTIONAL_INSTRUMENT_KIND.REPRESENTATIVE_APPOINTMENT
  ) {
    throw new Error(
      `[ARP_AUTHORITY_WRONG_INSTRUMENT_KIND] ${appointment.instrument.kind}`,
    );
  }

  if (appointment.instrumentParty.instrumentId !== appointment.instrumentId) {
    throw new Error("[ARP_AUTHORITY_APPOINTMENT_PARTY_INSTRUMENT_MISMATCH]");
  }

  if (
    isRepresentativeProgramTerminalStanding(appointment.participant.standing)
  ) {
    throw new Error(
      `[ARP_AUTHORITY_PARTICIPANT_TERMINAL] ${appointment.participant.standing}`,
    );
  }

  if (appointment.endedAt) {
    throw new Error("[ARP_AUTHORITY_APPOINTMENT_ENDED]");
  }

  const effectiveAt = params.effectiveAt ?? new Date();

  const expiresAt = params.expiresAt ?? null;

  if (
    appointment.effectiveAt &&
    effectiveAt.getTime() < appointment.effectiveAt.getTime()
  ) {
    throw new Error("[ARP_AUTHORITY_PRECEDES_APPOINTMENT]");
  }

  if (
    appointment.expiresAt &&
    effectiveAt.getTime() >= appointment.expiresAt.getTime()
  ) {
    throw new Error("[ARP_AUTHORITY_EFFECTIVE_AFTER_APPOINTMENT_EXPIRY]");
  }

  if (
    expiresAt &&
    appointment.expiresAt &&
    expiresAt.getTime() > appointment.expiresAt.getTime()
  ) {
    throw new Error("[ARP_AUTHORITY_EXCEEDS_APPOINTMENT_TERM]");
  }

  const holderPartyId =
    params.authorityClass === INSTRUMENT_AUTHORITY_CLASS.RESERVED
      ? null
      : appointment.instrumentPartyId;

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

  const operative = candidates.filter((candidate: InstrumentAuthority) =>
    isInstrumentAuthorityActive(candidate, effectiveAt),
  );

  if (operative.length > 1) {
    throw new Error(
      `[ARP_AUTHORITY_SLOT_CONTRADICTION] key=${params.authorityKey} count=${operative.length}`,
    );
  }

  const existing = operative[0];

  if (existing) {
    const sameDisposition =
      existing.authorityClass === params.authorityClass &&
      existing.holderPartyId === holderPartyId &&
      existing.action === action &&
      equalJson(existing.conditions, params.conditions ?? null) &&
      (existing.expiresAt?.getTime() ?? null) ===
        (expiresAt?.getTime() ?? null);

    if (sameDisposition) {
      return {
        authority: existing,
        created: false,
      } as const;
    }

    throw new Error(
      `[ARP_AUTHORITY_SLOT_OCCUPIED] key=${params.authorityKey} authorityId=${existing.id}`,
    );
  }

  return recordInstrumentAuthorityWithClient({
    client: params.client,
    instrumentReference: appointment.instrument.reference,
    authorityKey: params.authorityKey,
    title: REPRESENTATIVE_AUTHORITY_TITLE[params.authorityKey],
    authorityClass: params.authorityClass,
    holderPartyId,
    action,
    conditions: params.conditions,
    effectiveAt,
    expiresAt,
    actorUserId: params.actorUserId,
  });
}
