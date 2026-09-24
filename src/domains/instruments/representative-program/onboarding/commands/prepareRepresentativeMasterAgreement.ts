import type { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTITUTIONAL_INSTRUMENT_STATUS,
  INSTRUMENT_EVIDENCE_SUBJECT,
  INSTRUMENT_EVIDENCE_TYPE,
  INSTRUMENT_PARTY_ROLE,
  INSTRUMENT_VERSION_STATUS,
} from "../../../contracts";
import { INSTRUMENT_EVENT_TYPE } from "../../../eventTypes";
import { INSTITUTIONAL_INSTRUMENT_STREAM_TYPE } from "../../../stream";
import { recordInstrumentEvidenceWithClient } from "../../../commands/recordInstrumentEvidenceWithClient";

type Client = Pick<
  PrismaClient,
  "user" | "institutionalInstrument" | "instrumentEvidence" | "domainEvent"
>;

type Runner = Pick<PrismaClient, "$transaction">;

function matchesCandidate(
  metadata: unknown,
  candidateEmail: string,
): boolean {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return false;
  }

  const recorded = (metadata as Record<string, unknown>).candidateEmail;
  return (
    typeof recorded === "string" &&
    recorded.toLowerCase() === candidateEmail
  );
}

/**
 * Establish the agreement's identity before Acrobat evidence is received.
 * This creates no Program Participant, appointment, or authority.
 */
export async function prepareRepresentativeMasterAgreementWithClient(params: {
  client: Client;
  reference: string;
  title: string;
  candidateDisplayName: string;
  candidateEmail: string;
  actorUserId: string;
  occurredAt?: Date;
}) {
  const reference = params.reference.trim();
  const title = params.title.trim();
  const candidateDisplayName = params.candidateDisplayName.trim();
  const candidateEmail = params.candidateEmail.trim().toLowerCase();
  const actorUserId = params.actorUserId.trim();
  const occurredAt = params.occurredAt ?? new Date();

  if (
    !reference ||
    !title ||
    !candidateDisplayName ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail) ||
    !actorUserId ||
    !Number.isFinite(occurredAt.getTime())
  ) {
    throw new Error("[ARP_MASTER_AGREEMENT_PREPARATION_INPUT_INVALID]");
  }

  const actor = await params.client.user.findUnique({
    where: { id: actorUserId },
    select: { isAdmin: true },
  });

  if (!actor?.isAdmin) {
    throw new Error("[ARP_MASTER_AGREEMENT_ADMIN_REQUIRED]");
  }

  const existing = await params.client.institutionalInstrument.findUnique({
    where: { reference },
    include: {
      versions: { where: { number: 1 } },
      parties: true,
      evidence: {
        where: {
          evidenceType: INSTRUMENT_EVIDENCE_TYPE.ATTESTATION,
          subjectType: INSTRUMENT_EVIDENCE_SUBJECT.INSTRUMENT,
        },
      },
    },
  });

  if (existing) {
    const sameAgreement =
      existing.kind ===
        INSTITUTIONAL_INSTRUMENT_KIND.REPRESENTATIVE_PROGRAM_AGREEMENT &&
      existing.title === title &&
      (
        (
          existing.status === INSTITUTIONAL_INSTRUMENT_STATUS.DRAFT &&
          existing.versions.some(
            (version: { number: number; status: string | null }) =>
              version.number === 1 &&
              version.status === INSTRUMENT_VERSION_STATUS.DRAFT,
          )
        ) ||
        (
          (
            existing.status === INSTITUTIONAL_INSTRUMENT_STATUS.EXECUTION_PENDING ||
            existing.status === INSTITUTIONAL_INSTRUMENT_STATUS.EXECUTED
          ) &&
          existing.versions.some(
            (version: { number: number; status: string | null }) =>
              version.number === 1 &&
              version.status === INSTRUMENT_VERSION_STATUS.ISSUED,
          )
        )
      ) &&
      existing.parties.some(
        (party: { displayName: string | null; role: string | null }) =>
          party.displayName === candidateDisplayName &&
          party.role === INSTRUMENT_PARTY_ROLE.PRINCIPAL,
      ) &&
      existing.evidence.some((item: { metadata: unknown }) =>
        matchesCandidate(item.metadata, candidateEmail),
      );

    if (!sameAgreement) {
      throw new Error("[ARP_MASTER_AGREEMENT_REFERENCE_CONFLICT]");
    }

    return { instrumentId: existing.id, reference, created: false } as const;
  }

  const instrument = await params.client.institutionalInstrument.create({
    data: {
      reference,
      title,
      kind: INSTITUTIONAL_INSTRUMENT_KIND.REPRESENTATIVE_PROGRAM_AGREEMENT,
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
            displayName: candidateDisplayName,
            role: INSTRUMENT_PARTY_ROLE.PRINCIPAL,
          },
        ],
      },
    },
    include: { versions: { where: { number: 1 } } },
  });

  const version = instrument.versions[0];
  if (!version) {
    throw new Error("[ARP_MASTER_AGREEMENT_VERSION_MISSING]");
  }

  await params.client.domainEvent.createMany({
    data: [
      {
        streamType: INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
        streamId: instrument.id,
        eventType: INSTRUMENT_EVENT_TYPE.INSTRUMENT_CREATED,
        payload: { reference, kind: instrument.kind, title },
        metadata: {
          actorUserId,
          source: "representative-program.master-agreement-preparation",
        },
        occurredAt,
      },
      {
        streamType: INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
        streamId: instrument.id,
        eventType: INSTRUMENT_EVENT_TYPE.INSTRUMENT_VERSION_CREATED,
        payload: { versionId: version.id, versionNumber: 1 },
        metadata: {
          actorUserId,
          source: "representative-program.master-agreement-preparation",
        },
        occurredAt,
      },
    ],
  });

  await recordInstrumentEvidenceWithClient({
    client: params.client,
    instrumentReference: reference,
    evidenceType: INSTRUMENT_EVIDENCE_TYPE.ATTESTATION,
    subjectType: INSTRUMENT_EVIDENCE_SUBJECT.INSTRUMENT,
    title: "Master Agreement candidate designation",
    metadata: { candidateDisplayName, candidateEmail },
    recordedByUserId: actorUserId,
    recordedAt: occurredAt,
  });

  return { instrumentId: instrument.id, reference, created: true } as const;
}

export async function prepareRepresentativeMasterAgreement(
  params: Omit<
    Parameters<typeof prepareRepresentativeMasterAgreementWithClient>[0],
    "client"
  > & { client: Runner },
) {
  return params.client.$transaction((tx: Client) =>
    prepareRepresentativeMasterAgreementWithClient({
      ...params,
      client: tx,
    }),
  );
}
