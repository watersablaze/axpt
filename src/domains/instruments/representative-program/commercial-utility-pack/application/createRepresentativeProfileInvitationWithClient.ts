import type { PrismaClient } from "@prisma/client";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { resolveRepresentativeProfileInvitationWithClient } from
  "./resolveRepresentativeProfileInvitationWithClient";

type Transaction = Pick<PrismaClient,
  "user" | "$queryRaw" | "representativeProgramParticipant" |
  "representativeProgramAppointment" | "instrumentAuthority" |
  "commercialUtilityPack" | "commercialUtilityPackModuleRelease" |
  "commercialUtilityPackResourceRelease" | "institutionalAccessRequest" |
  "institutionalAccessGrant" | "institutionalAccessEvent" |
  "representativeProfileIntroduction" | "domainEvent"
>;

const fields = z.object({
  resourceReleaseId: z.string().trim().min(1).max(191),
  recipientName: z.string().trim().min(1).max(120),
  recipientEmail: z.string().trim().toLowerCase().email().max(254),
  recipientOrganization: z.string().trim().min(1).max(180),
  purpose: z.string().trim().min(1).max(1000),
  idempotencyKey: z.string().uuid(),
}).strict();

export class ProfileInvitationError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "ProfileInvitationError";
  }
}

/**
 * userId comes from the authenticated principal.
 * adminRecipients comes from server configuration, never the browser.
 * This command commits records only; delivery follows separately.
 */
export async function createRepresentativeProfileInvitationWithClient(input: {
  client: PrismaClient;
  userId: string;
  fields: z.input<typeof fields>;
  adminRecipients: string[];
}) {
  const actorUserId = input.userId.trim();
  const parsed = fields.safeParse(input.fields);
  if (!actorUserId || actorUserId.length > 191 || !parsed.success) {
    throw new ProfileInvitationError("INVALID_INVITATION");
  }
  const data = parsed.data;
  const adminRecipients = [...new Set(
    input.adminRecipients.map(value => value.trim().toLowerCase())
  )];
  if (!adminRecipients.length || adminRecipients.length > 10 ||
      adminRecipients.some(value => !z.string().email().safeParse(value).success)) {
    throw new ProfileInvitationError("ADMIN_NOTIFICATION_NOT_CONFIGURED");
  }

  const inputHash = createHash("sha256").update(JSON.stringify({
    actorUserId,
    resourceReleaseId: data.resourceReleaseId,
    recipientName: data.recipientName,
    recipientEmail: data.recipientEmail,
    recipientOrganization: data.recipientOrganization,
    purpose: data.purpose,
  })).digest("hex");

  // Never hold a database transaction open for password hashing.
  const passwordHash = await bcrypt.hash(randomBytes(48).toString("hex"), 12);

  return input.client.$transaction(async (tx: Transaction) => {
    // Serialize submissions from this representative. Database uniqueness
    // remains the final safeguard if a concurrent serializable attempt loses.
    await tx.$queryRaw`
      SELECT pg_advisory_xact_lock(
        hashtextextended(${"ARP_PROFILE_INVITATION:" + actorUserId}, 0)
      ) IS NULL AS locked
    `;

    const previous = await tx.representativeProfileIntroduction.findUnique({
      where: {
        actorUserId_idempotencyKey: {
          actorUserId, idempotencyKey: data.idempotencyKey,
        },
      },
    });
    if (previous) {
      if (previous.inputHash !== inputHash) {
        throw new ProfileInvitationError("IDEMPOTENCY_CONFLICT");
      }
      return { introduction: previous, replay: true };
    }

    const now = new Date();
    const count = await tx.representativeProfileIntroduction.count({
      where: {
        actorUserId,
        createdAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) },
      },
    });
    if (count >= 20) {
      throw new ProfileInvitationError("INVITATION_RATE_LIMIT");
    }

    const appointments = await tx.representativeProgramAppointment.findMany({
      where: {
        participant: { userId: actorUserId },
        instrument: { status: "ACTIVE" },
        effectiveAt: { lte: now },
        endedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: {
        id: true, participantId: true, instrumentId: true,
      },
      take: 2,
    });
    if (appointments.length !== 1) {
      throw new ProfileInvitationError("APPOINTMENT_UNAVAILABLE");
    }
    const appointment = appointments[0];

    // Hold lifecycle and existing authority/resource records through commit.
    await tx.$queryRaw`
      SELECT id FROM "RepresentativeProgramParticipant"
      WHERE id = ${appointment.participantId} FOR SHARE
    `;
    await tx.$queryRaw`
      SELECT id FROM "RepresentativeProgramAppointment"
      WHERE id = ${appointment.id} FOR SHARE
    `;
    await tx.$queryRaw`
      SELECT id FROM "InstitutionalInstrument"
      WHERE id = ${appointment.instrumentId} FOR SHARE
    `;
    await tx.$queryRaw`
      SELECT id FROM "InstrumentAuthority"
      WHERE "instrumentId" = ${appointment.instrumentId}
      ORDER BY id FOR SHARE
    `;
    await tx.$queryRaw`
      SELECT id FROM "CommercialUtilityPackResourceRelease"
      WHERE id = ${data.resourceReleaseId} FOR SHARE
    `;
    await tx.$queryRaw`
      SELECT id FROM "CommercialUtilityPack"
      WHERE id IN (
        SELECT "packageId" FROM "CommercialUtilityPackResourceRelease"
        WHERE id = ${data.resourceReleaseId}
      ) FOR SHARE
    `;
    await tx.$queryRaw`
      SELECT id FROM "CommercialUtilityPackModuleRelease"
      WHERE "packageId" IN (
        SELECT "packageId" FROM "CommercialUtilityPackResourceRelease"
        WHERE id = ${data.resourceReleaseId}
      ) ORDER BY id FOR SHARE
    `;

    // No asserted territory, counterparty identifier, or approval reference
    // is accepted from the browser. Scoped cases need a verified context
    // consumer; they remain unavailable through this first direct policy.
    const eligibility = await resolveRepresentativeProfileInvitationWithClient({
      client: tx,
      userId: actorUserId,
      appointmentId: appointment.id,
      resourceReleaseId: data.resourceReleaseId,
      at: new Date(),
    });
    if (!eligibility.allowed) {
      throw new ProfileInvitationError("INVITATION_NOT_AUTHORIZED");
    }

    const authorities = await tx.instrumentAuthority.findMany({
      where: {
        instrumentId: appointment.instrumentId,
        authorityKey: { in: ["ARP.INTRODUCTION", "ARP.COMMUNICATION"] },
        revokedAt: null,
      },
      orderBy: { id: "asc" },
      select: {
        id: true, authorityKey: true, authorityClass: true,
        holderPartyId: true, action: true, conditions: true,
        effectiveAt: true, expiresAt: true,
      },
    });

    await tx.$queryRaw`
      SELECT pg_advisory_xact_lock(
        hashtextextended(${data.recipientEmail}, 0)
      ) IS NULL AS locked
    `;
    const matches: Array<{ id: string; email: string }> =
      await tx.user.findMany({
        where: { email: { equals: data.recipientEmail, mode: "insensitive" } },
        select: { id: true, email: true },
      });
    if (matches.length > 1 ||
        (matches.length === 1 && matches[0].email !== data.recipientEmail)) {
      throw new ProfileInvitationError("RECIPIENT_RECONCILIATION_REQUIRED");
    }

    const recipient = await tx.user.upsert({
      where: { email: data.recipientEmail },
      update: {},
      create: {
        username: "institutional-visitor-" + randomUUID(),
        email: data.recipientEmail,
        passwordHash,
        displayName: data.recipientName,
        viewedDocs: [],
        isAdmin: false,
      },
      select: { id: true },
    });

    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    const request = await tx.institutionalAccessRequest.create({
      data: {
        requesterName: data.recipientName,
        requesterEmail: data.recipientEmail,
        institutionalAffiliation: data.recipientOrganization,
        requesterCapacity: "INVITED_PROFILE_RECIPIENT",
        purpose: data.purpose,
        scope: "PROFILE_VIEW",
        resourceReference: eligibility.resourceReference,
        resourceVersion: eligibility.resourceVersion,
        status: "APPROVED",
        decisionPolicy: eligibility.policy,
        decisionReason: "Named-recipient invitation within recorded representative authority.",
        decidedByUserId: actorUserId,
        decidedAt: issuedAt,
        events: {
          create: [
            {
              type: "REQUESTED",
              actorUserId,
              metadata: { origin: "REPRESENTATIVE_INVITATION", policy: eligibility.policy },
            },
            { type: "APPROVED", actorUserId },
          ],
        },
      },
      select: { id: true },
    });

    const grant = await tx.institutionalAccessGrant.create({
      data: {
        requestId: request.id,
        recipientUserId: recipient.id,
        recipientEmail: data.recipientEmail,
        scope: "PROFILE_VIEW",
        resourceReference: eligibility.resourceReference,
        resourceVersion: eligibility.resourceVersion,
        issuedByUserId: actorUserId,
        issuedAt,
        expiresAt,
      },
      select: { id: true },
    });

    const introduction = await tx.representativeProfileIntroduction.create({
      data: {
        actorUserId,
        participantId: appointment.participantId,
        appointmentId: appointment.id,
        resourceReleaseId: data.resourceReleaseId,
        grantId: grant.id,
        recipientUserId: recipient.id,
        recipientName: data.recipientName,
        recipientEmail: data.recipientEmail,
        recipientOrganization: data.recipientOrganization,
        purpose: data.purpose,
        resourceReference: eligibility.resourceReference,
        resourceVersion: eligibility.resourceVersion,
        policy: eligibility.policy,
        authoritySnapshot: JSON.parse(JSON.stringify({
          eligibility, authorities,
        })),
        idempotencyKey: data.idempotencyKey,
        inputHash,
        adminRecipients,
      },
    });

    await tx.institutionalAccessEvent.create({
      data: {
        requestId: request.id, grantId: grant.id,
        type: "GRANTED", actorUserId,
        metadata: {
          policy: eligibility.policy,
          introductionId: introduction.id,
          recipientProvisioned: matches.length === 0,
        },
      },
    });

    await tx.domainEvent.create({
      data: {
        streamType: "RepresentativeProfileIntroduction",
        streamId: introduction.id,
        eventType: "REPRESENTATIVE_PROFILE_INVITATION_CREATED",
        payload: {
          actorUserId, participantId: appointment.participantId,
          appointmentId: appointment.id, grantId: grant.id,
          resourceReference: eligibility.resourceReference,
          resourceVersion: eligibility.resourceVersion,
          recipientUserId: recipient.id,
        },
      },
    });

    return { introduction, replay: false };
  }, {
    isolationLevel: "Serializable",
    maxWait: 10000,
    timeout: 30000,
  });
}
