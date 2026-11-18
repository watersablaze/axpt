import type { PrismaClient } from "@prisma/client";
import { FRENCH_WARD_COMMERCIAL_INTAKE } from
  "../institutions/french-ward/commercial";
import { renderCommercialIntakeAccessNotice } from
  "./renderCommercialIntakeAccessNotice";

type MailInput = {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey: string;
};

type MailResult = {
  data?: { id?: string } | null;
  error?: unknown;
};

/**
 * An explicit operator dispatch, independent of approval.
 * A durable claim is committed before the provider call. A repeated key
 * never causes another provider call. Uncertain outcomes require reconciliation.
 */
export async function sendCommercialIntakeAccessNoticeWithClient(input: {
  client: PrismaClient;
  actorUserId: string;
  requestId: string;
  deliveryKey: string;
  from: string;
  send: (mail: MailInput) => Promise<MailResult>;
  now?: Date;
}) {
  const { client, actorUserId, requestId, deliveryKey, from, send } = input;
  const now = input.now ?? new Date();
  if (
    !actorUserId.trim() ||
    !requestId.trim() ||
    !/^[a-zA-Z0-9_-]{16,128}$/.test(deliveryKey) ||
    !from.trim() ||
    !Number.isFinite(now.getTime())
  ) {
    throw new Error("LOI_NOTICE_INPUT_INVALID");
  }

  const resource = FRENCH_WARD_COMMERCIAL_INTAKE;
  const request = await client.institutionalAccessRequest.findUnique({
    where: { id: requestId },
    include: {
      grant: { include: { recipient: { select: { id: true, email: true } } } },
    },
  });
  const grant = request?.grant;
  const email = request?.requesterEmail.trim().toLowerCase();
  const valid =
    Boolean(request && grant && email) &&
    request!.status === "APPROVED" &&
    request!.scope === "LOI_INTAKE_ACCESS" &&
    request!.resourceReference === resource.reference &&
    request!.resourceVersion === resource.version &&
    grant!.requestId === request!.id &&
    grant!.scope === "LOI_INTAKE_ACCESS" &&
    grant!.resourceReference === resource.reference &&
    grant!.resourceVersion === resource.version &&
    !grant!.revokedAt &&
    grant!.issuedAt <= now &&
    grant!.expiresAt > now &&
    grant!.recipientEmail === email &&
    grant!.recipient.email === email &&
    grant!.recipientUserId === grant!.recipient.id;

  if (!valid || !grant || !request || !email) {
    throw new Error("LOI_NOTICE_GRANT_UNAVAILABLE");
  }

  let claim;
  try {
    claim = await client.commercialIntakeAccessNoticeDelivery.create({
      data: {
        deliveryKey,
        requestId,
        grantId: grant.id,
        actorUserId,
        recipientEmail: email,
        status: "SENDING",
      },
    });
  } catch (error) {
    const existing = await client.commercialIntakeAccessNoticeDelivery.findUnique({
      where: { deliveryKey },
    });
    if (existing) {
      if (
        existing.requestId !== requestId ||
        existing.grantId !== grant.id ||
        existing.recipientEmail !== email
      ) throw new Error("LOI_NOTICE_KEY_CONFLICT");
      return {
        status: existing.status,
        messageId: existing.providerMessageId,
        alreadyAttempted: true,
      };
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      const unresolved = await client.commercialIntakeAccessNoticeDelivery.findFirst({
        where: {
          grantId: grant.id,
          status: { in: ["SENDING", "DELIVERY_UNKNOWN"] },
        },
        select: { id: true },
      });
      if (unresolved) throw new Error("LOI_NOTICE_UNRESOLVED_ATTEMPT");
    }
    throw error;
  }

  // Authorization must still hold after claiming, before provider dispatch.
  const dispatchNow = input.now ?? new Date();
  const liveGrant = await client.institutionalAccessGrant.findFirst({
    where: {
      id: grant.id,
      requestId: request.id,
      recipientUserId: grant.recipientUserId,
      recipientEmail: email,
      scope: "LOI_INTAKE_ACCESS",
      resourceReference: resource.reference,
      resourceVersion: resource.version,
      issuedAt: { lte: dispatchNow },
      expiresAt: { gt: dispatchNow },
      revokedAt: null,
      recipient: { id: grant.recipientUserId, email },
      request: {
        status: "APPROVED",
        requesterEmail: email,
        scope: "LOI_INTAKE_ACCESS",
        resourceReference: resource.reference,
        resourceVersion: resource.version,
      },
    },
    select: { id: true },
  });

  if (!liveGrant) {
    await client.$transaction(async (tx: Pick<
    PrismaClient,
    "commercialIntakeAccessNoticeDelivery" | "domainEvent" | "emailLog"
  >) => {
      await tx.commercialIntakeAccessNoticeDelivery.update({
        where: { id: claim.id },
        data: { status: "BLOCKED", errorCode: "GRANT_NO_LONGER_VALID" },
      });
      await tx.domainEvent.create({
        data: {
          streamType: "CommercialIntakeAccessNoticeDelivery",
          streamId: claim.id,
          eventType: "LOI_ACCESS_NOTICE_DISPATCH_BLOCKED",
          payload: {
            deliveryKey, requestId, grantId: grant.id,
            actorUserId, reason: "GRANT_NO_LONGER_VALID",
          },
        },
      });
    });
    return { status: "BLOCKED", messageId: null, alreadyAttempted: false };
  }

  const { subject, text, html } = renderCommercialIntakeAccessNotice({
    recipientName: request.requesterName,
  });
  let status = "DELIVERY_UNKNOWN";
  let messageId: string | null = null;
  let errorCode: string | null = "PROVIDER_OUTCOME_UNKNOWN";
  try {
    const response = await send({
      from,
      to: email,
      replyTo: "french-ward@axpt.io",
      subject,
      text,
      html,
      idempotencyKey: deliveryKey,
    });
    if (response.error) {
      status = "FAILED";
      errorCode = "PROVIDER_REJECTED";
    } else if (response.data?.id) {
      status = "ACCEPTED";
      messageId = response.data.id;
      errorCode = null;
    }
  } catch {
    // An exception does not establish whether the provider accepted the email.
  }

  await client.$transaction(async (tx: Pick<
    PrismaClient,
    "commercialIntakeAccessNoticeDelivery" | "domainEvent" | "emailLog"
  >) => {
    await tx.commercialIntakeAccessNoticeDelivery.update({
      where: { id: claim.id },
      data: { status, providerMessageId: messageId, errorCode },
    });
    await tx.emailLog.create({
      data: {
        type: "FW_LOI_INTAKE_ACCESS_NOTICE",
        from,
        to: email,
        subject,
        status,
        messageId,
        rawPayload: { deliveryKey, requestId, grantId: grant.id, errorCode },
      },
    });
    await tx.domainEvent.create({
      data: {
        streamType: "CommercialIntakeAccessNoticeDelivery",
        streamId: claim.id,
        eventType: "LOI_ACCESS_NOTICE_DISPATCH_RECORDED",
        payload: {
          deliveryKey, requestId, grantId: grant.id,
          actorUserId, status, messageId, errorCode,
        },
      },
    });
  });

  return { status, messageId, alreadyAttempted: false };
}
