import type { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTRUMENT_AUTHORITY_CLASS,
  isInstrumentAuthorityActive,
  type InstrumentAuthority,
} from "../../contracts";

import { revokeInstrumentAuthorityWithClient } from "../../commands/revokeInstrumentAuthorityWithClient";

import type { RepresentativeAuthorityKey } from "../contracts";

export type RepresentativeProgramAuthorityRevocationClient = Pick<
  PrismaClient,
  "representativeProgramAppointment" | "instrumentAuthority" | "domainEvent"
>;

export async function revokeRepresentativeProgramAuthorityWithClient(params: {
  client: RepresentativeProgramAuthorityRevocationClient;
  appointmentId: string;
  authorityKey: RepresentativeAuthorityKey;
  revokedByUserId: string;
  revokedAt?: Date;
}) {
  const revokedAt = params.revokedAt ?? new Date();

  const appointment =
    await params.client.representativeProgramAppointment.findUnique({
      where: {
        id: params.appointmentId,
      },
      include: {
        instrument: true,
        instrumentParty: true,
      },
    });

  if (!appointment) {
    throw new Error(
      `[ARP_AUTHORITY_REVOCATION_APPOINTMENT_NOT_FOUND] ${params.appointmentId}`,
    );
  }

  if (
    appointment.instrument.kind !==
    INSTITUTIONAL_INSTRUMENT_KIND.REPRESENTATIVE_APPOINTMENT
  ) {
    throw new Error(
      `[ARP_AUTHORITY_REVOCATION_WRONG_INSTRUMENT_KIND] ${appointment.instrument.kind}`,
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

  const operative = candidates.filter((candidate: InstrumentAuthority) =>
    isInstrumentAuthorityActive(candidate, revokedAt),
  );

  if (operative.length > 1) {
    throw new Error(
      `[ARP_AUTHORITY_REVOCATION_SLOT_CONTRADICTION] key=${params.authorityKey} count=${operative.length}`,
    );
  }

  const authority = operative[0] ?? null;

  if (!authority) {
    return {
      revoked: false,
      authorityId: null,
      revokedAt: null,
    } as const;
  }

  const expectedHolderPartyId =
    authority.authorityClass === INSTRUMENT_AUTHORITY_CLASS.RESERVED
      ? null
      : appointment.instrumentPartyId;

  if (authority.holderPartyId !== expectedHolderPartyId) {
    throw new Error(
      `[ARP_AUTHORITY_REVOCATION_FOREIGN_HOLDER] authorityId=${authority.id}`,
    );
  }

  if (revokedAt.getTime() < authority.effectiveAt.getTime()) {
    throw new Error("[ARP_AUTHORITY_REVOCATION_PRECEDES_EFFECTIVE_AT]");
  }

  const result = await revokeInstrumentAuthorityWithClient({
    client: params.client,
    authorityId: authority.id,
    revokedByUserId: params.revokedByUserId,
    revokedAt,
  });

  return {
    revoked: result.revoked,
    authorityId: authority.id,
    revokedAt: result.revokedAt,
  } as const;
}
