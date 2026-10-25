import type { PrismaClient } from "@prisma/client";
import { projectFrenchWardInstitutionalProfile } from
  "../institutions/french-ward/projectFrenchWardInstitutionalProfile";

export const PROFILE_ACCESS_URL =
  "https://www.axpt.io/login?next=%2Ffrench-ward%2Fprofile";

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

export function renderProfileAccessNotice() {
  const subject = "French-Ward | Institutional Profile Access";
  const text = [
    "Your request to review the French-Ward Institutional Profile has been approved.",
    "",
    "Access the Profile:",
    PROFILE_ACCESS_URL,
    "",
    "Please sign in using the email address associated with your request.",
    "No further access request is required.",
    "",
    "Respectfully,",
    "French-Ward Administration",
    "French-Ward, Inc.",
  ].join("\n");

  const html = [
    '<div style="font-family:Arial,sans-serif;color:#243b44;',
    'font-size:14px;line-height:1.7;max-width:620px">',
    '<p>Your request to review the French-Ward Institutional ',
    'Profile has been approved.</p>',
    '<p><a href="', PROFILE_ACCESS_URL,
    '">Access the Institutional Profile</a></p>',
    '<p>Please sign in using the email address associated ',
    'with your request. No further access request is required.</p>',
    '<p>Respectfully,<br>French-Ward Administration<br>',
    'French-Ward, Inc.</p></div>',
  ].join("");

  return { subject, text, html };
}

/**
 * Operator-authorized dispatch only. The route must verify
 * INSTITUTIONAL_ACCESS_MANAGE before calling this service.
 *
 * deliveryKey identifies one explicitly confirmed send operation.
 * Replays do not send again. A deliberate resend requires a new key.
 */
export async function sendProfileAccessNoticeWithClient(input: {
  client: PrismaClient;
  actorUserId: string;
  requestId: string;
  deliveryKey: string;
  from: string;
  send: (mail: MailInput) => Promise<MailResult>;
  now?: Date;
}) {
  const {
    client, actorUserId, requestId, deliveryKey, from, send,
  } = input;
  const now = input.now ?? new Date();

  if (
    !actorUserId.trim() ||
    !requestId.trim() ||
    !/^[a-zA-Z0-9_-]{16,128}$/.test(deliveryKey) ||
    !from.trim() ||
    !Number.isFinite(now.getTime())
  ) {
    throw new Error("PROFILE_NOTICE_INPUT_INVALID");
  }

  const profile = projectFrenchWardInstitutionalProfile();
  const request = await client.institutionalAccessRequest.findUnique({
    where: { id: requestId },
    include: {
      grant: {
        include: { recipient: { select: { id: true, email: true } } },
      },
    },
  });

  const grant = request?.grant;
  const email = request?.requesterEmail.trim().toLowerCase();

  if (
    !request ||
    request.status !== "APPROVED" ||
    request.scope !== "PROFILE_VIEW" ||
    request.resourceReference !== profile.reference ||
    request.resourceVersion !== profile.version ||
    !grant ||
    grant.requestId !== request.id ||
    grant.scope !== "PROFILE_VIEW" ||
    grant.resourceReference !== profile.reference ||
    grant.resourceVersion !== profile.version ||
    grant.revokedAt ||
    grant.issuedAt > now ||
    grant.expiresAt <= now ||
    grant.recipientEmail !== email ||
    grant.recipient.email !== email ||
    grant.recipientUserId !== grant.recipient.id
  ) {
    throw new Error("PROFILE_NOTICE_GRANT_UNAVAILABLE");
  }

  // Durable claim precedes the external side effect.
  // An uncertain provider result must never trigger an automatic resend.
  let claim;
  try {
    claim = await client.profileAccessNoticeDelivery.create({
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
    const existing = await client.profileAccessNoticeDelivery.findUnique({
      where: { deliveryKey },
    });
    if (
      existing &&
      existing.requestId === requestId &&
      existing.grantId === grant.id &&
      existing.recipientEmail === email
    ) {
      return {
        status: existing.status,
        messageId: existing.messageId,
        alreadyAttempted: true,
      };
    }
    if (existing) throw new Error("PROFILE_NOTICE_KEY_CONFLICT");
    throw error;
  }

  const { subject, text, html } = renderProfileAccessNotice();

  let status = "DELIVERY_UNKNOWN";
  let messageId: string | null = null;
  let errorCode: string | null = "PROVIDER_OUTCOME_UNKNOWN";

  try {
    const response = await send({
      from,
      to: email!,
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
    // Unknown whether the provider accepted the request.
    // Do not repeat this delivery key.
  }

  await client.$transaction(async tx => {
    await tx.profileAccessNoticeDelivery.update({
      where: { id: claim.id },
      data: { status, messageId, error: errorCode },
    });

    await tx.emailLog.create({
      data: {
        type: "FW_PROFILE_ACCESS_NOTICE",
        from,
        to: email!,
        subject,
        status,
        messageId,
        rawPayload: {
          deliveryKey,
          requestId,
          grantId: grant.id,
          error: errorCode,
        },
      },
    });

    await tx.domainEvent.create({
      data: {
        streamType: "ProfileAccessNoticeDelivery",
        streamId: claim.id,
        eventType: "PROFILE_ACCESS_NOTICE_DISPATCH_RECORDED",
        payload: {
          deliveryKey,
          requestId,
          grantId: grant.id,
          actorUserId,
          status,
          messageId,
          error: errorCode,
        },
      },
    });
  });

  return { status, messageId, alreadyAttempted: false };
}
