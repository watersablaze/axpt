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
    "French-Ward | Institutional Correspondence",
    "",
    "Institutional Profile Access",
    "",
    "Your request to review the French-Ward Institutional Profile has been approved.",
    "",
    "Access Institutional Profile:",
    PROFILE_ACCESS_URL,
    "",
    "Sign in using the email address associated with your request.",
    "No further access request is required.",
    "",
    "Respectfully,",
    "French-Ward",
    "French-Ward, Inc.",
  ].join("\\n");

  const html = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Institutional Profile Access</title>
</head>
<body style="margin:0;padding:0;background:#eae8e2;">
  <table role="presentation" cellpadding="0" cellspacing="0"
    width="100%" style="border-collapse:collapse;background:#eae8e2;">
    <tr>
      <td align="center" style="padding:16px 10px;">
        <table role="presentation" cellpadding="0" cellspacing="0"
          width="100%" style="max-width:560px;border-collapse:collapse;">
          <tr>
            <td style="background:#142434;padding:19px 27px 17px;">
              <div style="font-family:Georgia,serif;font-size:19px;
                letter-spacing:2px;color:#f4efe5;">
                FRENCH-WARD
              </div>
              <div style="font-family:Arial,sans-serif;font-size:10px;
                letter-spacing:1.5px;color:#c7b28c;margin-top:5px;">
                INSTITUTIONAL CORRESPONDENCE
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#f8f6f0;padding:24px 27px 20px;
              font-family:Arial,sans-serif;color:#2e3d45;">
              <div style="font-size:10px;letter-spacing:1.4px;
                color:#92794f;font-weight:bold;">
                ACCESS CONFIRMATION
              </div>
              <h1 style="font-family:Georgia,serif;font-weight:normal;
                font-size:27px;line-height:1.2;color:#192b3a;
                margin:10px 0 13px;">
                Institutional Profile Access
              </h1>
              <div style="width:44px;height:2px;background:#b49761;
                margin:0 0 19px;"></div>
              <p style="font-size:15px;line-height:1.55;margin:0 0 19px;">
                Your request to review the
                <strong>French-Ward Institutional Profile</strong>
                has been approved.
              </p>
              <table role="presentation" cellpadding="0"
                cellspacing="0" width="100%">
                <tr>
                  <td align="center" bgcolor="#213c53"
                    style="background:#213c53;border-radius:3px;">
                    <a href="${PROFILE_ACCESS_URL}"
                      style="display:block;padding:15px 12px;
                      font-family:Arial,sans-serif;font-size:15px;
                      line-height:1.3;font-weight:bold;
                      color:#ffffff;text-decoration:none;">
                      Access Institutional Profile &#8594;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size:13px;line-height:1.6;color:#58636a;
                margin:18px 0 15px;">
                Sign in using the email address associated with your
                request. <strong>No further access request is required.</strong>
              </p>
              <div style="border-top:1px solid #dcd5c8;
                padding-top:13px;">
                <div style="font-size:10px;letter-spacing:1px;
                  font-weight:bold;color:#92794f;margin-bottom:7px;">
                  DIRECT ACCESS LINK
                </div>
                <a href="${PROFILE_ACCESS_URL}"
                  style="font-size:12px;line-height:1.5;color:#375970;
                  text-decoration:underline;overflow-wrap:anywhere;
                  word-break:break-word;">
                  ${PROFILE_ACCESS_URL}
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#f2efe7;padding:16px 27px 19px;
              font-family:Arial,sans-serif;font-size:13px;
              line-height:1.6;color:#45535a;">
              Respectfully,<br>
              <strong style="color:#223544;">French-Ward</strong><br>
              French-Ward, Inc.
            </td>
          </tr>
          <tr>
            <td style="background:#142434;padding:11px 27px;
              font-family:Arial,sans-serif;font-size:10px;
              letter-spacing:1px;color:#c8c1b4;">
              FRENCH-WARD &middot; INSTITUTIONAL ACCESS
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

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

    // PostgreSQL partial unique index: one unresolved attempt per grant.
    // A different delivery key cannot bypass the active claim.
    const isUniqueConflict =
      error !== null &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002";

    if (isUniqueConflict) {
      const unresolved = await client.profileAccessNoticeDelivery.findFirst({
        where: {
          grantId: grant.id,
          status: { in: ["SENDING", "DELIVERY_UNKNOWN"] },
        },
        select: { id: true },
      });
      if (unresolved) {
        throw new Error("PROFILE_NOTICE_UNRESOLVED_ATTEMPT");
      }
    }

    throw error;
  }


  // Recheck the complete entitlement after the durable delivery claim
  // and immediately before the external provider operation.
  const dispatchNow = input.now ?? new Date();

  const liveGrant = await client.institutionalAccessGrant.findFirst({
    where: {
      id: grant.id,
      requestId: request.id,
      recipientUserId: grant.recipientUserId,
      recipientEmail: email,
      scope: "PROFILE_VIEW",
      resourceReference: profile.reference,
      resourceVersion: profile.version,
      issuedAt: { lte: dispatchNow },
      expiresAt: { gt: dispatchNow },
      revokedAt: null,
      recipient: {
        id: grant.recipientUserId,
        email,
      },
      request: {
        status: "APPROVED",
        requesterEmail: email,
        scope: "PROFILE_VIEW",
        resourceReference: profile.reference,
        resourceVersion: profile.version,
      },
    },
    select: { id: true },
  });

  if (!liveGrant) {
    // No message was sent. Close the claim and retain operator provenance.
    await client.$transaction(async (tx: Pick<
      PrismaClient,
      "profileAccessNoticeDelivery" | "domainEvent"
    >) => {
      await tx.profileAccessNoticeDelivery.update({
        where: { id: claim.id },
        data: {
          status: "BLOCKED",
          error: "GRANT_NO_LONGER_VALID",
        },
      });

      await tx.domainEvent.create({
        data: {
          streamType: "ProfileAccessNoticeDelivery",
          streamId: claim.id,
          eventType: "PROFILE_ACCESS_NOTICE_DISPATCH_BLOCKED",
          payload: {
            deliveryKey,
            requestId,
            grantId: grant.id,
            actorUserId,
            reason: "GRANT_NO_LONGER_VALID",
          },
        },
      });
    });

    return {
      status: "BLOCKED",
      messageId: null,
      alreadyAttempted: false,
    };
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

  await client.$transaction(async (tx: Pick<
    PrismaClient,
    "profileAccessNoticeDelivery" | "emailLog" | "domainEvent"
  >) => {
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
