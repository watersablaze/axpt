import { z } from "zod";
import { loadRepresentativeAppointmentReview } from "./representativeAppointmentAcceptance";
import {
  APPOINTMENT_CERTIFICATE_SIGNATORY,
  appointmentCertificateBasisHash,
  type AppointmentCertificateBasis,
} from "./issueRepresentativeAppointmentCredential";

import {
  certificateAuthoritiesSchema, loadCertificateAuthorities,
  canonicalCertificateJson, certificateAuthorityTitle, certificateAuthorityConditions,
} from "./appointmentCertificateAuthorities";

type Client = Parameters<typeof loadRepresentativeAppointmentReview>[0]["client"] & Parameters<typeof loadCertificateAuthorities>[0]["client"];
const text = z.string().min(1);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const timestamp = z.string().datetime();

const configurationSchema = z.object({
  appointmentId: text,
  participantId: text,
  instrumentId: text,
  reference: text,
  version: z.number().int().positive(),
  displayName: text,
  appointmentClass: text,
  appointmentForm: text,
  effectiveAt: timestamp,
  expiresAt: timestamp.nullable(),
  acceptedAt: timestamp,
  reviewHash: hash,
}).strict();

const legacyMetadataSchema = z.object({
  certificateSchemaVersion: z.literal(1),
  basisHash: hash,
  configuration: configurationSchema,
  issuedAt: timestamp,
  issuedByUserId: text,
  signatoryName: z.literal(APPOINTMENT_CERTIFICATE_SIGNATORY.name),
  signatoryTitle: z.literal(APPOINTMENT_CERTIFICATE_SIGNATORY.title),
  signatureHash: z.literal("80169c0c6a46fc165b2999220e9a4cee38e1193d22788deda49c2dfcfe0fbee2"),
  sealHash: z.literal("b5387470d30435e040aaae3d59aca784c409dd58a775a9e8c0bf9b1673680bd3"),
}).strict();

const authorityMetadataSchema = legacyMetadataSchema.extend({
  certificateSchemaVersion: z.literal(2),
  configuration: configurationSchema.extend({ authorities: certificateAuthoritiesSchema }).strict(),
}).strict();
const metadataSchema = z.discriminatedUnion("certificateSchemaVersion", [
  legacyMetadataSchema, authorityMetadataSchema,
]);

type Evidence = {
  instrumentId: string;
  subjectId: string | null;
  contentHash: string | null;
  recordedAt: Date;
  recordedByUserId: string;
  metadata: unknown;
};

export async function verifyRepresentativeAppointmentCertificate(params: {
  client: Client;
  certificateHash: string;
  at?: Date;
}) {
  if (!hash.safeParse(params.certificateHash).success) return null;
  const checkedAt = params.at ?? new Date();
  if (!Number.isFinite(checkedAt.getTime())) {
    throw new Error("[ARP_CERTIFICATE_VERIFICATION_TIME_INVALID]");
  }

  const rows: Evidence[] = await params.client.instrumentEvidence.findMany({
    where: {
      contentHash: params.certificateHash,
      evidenceType: "DOCUMENT",
      subjectType: "INSTRUMENT",
      title: "Issued representative appointment certificate",
    },
    take: 2,
  });
  if (!rows.length) return null;
  if (rows.length !== 1) {
    throw new Error("[ARP_CERTIFICATE_VERIFICATION_EVIDENCE_CONFLICT]");
  }

  const evidence = rows[0];
  const parsed = metadataSchema.safeParse(evidence.metadata);
  if (!parsed.success) {
    throw new Error("[ARP_CERTIFICATE_VERIFICATION_EVIDENCE_CONFLICT]");
  }
  const metadata = parsed.data;
  const configuration = metadata.configuration;

  if (
    evidence.contentHash !== params.certificateHash ||
    evidence.instrumentId !== configuration.instrumentId ||
    evidence.subjectId !== configuration.appointmentId ||
    !Number.isFinite(evidence.recordedAt.getTime()) ||
    metadata.issuedAt !== evidence.recordedAt.toISOString() ||
    metadata.issuedByUserId !== evidence.recordedByUserId ||
    metadata.basisHash !== appointmentCertificateBasisHash(configuration) ||
    new Date(configuration.acceptedAt).getTime() > evidence.recordedAt.getTime() ||
    new Date(configuration.effectiveAt).getTime() > evidence.recordedAt.getTime() ||
    evidence.recordedAt.getTime() > checkedAt.getTime()
  ) throw new Error("[ARP_CERTIFICATE_VERIFICATION_EVIDENCE_CONFLICT]");

  const publicRecord = {
    issuanceRecognized: true as const,
    institution: APPOINTMENT_CERTIFICATE_SIGNATORY.institution,
    displayName: configuration.displayName,
    reference: configuration.reference,
    version: configuration.version,
    designation: configuration.appointmentClass,
    issuedAt: metadata.issuedAt,
    checkedAt: checkedAt.toISOString(),
  };
  const unavailable = () => ({
    ...publicRecord,
    appointmentCurrentlyEligible: false,
    authoritySnapshotCurrent: false,
    authorities: [] as Array<{ title: string; action: string; conditions: string[]; currentlyDelegated: boolean }>,
    certificateSchemaVersion: metadata.certificateSchemaVersion,
  });

  const appointment: {
    participant: { userId: string | null };
  } | null = await params.client.representativeProgramAppointment.findUnique({
    where: { id: configuration.appointmentId },
    select: { participant: { select: { userId: true } } },
  });
  if (!appointment?.participant.userId) return unavailable();

  let review;
  try {
    review = await loadRepresentativeAppointmentReview({
      client: params.client,
      userId: appointment.participant.userId,
      appointmentId: configuration.appointmentId,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "[ARP_APPOINTMENT_ACCEPTANCE_EVIDENCE_CONFLICT]"
    ) return unavailable();
    throw error;
  }

  if (!review || !review.acceptedAt || !review.effectiveAt ||
      !Number.isFinite(review.effectiveAt.getTime())) return unavailable();

  const current: AppointmentCertificateBasis = {
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
  const expiry = review.expiresAt === null
    ? null : new Date(review.expiresAt).getTime();

  const appointmentCurrentlyEligible =
      appointmentCertificateBasisHash(current) === appointmentCertificateBasisHash(
        Object.fromEntries(Object.entries(configuration).filter(([key]) => key !== "authorities")) as AppointmentCertificateBasis
      ) &&
      review.status === "ACTIVE" &&
      review.standing === "ACTIVE" &&
      review.endedAt === null &&
      review.effectiveAt.getTime() <= checkedAt.getTime() &&
      (expiry === null || (Number.isFinite(expiry) && expiry > checkedAt.getTime()));
  const issuedAuthorities = "authorities" in configuration ? configuration.authorities : [];
  const currentAuthorities = appointmentCurrentlyEligible && metadata.certificateSchemaVersion === 2
    ? await loadCertificateAuthorities({ client: params.client,
      userId: appointment.participant.userId, appointmentId: configuration.appointmentId, at: checkedAt })
    : [];
  const authorities = issuedAuthorities.map(authority => ({
    title: certificateAuthorityTitle(authority.key), action: authority.action,
    conditions: certificateAuthorityConditions(authority),
    currentlyDelegated: appointmentCurrentlyEligible && currentAuthorities.some(current =>
      current.id === authority.id && canonicalCertificateJson(current) === canonicalCertificateJson(authority)),
  }));
  return {
    ...publicRecord, appointmentCurrentlyEligible,
    certificateSchemaVersion: metadata.certificateSchemaVersion,
    authoritySnapshotCurrent: metadata.certificateSchemaVersion === 2 &&
      appointmentCurrentlyEligible && authorities.every(authority => authority.currentlyDelegated) &&
      canonicalCertificateJson(issuedAuthorities) === canonicalCertificateJson(currentAuthorities),
    authorities,
  };
}
