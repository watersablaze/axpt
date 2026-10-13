import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { loadRepresentativeAppointmentReview } from "./representativeAppointmentAcceptance";
import { recordInstrumentEvidenceWithClient } from "../../commands/recordInstrumentEvidenceWithClient";

import {
  loadCertificateAuthorities, certificateAuthoritiesSchema, canonicalCertificateJson,
  type CertificateAuthority,
} from "./appointmentCertificateAuthorities";

const TITLE = "Issued representative appointment certificate";
export const APPOINTMENT_CERTIFICATE_SIGNATORY = {
  name: "Jamal James Ward",
  title: "President & Chief Strategic Officer",
  institution: "French-Ward, Inc.",
} as const;

type Client = Parameters<typeof loadRepresentativeAppointmentReview>[0]["client"] &
  Pick<PrismaClient, "user" | "$queryRaw" | "instrumentAuthority">;
type Runner = Client & Pick<PrismaClient, "$transaction">;
type Review = NonNullable<Awaited<ReturnType<typeof loadRepresentativeAppointmentReview>>>;

export type AppointmentCertificateBasis = {
  appointmentId: string;
  participantId: string;
  instrumentId: string;
  reference: string;
  version: number;
  displayName: string;
  appointmentClass: string;
  appointmentForm: string;
  effectiveAt: string;
  expiresAt: string | null;
  acceptedAt: string;
  reviewHash: string;
  authorities?: CertificateAuthority[];
};

function sha(bytes: Uint8Array | string) {
  return createHash("sha256").update(bytes).digest("hex");
}

function basis(review: Review): AppointmentCertificateBasis {
  const at = Date.now();
  const expires = review.expiresAt === null
    ? null : new Date(review.expiresAt).getTime();
  if (
    review.status !== "ACTIVE" || review.standing !== "ACTIVE" ||
    !review.acceptedAt || !review.effectiveAt ||
    !Number.isFinite(review.effectiveAt.getTime()) ||
    review.effectiveAt.getTime() > at || review.endedAt !== null ||
    (expires !== null && (!Number.isFinite(expires) || expires <= at))
  ) throw new Error("[ARP_CERTIFICATE_STATE_CONFLICT]");

  return {
    appointmentId: review.appointmentId,
    participantId: review.participantId,
    instrumentId: review.instrumentId,
    reference: review.instrumentReference,
    version: review.instrumentVersion,
    displayName: review.displayName,
    appointmentClass: review.appointmentClass,
    appointmentForm: review.appointmentForm,
    effectiveAt: review.effectiveAt.toISOString(),
    expiresAt: review.expiresAt,
    acceptedAt: review.acceptedAt,
    reviewHash: review.reviewHash,
  };
}

export function appointmentCertificateBasisHash(
  value: AppointmentCertificateBasis,
) {
  return sha(JSON.stringify(value));
}

async function authorize(client: Client, actorUserId: string) {
  const actor = await client.user.findUnique({
    where: { id: actorUserId },
    select: { isAdmin: true, email: true },
  });
  // This certificate carries Jamal's signature, not a generic admin signature.
  if (!actor?.isAdmin ||
      actor.email.trim().toLowerCase() !== "connect@axpt.io") {
    throw new Error("[ARP_CERTIFICATE_ISSUER_REQUIRED]");
  }
}

export async function loadAppointmentCertificateIssuanceBasis(params: {
  client: Client;
  appointmentId: string;
  actorUserId: string;
}) {
  await authorize(params.client, params.actorUserId.trim());
  const row: { participant: { userId: string | null } } | null =
    await params.client.representativeProgramAppointment.findUnique({
      where: { id: params.appointmentId.trim() },
      select: { participant: { select: { userId: true } } },
    });
  if (!row?.participant.userId) {
    throw new Error("[ARP_CERTIFICATE_NOT_FOUND]");
  }
  const review = await loadRepresentativeAppointmentReview({
    client: params.client,
    appointmentId: params.appointmentId,
    userId: row.participant.userId,
  });
  if (!review) throw new Error("[ARP_CERTIFICATE_NOT_FOUND]");
  const configuration = basis(review);
  const authoritySnapshot = await loadCertificateAuthorities({
    client: params.client, appointmentId: review.appointmentId, userId: row.participant.userId,
  });
  if (!authoritySnapshot.length) throw new Error("[ARP_CERTIFICATE_AUTHORITY_REQUIRED]");
  configuration.authorities = certificateAuthoritiesSchema.parse(authoritySnapshot);
  return {
    configuration,
    basisHash: appointmentCertificateBasisHash(configuration),
  };
}

type StoredEvidence = {
  id: string;
  uri: string | null;
  contentHash: string | null;
  metadata: unknown;
  recordedAt: Date;
  recordedByUserId: string;
};

async function existing(client: Client, configuration: AppointmentCertificateBasis) {
  const rows: StoredEvidence[] = await client.instrumentEvidence.findMany({
    where: {
      instrumentId: configuration.instrumentId,
      subjectId: configuration.appointmentId,
      evidenceType: "DOCUMENT",
      subjectType: "INSTRUMENT",
      title: TITLE,
    },
    take: 2,
  });
  if (rows.length > 1) throw new Error("[ARP_CERTIFICATE_EVIDENCE_CONFLICT]");
  const item = rows[0];
  if (!item) return null;
  const fields = item.metadata && typeof item.metadata === "object" &&
    !Array.isArray(item.metadata)
    ? item.metadata as Record<string, unknown> : {};
  const legacy = fields.certificateSchemaVersion === 1;
  const { authorities: _authorities, ...appointmentBasis } = configuration;
  const compared = legacy ? appointmentBasis : configuration;
  if (
    (!legacy && fields.certificateSchemaVersion !== 2) ||
    fields.basisHash !== appointmentCertificateBasisHash(compared) ||
    fields.issuedAt !== item.recordedAt.toISOString() ||
    fields.issuedByUserId !== item.recordedByUserId ||
    fields.signatoryName !== APPOINTMENT_CERTIFICATE_SIGNATORY.name ||
    !item.uri || !/^[a-f0-9]{64}$/.test(item.contentHash ?? "")
  ) throw new Error("[ARP_CERTIFICATE_EVIDENCE_CONFLICT]");
  return {
    evidenceId: item.id,
    issuedAt: item.recordedAt,
    contentHash: item.contentHash!,
    issued: false,
    certificateSchemaVersion: legacy ? 1 : 2,
  };
}

export async function issueRepresentativeAppointmentCredential(params: {
  client: Runner;
  appointmentId: string;
  actorUserId: string;
  expectedBasisHash: string;
  confirmIssue: boolean;
  signatureHash: string;
  sealHash: string;
  render: (
    configuration: AppointmentCertificateBasis,
    issuedAt: Date,
  ) => Promise<Uint8Array>;
  store: (input: {
    key: string;
    bytes: Uint8Array;
    sha256: string;
  }) => Promise<{ uri: string; access: "private" }>;
}) {
  if (params.confirmIssue !== true) {
    throw new Error("[ARP_CERTIFICATE_CONFIRMATION_REQUIRED]");
  }
  if (
    params.signatureHash !== "80169c0c6a46fc165b2999220e9a4cee38e1193d22788deda49c2dfcfe0fbee2" ||
    params.sealHash !== "b5387470d30435e040aaae3d59aca784c409dd58a775a9e8c0bf9b1673680bd3"
  ) throw new Error("[ARP_CERTIFICATE_ASSET_CONFLICT]");

  const input = {
    client: params.client,
    appointmentId: params.appointmentId.trim(),
    actorUserId: params.actorUserId.trim(),
  };
  const prepared = await loadAppointmentCertificateIssuanceBasis(input);
  if (prepared.basisHash !== params.expectedBasisHash) {
    throw new Error("[ARP_CERTIFICATE_REVIEW_CHANGED]");
  }
  const replay = await existing(params.client, prepared.configuration);
  if (replay) {
    if (replay.certificateSchemaVersion !== 2) throw new Error("[ARP_CERTIFICATE_LEGACY_ISSUANCE_REQUIRES_SEPARATE_REVIEW]");
    return replay;
  }

  const issuedAt = new Date();
  const bytes = await params.render(prepared.configuration, issuedAt);
  if (Buffer.from(bytes.subarray(0, 5)).toString("ascii") !== "%PDF-") {
    throw new Error("[ARP_CERTIFICATE_PDF_REQUIRED]");
  }
  const contentHash = sha(bytes);
  const stored = await params.store({
    key: `arp/appointment-certificates/${prepared.configuration.appointmentId}/${contentHash}.pdf`,
    bytes,
    sha256: contentHash,
  });
  const uri = new URL(stored.uri);
  if (
    stored.access !== "private" || uri.protocol !== "https:" ||
    !uri.hostname.endsWith(".private.blob.vercel-storage.com") ||
    uri.username || uri.password || uri.port || uri.search || uri.hash
  ) throw new Error("[ARP_CERTIFICATE_PRIVATE_STORAGE_REQUIRED]");

  return params.client.$transaction(async (tx: Client) => {
    // All issuance writers acquire this lock before checking or appending evidence.
    await tx.$queryRaw`
      SELECT pg_advisory_xact_lock(
        hashtextextended(${`arp-certificate:${input.appointmentId}`}, 0)
      )::text
    `;
    const current = await loadAppointmentCertificateIssuanceBasis({
      ...input, client: tx,
    });
    if (current.basisHash !== prepared.basisHash) {
      throw new Error("[ARP_CERTIFICATE_REVIEW_CHANGED]");
    }
    const duplicate = await existing(tx, current.configuration);
    if (duplicate) {
      if (duplicate.certificateSchemaVersion !== 2) throw new Error("[ARP_CERTIFICATE_LEGACY_ISSUANCE_REQUIRES_SEPARATE_REVIEW]");
      return duplicate;
    }

    const result = await recordInstrumentEvidenceWithClient({
      client: tx,
      instrumentReference: current.configuration.reference,
      evidenceType: "DOCUMENT",
      subjectType: "INSTRUMENT",
      subjectId: input.appointmentId,
      title: TITLE,
      uri: stored.uri,
      contentHash,
      recordedByUserId: input.actorUserId,
      recordedAt: issuedAt,
      metadata: {
        certificateSchemaVersion: 2,
        basisHash: current.basisHash,
        configuration: current.configuration,
        issuedAt: issuedAt.toISOString(),
        issuedByUserId: input.actorUserId,
        signatoryName: APPOINTMENT_CERTIFICATE_SIGNATORY.name,
        signatoryTitle: APPOINTMENT_CERTIFICATE_SIGNATORY.title,
        signatureHash: params.signatureHash,
        sealHash: params.sealHash,
      },
    });
    return {
      evidenceId: result.evidence.id,
      issuedAt,
      contentHash,
      issued: true,
    };
  }, {
    isolationLevel: "Serializable",
    maxWait: 10000,
    timeout: 30000,
  });
}

export async function loadOwnedIssuedAppointmentCertificate(params: {
  client: Client;
  userId: string;
  appointmentId: string;
}) {
  const review = await loadRepresentativeAppointmentReview(params);
  if (!review) return null;

  let configuration: AppointmentCertificateBasis;
  try { configuration = basis(review); }
  catch (error) {
    if (error instanceof Error &&
        error.message === "[ARP_CERTIFICATE_STATE_CONFLICT]") return null;
    throw error;
  }

  configuration.authorities = await loadCertificateAuthorities({
    client: params.client, userId: params.userId, appointmentId: params.appointmentId,
  });
  // A stale authority-bearing credential is withheld without losing historical evidence.
  const snapshots = await params.client.instrumentEvidence.findMany({
    where: { instrumentId: configuration.instrumentId, subjectId: configuration.appointmentId,
      evidenceType: "DOCUMENT", subjectType: "INSTRUMENT", title: TITLE }, take: 2,
  });
  if (snapshots.length === 1) {
    const metadata = snapshots[0].metadata as { certificateSchemaVersion?: number; configuration?: AppointmentCertificateBasis } | null;
    if (metadata?.certificateSchemaVersion === 2 && metadata.configuration &&
        canonicalCertificateJson(metadata.configuration.authorities) !== canonicalCertificateJson(configuration.authorities)) return null;
  }
  const issuance = await existing(params.client, configuration);
  if (!issuance) return null;
  const evidence = await params.client.instrumentEvidence.findUnique({
    where: { id: issuance.evidenceId },
    select: { uri: true, contentHash: true },
  });
  if (!evidence?.uri || evidence.contentHash !== issuance.contentHash) {
    throw new Error("[ARP_CERTIFICATE_EVIDENCE_CONFLICT]");
  }

  return {
    uri: evidence.uri,
    contentHash: issuance.contentHash,
    reference: configuration.reference,
    issuedAt: issuance.issuedAt,
  };
}
