import { buyerPublicationScope } from "../supporting-documents/buyerSupportingDocumentPolicy";
import type { PrismaClient } from "@prisma/client";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { resolveRepresentativeBuyerDossierSelectionWithClient } from "./resolveRepresentativeBuyerDossierSelectionWithClient";

type Transaction = Parameters<typeof resolveRepresentativeBuyerDossierSelectionWithClient>[0]["client"] &
  Pick<PrismaClient, "$queryRaw" | "user" | "representativeBuyerDossier" |
  "institutionalAccessRequest" | "institutionalAccessGrant" | "institutionalAccessEvent" | "domainEvent">;
const fields = z.object({
  resourceReleaseIds: z.array(z.string().trim().min(1).max(191)).min(1).max(5)
    .refine(ids => new Set(ids).size === ids.length),
  reviewHash: z.string().regex(/^[a-f0-9]{64}$/),
  recipientName: z.string().trim().min(1).max(120),
  recipientEmail: z.string().trim().toLowerCase().email().max(254),
  recipientOrganization: z.string().trim().min(1).max(180),
  purpose: z.string().trim().min(1).max(1000),
  idempotencyKey: z.string().uuid(),
}).strict();
export class BuyerDossierError extends Error {
  constructor(public readonly code: string) { super(code); this.name = "BuyerDossierError"; }
}

/** Internal command. The route supplies the principal and server-owned Admin recipients.
 * A reviewed selection is re-evaluated under governance locks. All item grants,
 * recipient provisioning, invitation and audit records commit or roll back together.
 * No email/provider calls occur here. Existing Profile introductions are untouched.
 */
export async function createRepresentativeBuyerDossierWithClient(input: {
  client: PrismaClient;
  userId: string;
  fields: z.input<typeof fields>;
  adminRecipients: string[];
}) {
  const actorUserId = input.userId.trim();
  const parsed = fields.safeParse(input.fields);
  if (!actorUserId || actorUserId.length > 191 || !parsed.success) throw new BuyerDossierError("INVALID_DOSSIER");
  const data = parsed.data;
  const ids = [...data.resourceReleaseIds].sort();
  const adminRecipients = [...new Set(input.adminRecipients.map(value => value.trim().toLowerCase()))];
  if (!adminRecipients.length || adminRecipients.length > 10 ||
      adminRecipients.some(value => !z.string().email().safeParse(value).success)) {
    throw new BuyerDossierError("ADMIN_NOTIFICATION_NOT_CONFIGURED");
  }
  const inputHash = createHash("sha256").update(JSON.stringify({
    actorUserId, resourceReleaseIds: ids, reviewHash: data.reviewHash,
    recipientName: data.recipientName, recipientEmail: data.recipientEmail,
    recipientOrganization: data.recipientOrganization, purpose: data.purpose,
  })).digest("hex");
  const passwordHash = await bcrypt.hash(randomBytes(48).toString("hex"), 12);
  return input.client.$transaction(async (tx: Transaction) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${"ARP_BUYER_DOSSIER:" + actorUserId}, 0)) IS NULL AS locked`;
    const previous = await tx.representativeBuyerDossier.findUnique({
      where: { actorUserId_idempotencyKey: { actorUserId, idempotencyKey: data.idempotencyKey } },
      include: { items: { orderBy: { resourceReleaseId: "asc" } } },
    });
    if (previous) {
      if (previous.inputHash !== inputHash) throw new BuyerDossierError("IDEMPOTENCY_CONFLICT");
      return { dossier: previous, replay: true };
    }
    const now = new Date();
    if (await tx.representativeBuyerDossier.count({ where: { actorUserId,
      createdAt: { gte: new Date(now.getTime() - 3600000) } } }) >= 20) {
      throw new BuyerDossierError("DOSSIER_RATE_LIMIT");
    }
    const appointments: Array<{ id: string; participantId: string; instrumentId: string }> =
      await tx.representativeProgramAppointment.findMany({
        where: { participant: { userId: actorUserId }, instrument: { status: "ACTIVE" },
          effectiveAt: { lte: now }, endedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        select: { id: true, participantId: true, instrumentId: true }, take: 2,
      });
    if (appointments.length !== 1) throw new BuyerDossierError("APPOINTMENT_UNAVAILABLE");
    const appointment = appointments[0];
    await tx.$queryRaw`SELECT id FROM "RepresentativeProgramParticipant" WHERE id = ${appointment.participantId} FOR SHARE`;
    await tx.$queryRaw`SELECT id FROM "RepresentativeProgramAppointment" WHERE id = ${appointment.id} FOR SHARE`;
    await tx.$queryRaw`SELECT id FROM "InstitutionalInstrument" WHERE id = ${appointment.instrumentId} FOR SHARE`;
    await tx.$queryRaw`SELECT id FROM "InstrumentAuthority" WHERE "instrumentId" = ${appointment.instrumentId} ORDER BY id FOR SHARE`;
    await tx.$queryRaw`SELECT id FROM "CommercialUtilityPackResourceRelease" WHERE id = ANY(${ids}::text[]) ORDER BY id FOR SHARE`;
    await tx.$queryRaw`SELECT id FROM "CommercialUtilityPack" WHERE id IN (
      SELECT "packageId" FROM "CommercialUtilityPackResourceRelease" WHERE id = ANY(${ids}::text[])
    ) ORDER BY id FOR SHARE`;
    await tx.$queryRaw`SELECT id FROM "CommercialUtilityPackModuleRelease" WHERE "packageId" IN (
      SELECT "packageId" FROM "CommercialUtilityPackResourceRelease" WHERE id = ANY(${ids}::text[])
    ) ORDER BY id FOR SHARE`;
    const selection = await resolveRepresentativeBuyerDossierSelectionWithClient({
      client: tx, userId: actorUserId, appointmentId: appointment.id, resourceReleaseIds: ids, at: new Date(),
    });
    if (!selection.allowed) throw new BuyerDossierError("DOSSIER_NOT_AUTHORIZED");
    if (selection.reviewHash !== data.reviewHash) throw new BuyerDossierError("DOSSIER_REVIEW_CHANGED");
    const authorities = await tx.instrumentAuthority.findMany({ where: {
      instrumentId: appointment.instrumentId, authorityKey: { in: ["ARP.INTRODUCTION", "ARP.COMMUNICATION"] }, revokedAt: null,
    }, orderBy: { id: "asc" }, select: { id: true, authorityKey: true, authorityClass: true,
      holderPartyId: true, action: true, conditions: true, effectiveAt: true, expiresAt: true } });
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${data.recipientEmail}, 0)) IS NULL AS locked`;
    const matches: Array<{ id: string; email: string }> = await tx.user.findMany({
      where: { email: { equals: data.recipientEmail, mode: "insensitive" } }, select: { id: true, email: true },
    });
    if (matches.length > 1 || (matches.length === 1 && matches[0].email !== data.recipientEmail)) {
      throw new BuyerDossierError("RECIPIENT_RECONCILIATION_REQUIRED");
    }
    const recipient = await tx.user.upsert({ where: { email: data.recipientEmail }, update: {},
      create: { username: "institutional-visitor-" + randomUUID(), email: data.recipientEmail,
        passwordHash, displayName: data.recipientName, viewedDocs: [], isAdmin: false }, select: { id: true } });
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + 7 * 86400000);
    const dossierId = randomUUID();
    const items: Array<{
      resourceReleaseId: string; grantId: string; kind: string; resourceReference: string;
      resourceVersion: number; label: string; recipientContentHash: string; canDownload: boolean;
    }> = [];
    for (const publication of selection.publications) {
      const scope = buyerPublicationScope(publication.kind);
      if (!scope) throw new BuyerDossierError("DOSSIER_NOT_AUTHORIZED");
      const request = await tx.institutionalAccessRequest.create({ data: {
        requesterName: data.recipientName, requesterEmail: data.recipientEmail,
        institutionalAffiliation: data.recipientOrganization, requesterCapacity: "INVITED_BUYER_DOSSIER_RECIPIENT",
        purpose: data.purpose, scope, resourceReference: publication.reference,
        resourceVersion: publication.version, status: "APPROVED", decisionPolicy: selection.policy,
        decisionReason: "Selected publication within recorded representative authority.",
        decidedByUserId: actorUserId, decidedAt: issuedAt,
        events: { create: [{ type: "REQUESTED", actorUserId,
          metadata: { origin: "REPRESENTATIVE_BUYER_DOSSIER", dossierId } }, { type: "APPROVED", actorUserId }] },
      }, select: { id: true } });
      const grant = await tx.institutionalAccessGrant.create({ data: {
        requestId: request.id, recipientUserId: recipient.id, recipientEmail: data.recipientEmail,
        scope, resourceReference: publication.reference, resourceVersion: publication.version,
        issuedByUserId: actorUserId, issuedAt, expiresAt,
      }, select: { id: true } });
      items.push({ resourceReleaseId: publication.resourceReleaseId, grantId: grant.id,
        kind: publication.kind, resourceReference: publication.reference, resourceVersion: publication.version,
        label: publication.label, recipientContentHash: publication.recipientContentHash, canDownload: false });
      await tx.institutionalAccessEvent.create({ data: { requestId: request.id, grantId: grant.id,
        type: "GRANTED", actorUserId, metadata: { dossierId, policy: selection.policy,
          recipientProvisioned: matches.length === 0 } } });
    }
    const dossier = await tx.representativeBuyerDossier.create({ data: {
      id: dossierId, actorUserId, participantId: appointment.participantId, appointmentId: appointment.id,
      recipientUserId: recipient.id, recipientName: data.recipientName, recipientEmail: data.recipientEmail,
      recipientOrganization: data.recipientOrganization, purpose: data.purpose, policy: selection.policy,
      reviewHash: selection.reviewHash, inputHash, idempotencyKey: data.idempotencyKey,
      authoritySnapshot: JSON.parse(JSON.stringify({ selection, authorities })),
      expiresAt, adminRecipients, items: { create: items },
    }, include: { items: { orderBy: { resourceReleaseId: "asc" } } } });
    await tx.domainEvent.create({ data: { streamType: "RepresentativeBuyerDossier", streamId: dossier.id,
      eventType: "REPRESENTATIVE_BUYER_DOSSIER_CREATED", payload: {
        actorUserId, participantId: appointment.participantId, appointmentId: appointment.id,
        recipientUserId: recipient.id, reviewHash: selection.reviewHash,
        items: items.map(item => ({ grantId: item.grantId, reference: item.resourceReference, version: item.resourceVersion })),
      } } });
    return { dossier, replay: false };
  }, { isolationLevel: "Serializable", maxWait: 10000, timeout: 30000 });
}
