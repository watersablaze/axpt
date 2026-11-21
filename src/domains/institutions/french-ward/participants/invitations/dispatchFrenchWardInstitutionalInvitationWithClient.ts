import "server-only";

import type { PrismaClient } from "@prisma/client";

type InvitationDispatchTransaction = Pick<
  PrismaClient,
  | "$queryRaw"
  | "frenchWardInstitutionalInvitation"
  | "frenchWardInstitutionalInvitationDelivery"
  | "user"
  | "domainEvent"
  | "emailLog"
>;


import {
  hashFrenchWardInstitutionalInvitationCredential,
} from "./institutionalInvitationCredential";

import {
  renderFrenchWardInstitutionalInvitationEmail,
} from "./renderFrenchWardInstitutionalInvitationEmail";

type ProviderResponse = {
  data?: { id?: string | null } | null;
  error?: unknown;
};

type OutboundEmail = {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey: string;
};

type DispatchInput = {
  client: PrismaClient;
  invitationId: string;
  actorUserId: string;
  deliveryKey: string;
  credential: string;
  from: string;
  now?: Date;
  send: (message: OutboundEmail) => Promise<ProviderResponse>;
};

/**
 * Dispatch is allowed only once for an issued invitation.
 *
 * The credential is held in process memory for this immediate
 * operation. It is never persisted or included in audit events.
 *
 * DISPATCHING is committed before the provider call.
 * Any interrupted attempt requires reconciliation, not replay.
 */
export async function
dispatchFrenchWardInstitutionalInvitationWithClient(
  input: DispatchInput,
) {
  const {
    client,
    invitationId,
    actorUserId,
    deliveryKey,
    credential,
    from,
    send,
  } = input;

  const now = input.now ?? new Date();

  if (
    !invitationId.trim() ||
    !actorUserId.trim() ||
    !from.trim() ||
    !/^[a-zA-Z0-9_-]{16,128}$/.test(deliveryKey) ||
    !/^[A-Za-z0-9_-]{43}$/.test(credential) ||
    !Number.isFinite(now.getTime())
  ) {
    throw new Error("FW_INVITATION_DISPATCH_INPUT_INVALID");
  }

  const credentialHash =
    hashFrenchWardInstitutionalInvitationCredential(
      credential,
    );

  /*
   * Read and validate the exact invitation and delivery claim.
   * This does not yet authorize provider dispatch.
   */
  const invitation =
    await client.frenchWardInstitutionalInvitation.findUnique({
      where: { id: invitationId },
    });

  const claim =
    await client.frenchWardInstitutionalInvitationDelivery.findUnique({
      where: { deliveryKey },
    });

  if (
    !invitation ||
    !claim ||
    claim.invitationId !== invitation.id ||
    claim.issuerUserId !== actorUserId ||
    invitation.issuedByUserId !== actorUserId ||
    invitation.recipientEmail !== claim.recipientEmail ||
    invitation.credentialHash !== credentialHash ||
    invitation.acceptedAt !== null ||
    invitation.revokedAt !== null ||
    invitation.expiresAt <= now
  ) {
    throw new Error("FW_INVITATION_DISPATCH_UNAVAILABLE");
  }

  /*
   * Render before claiming dispatch, so malformed inputs
   * cannot leave the record in an ambiguous dispatch state.
   */
  const accessUrl =
    `https://www.axpt.io/french-ward/institutional/access/${credential}`;

  const rendered =
    renderFrenchWardInstitutionalInvitationEmail({
      reference: invitation.reference,
      recipientDisplayName:
        invitation.recipientDisplayName,
      institutionalTitle:
        invitation.institutionalTitle,
      secondaryTitle:
        invitation.secondaryTitle,
      capacityClass:
        invitation.capacityClass,
      accessUrl,
      expiresAt:
        invitation.expiresAt,
    });

  /*
   * Exactly one caller can change SENDING to DISPATCHING.
   * The durable event and state transition share a transaction.
   */
  await client.$transaction(async (tx: InvitationDispatchTransaction) => {
    /*
     * Serialize dispatch authorization against acceptance and
     * revocation. All three commands lock the invitation first.
     *
     * The earlier read is for rendering only. It cannot authorize
     * dispatch because invitation state may have changed since.
     */
    await tx.$queryRaw`
      SELECT id
      FROM "FrenchWardInstitutionalInvitation"
      WHERE "id" = ${invitationId}
      FOR UPDATE
    `;

    const lockedInvitation =
      await tx.frenchWardInstitutionalInvitation.findUnique({
        where: { id: invitationId },
      });

    const lockedClaim =
      await tx.frenchWardInstitutionalInvitationDelivery.findUnique({
        where: { deliveryKey },
      });

    const actor =
      await tx.user.findUnique({
        where: { id: actorUserId },
        select: { id: true, isAdmin: true },
      });

    if (
      !actor?.isAdmin ||
      !lockedInvitation ||
      !lockedClaim ||
      lockedClaim.id !== claim.id ||
      lockedClaim.invitationId !== lockedInvitation.id ||
      lockedClaim.issuerUserId !== actorUserId ||
      lockedClaim.recipientEmail !== lockedInvitation.recipientEmail ||
      lockedInvitation.issuedByUserId !== actorUserId ||
      lockedInvitation.credentialHash !== credentialHash ||
      lockedInvitation.acceptedAt !== null ||
      lockedInvitation.revokedAt !== null ||
      lockedInvitation.expiresAt <= new Date() ||
      lockedClaim.status !== "SENDING"
    ) {
      throw new Error("FW_INVITATION_DISPATCH_UNAVAILABLE");
    }

    const result =
      await tx.frenchWardInstitutionalInvitationDelivery.updateMany({
        where: {
          id: claim.id,
          status: "SENDING",
        },
        data: {
          status: "DISPATCHING",
        },
      });

    if (result.count !== 1) {
      throw new Error("FW_INVITATION_DISPATCH_ALREADY_CLAIMED");
    }

    await tx.domainEvent.create({
      data: {
        streamType:
          "FrenchWardInstitutionalInvitationDelivery",
        streamId:
          claim.id,
        eventType:
          "FRENCH_WARD_INVITATION_DISPATCH_STARTED",
        payload: {
          invitationId,
          deliveryKey,
          actorUserId,
        },
        metadata: {
          actorUserId,
          source:
            "french-ward.institutional-invitation.dispatch",
        },
        occurredAt: now,
      },
    });
  });

  let status:
    | "PROVIDER_ACCEPTED"
    | "FAILED"
    | "DELIVERY_UNKNOWN" =
      "DELIVERY_UNKNOWN";

  let providerMessageId: string | null = null;
  let providerErrorCode: string | null =
    "PROVIDER_OUTCOME_UNKNOWN";

  try {
    const response = await send({
      from,
      to: invitation.recipientEmail,
      replyTo: "french-ward@axpt.io",
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
      idempotencyKey: deliveryKey,
    });

    if (response.error) {
      status = "FAILED";
      providerErrorCode = "PROVIDER_REJECTED";
    } else if (
      typeof response.data?.id === "string" &&
      response.data.id.trim()
    ) {
      status = "PROVIDER_ACCEPTED";
      providerMessageId = response.data.id;
      providerErrorCode = null;
    }
  } catch {
    /*
     * An exception does not prove the provider rejected
     * the email. Never automatically send it again.
     */
  }

  /*
   * Only non-secret provider evidence is persisted.
   * If this transaction fails, DISPATCHING remains durable,
   * requiring investigation rather than automatic replay.
   */
  await client.$transaction(async (tx: InvitationDispatchTransaction) => {
    const updated =
      await tx.frenchWardInstitutionalInvitationDelivery.updateMany({
        where: {
          id: claim.id,
          status: "DISPATCHING",
        },
        data: {
          status,
          providerMessageId,
          providerErrorCode,
          resolvedAt: new Date(),
        },
      });

    if (updated.count !== 1) {
      throw new Error("FW_INVITATION_DISPATCH_FINALIZATION_CONFLICT");
    }

    await tx.emailLog.create({
      data: {
        type: "FW_INSTITUTIONAL_INVITATION",
        from,
        to: invitation.recipientEmail,
        subject: rendered.subject,
        status,
        messageId: providerMessageId,
        rawPayload: {
          invitationId,
          deliveryKey,
          actorUserId,
          providerErrorCode,
        },
      },
    });

    await tx.domainEvent.create({
      data: {
        streamType:
          "FrenchWardInstitutionalInvitationDelivery",
        streamId:
          claim.id,
        eventType:
          "FRENCH_WARD_INVITATION_DISPATCH_RECORDED",
        payload: {
          invitationId,
          deliveryKey,
          actorUserId,
          status,
          providerMessageId,
          providerErrorCode,
        },
        metadata: {
          actorUserId,
          source:
            "french-ward.institutional-invitation.dispatch",
        },
        occurredAt:
          new Date(),
      },
    });
  });

  return {
    invitationId,
    deliveryKey,
    status,
    providerMessageId,
  } as const;
}
