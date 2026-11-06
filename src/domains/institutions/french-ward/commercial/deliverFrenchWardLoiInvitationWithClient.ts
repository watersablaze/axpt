import type {
  PrismaClient,
} from "@prisma/client";

import {
  FRENCH_WARD_ACTION,
  resolveFrenchWardActionAuthorityWithClient,
} from "../governance/resolveFrenchWardActionAuthorityWithClient";

import {
  FRENCH_WARD_COMMERCIAL_INTAKE,
} from "./canonicalCommercialIntake";

import {
  generateFrenchWardLoiCredential,
  hashFrenchWardLoiCredential,
} from "./loiInvitationCredential";

export type FrenchWardLoiDeliveryStatus =
  | "QUEUED"
  | "SENDING"
  | "ACCEPTED"
  | "FAILED"
  | "DELIVERY_UNKNOWN"
  | "LOGGED_ONLY"
  | "BLOCKED";

export type FrenchWardLoiMessage = {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey: string;
};

export type FrenchWardLoiMailResult = {
  accepted: boolean;
  messageId?: string;
};

export class FrenchWardLoiDeliveryError
  extends Error {
  constructor(
    public readonly code: string,
  ) {
    super(code);
    this.name =
      "FrenchWardLoiDeliveryError";
  }
}

type DeliveryRecord = {
  id: string;
  actorUserId: string;
  governingReference: string;
  requestId: string;
  grantId: string;
  recipientUserId: string;
  recipientName: string;
  recipientEmail: string;
  recipientOrganization: string;
  purpose: string;
  policy: string;
  expiresAt: Date;
  revokedAt: Date | null;
  credentialHash: string | null;
  credentialIssuedAt: Date | null;
  deliveryStatus: string;
  messageId: string | null;
  deliveryError: string | null;
};

function escapeHtml(
  value: string,
) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizedAccessOrigin(
  value: string,
) {
  try {
    const url =
      new URL(value);

    if (
      url.protocol !== "https:" &&
      !(
        process.env.NODE_ENV !== "production" &&
        url.protocol === "http:"
      )
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

export function buildFrenchWardLoiCredentialAccessUrl(
  origin: string,
  credential: string,
) {
  const normalizedOrigin =
    normalizedAccessOrigin(
      origin.trim(),
    );

  const normalizedCredential =
    credential.trim();

  if (
    !normalizedOrigin ||
    !normalizedCredential ||
    normalizedCredential.length > 256
  ) {
    throw new FrenchWardLoiDeliveryError(
      "FW_LOI_DELIVERY_INPUT_INVALID",
    );
  }

  return (
    normalizedOrigin +
    "/french-ward/transaction-intake/access/" +
    encodeURIComponent(
      normalizedCredential,
    )
  );
}

/**
 * Pure correspondence renderer.
 *
 * accessUrl must be supplied by the server-owned caller.
 * It is intentionally not constructed from request-body data here.
 *
 * 1D may supply the current controlled-access route.
 * 1E may later supply a credential-bound no-login route without
 * changing issuance or delivery authority.
 */
export function renderFrenchWardLoiInvitationMessage(
  input: {
    from: string;
    replyTo: string;
    accessUrl: string;
  },
  invitation: Pick<
    DeliveryRecord,
    | "id"
    | "recipientName"
    | "recipientEmail"
    | "recipientOrganization"
    | "expiresAt"
  >,
): FrenchWardLoiMessage {
  const subject =
    "French-Ward | Letter of Intent & Transaction Intake";

  const text = [
    `Hello ${invitation.recipientName},`,
    "",
    "French-Ward has provided you private access to its Letter of Intent & Transaction Intake.",
    "",
    "This invitation allows you to present a proposed commercial transaction for institutional review.",
    "Submission does not constitute acceptance, approval, allocation, title transfer, or transaction authorization.",
    "",
    "Open Commercial Intake:",
    input.accessUrl,
    "",
    `Recipient: ${invitation.recipientEmail}`,
    `Organization: ${invitation.recipientOrganization}`,
    `Access available until: ${invitation.expiresAt.toUTCString()}`,
    "",
    "For correspondence: french-ward@axpt.io",
    "",
    "Respectfully,",
    "French-Ward Administration",
    "French-Ward, Inc.",
  ].join("\n");

  const href =
    escapeHtml(input.accessUrl);

  const html =
    '<!doctype html>' +
    '<html lang="en">' +
    '<head>' +
    '<meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>French-Ward Commercial Intake</title>' +
    '</head>' +
    '<body style="margin:0;padding:0;background:#e8ebe8;font-family:Arial,Helvetica,sans-serif;color:#263e47">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e8ebe8">' +
    '<tr><td align="center" style="padding:36px 16px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#f7f4ec;border:1px solid #c8d0ca">' +
    '<tr><td style="padding:22px 36px;background:#233c45;border-top:3px solid #9b8a68;border-bottom:1px solid #83968f">' +
    '<p style="margin:0;color:#f1eee4;font-size:12px;line-height:1.5;letter-spacing:2px;font-weight:bold">FRENCH-WARD, INC.</p>' +
    '<p style="margin:5px 0 0;color:#b7c9ca;font-size:9px;line-height:1.5;letter-spacing:1.4px;text-transform:uppercase">Institutional correspondence · Private commercial intake</p>' +
    '</td></tr>' +
    '<tr><td style="padding:34px 36px 30px">' +
    '<h1 style="margin:0 0 24px;color:#233d46;font-family:Georgia,Times,serif;font-size:32px;font-weight:normal;line-height:1.2">Letter of Intent &amp; Transaction Intake</h1>' +
    '<p style="margin:0 0 20px;color:#40535b;font-size:15px;line-height:1.75">Hello ' +
    escapeHtml(invitation.recipientName) +
    ',</p>' +
    '<p style="margin:0 0 20px;color:#40535b;font-size:15px;line-height:1.75">French-Ward has provided you private access to its Letter of Intent &amp; Transaction Intake.</p>' +
    '<p style="margin:0 0 22px;color:#40535b;font-size:14px;line-height:1.75">This invitation allows you to present a proposed commercial transaction for institutional review. Submission does not constitute acceptance, approval, allocation, title transfer, or transaction authorization.</p>' +
    '<p style="margin:28px 0"><a href="' +
    href +
    '" style="display:inline-block;padding:14px 22px;background:#294b55;border:1px solid #294b55;border-radius:2px;color:#f7f4ec;font-size:13px;font-weight:bold;line-height:1.5;text-decoration:none">Open Commercial Intake →</a></p>' +
    '<div style="margin:26px 0;padding:18px 0;border-top:1px solid #cbd2c9;border-bottom:1px solid #cbd2c9">' +
    '<p style="margin:0 0 7px;color:#71817f;font-size:11px;line-height:1.6">Recipient · ' +
    escapeHtml(invitation.recipientEmail) +
    '</p>' +
    '<p style="margin:0 0 7px;color:#71817f;font-size:11px;line-height:1.6">Organization · ' +
    escapeHtml(invitation.recipientOrganization) +
    '</p>' +
    '<p style="margin:0;color:#71817f;font-size:11px;line-height:1.6">Access available until · ' +
    escapeHtml(invitation.expiresAt.toUTCString()) +
    '</p>' +
    '</div>' +
    '<p style="margin:0;color:#455b62;font-size:12px;line-height:1.7">For correspondence · french-ward@axpt.io</p>' +
    '<div style="margin-top:28px;padding-top:20px;border-top:1px solid #cbd2c9">' +
    '<p style="margin:0;color:#344e57;font-size:12px;line-height:1.7">Respectfully,<br>French-Ward Administration<br><span style="color:#75837f">French-Ward, Inc.</span></p>' +
    '</div>' +
    '</td></tr></table></td></tr></table>' +
    '</body></html>';

  return {
    from:
      input.from,

    to:
      invitation.recipientEmail,

    replyTo:
      input.replyTo,

    subject,
    text,
    html,

    idempotencyKey:
      "fw-loi-invitation-" +
      invitation.id,
  };
}

/**
 * Governing LOI delivery.
 *
 * - Only QUEUED may claim delivery.
 * - SEND_LOI standing is re-proven before dispatch.
 * - The exact canonical LOI grant is re-proven live.
 * - Durable SENDING claim precedes provider side effects.
 * - Provider calls occur outside the database transaction.
 * - DELIVERY_UNKNOWN is never automatically retried.
 */
export async function deliverFrenchWardLoiInvitationWithClient(
  input: {
    client: PrismaClient;
    invitationId: string;
    actorUserId: string;
    mode: "send" | "log";
    from: string;
    replyTo: string;

    /**
     * Server-owned deployment origin.
     *
     * Recipient access paths are constructed inside this service.
     * Callers may not supply an arbitrary recipient URL.
     */
    accessOrigin: string;

    send: (
      message: FrenchWardLoiMessage,
    ) => Promise<FrenchWardLoiMailResult>;
    now?: Date;
  },
) {
  const invitationId =
    input.invitationId.trim();

  const actorUserId =
    input.actorUserId.trim();

  const from =
    input.from.trim();

  const replyTo =
    input.replyTo.trim();

  const accessOrigin =
    normalizedAccessOrigin(
      input.accessOrigin.trim(),
    );

  const now =
    input.now ?? new Date();

  if (
    !invitationId ||
    invitationId.length > 191 ||
    !actorUserId ||
    actorUserId.length > 191 ||
    !from ||
    !replyTo ||
    !accessOrigin ||
    !Number.isFinite(now.getTime())
  ) {
    throw new FrenchWardLoiDeliveryError(
      "FW_LOI_DELIVERY_INPUT_INVALID",
    );
  }

  const claim =
    await input.client.$transaction(
      async (tx) => {
        await tx.$queryRaw`
          SELECT id
          FROM "FrenchWardLoiInvitation"
          WHERE id = ${invitationId}
            AND "actorUserId" = ${actorUserId}
          FOR UPDATE
        `;

        const invitation =
          await tx.frenchWardLoiInvitation.findFirst({
            where: {
              id:
                invitationId,

              actorUserId,
            },

            select: {
              id: true,
              actorUserId: true,
              governingReference: true,
              requestId: true,
              grantId: true,
              recipientUserId: true,
              recipientName: true,
              recipientEmail: true,
              recipientOrganization: true,
              purpose: true,
              policy: true,
              expiresAt: true,
              revokedAt: true,
              credentialHash: true,
              credentialIssuedAt: true,
              deliveryStatus: true,
              messageId: true,
              deliveryError: true,
            },
          }) as DeliveryRecord | null;

        if (!invitation) {
          throw new FrenchWardLoiDeliveryError(
            "FW_LOI_INVITATION_NOT_FOUND",
          );
        }

        if (
          invitation.deliveryStatus !==
          "QUEUED"
        ) {
          return {
            dispatch:
              false as const,

            status:
              invitation.deliveryStatus as
                FrenchWardLoiDeliveryStatus,

            messageId:
              invitation.messageId,

            error:
              invitation.deliveryError,

            alreadyAttempted:
              true,
          };
        }

        const block = async (
          reason: string,
        ) => {
          await tx.frenchWardLoiInvitation.update({
            where: {
              id:
                invitation.id,
            },

            data: {
              deliveryStatus:
                "BLOCKED",

              deliveryError:
                reason,
            },
          });

          await tx.domainEvent.create({
            data: {
              streamType:
                "FrenchWardLoiInvitation",

              streamId:
                invitation.id,

              eventType:
                "FRENCH_WARD_LOI_DELIVERY_BLOCKED",

              payload: {
                actorUserId,
                grantId:
                  invitation.grantId,

                requestId:
                  invitation.requestId,

                reason,
              },
            },
          });

          return {
            dispatch:
              false as const,

            status:
              "BLOCKED" as const,

            messageId:
              null,

            error:
              reason,

            alreadyAttempted:
              false,
          };
        };

        if (
          invitation.revokedAt ||
          invitation.expiresAt <= now
        ) {
          return block(
            "INVITATION_UNAVAILABLE",
          );
        }

        const authority =
          await resolveFrenchWardActionAuthorityWithClient({
            client:
              tx,

            userId:
              actorUserId,

            action:
              FRENCH_WARD_ACTION.SEND_LOI,
          });

        if (!authority.allowed) {
          return block(
            "SEND_LOI_AUTHORITY_UNAVAILABLE",
          );
        }

        if (
          authority.standing.reference !==
          invitation.governingReference
        ) {
          return block(
            "GOVERNING_IDENTITY_CHANGED",
          );
        }

        await tx.$queryRaw`
          SELECT id
          FROM "InstitutionalAccessGrant"
          WHERE id = ${invitation.grantId}
          FOR SHARE
        `;

        const grant =
          await tx.institutionalAccessGrant.findFirst({
            where: {
              id:
                invitation.grantId,

              requestId:
                invitation.requestId,

              recipientUserId:
                invitation.recipientUserId,

              recipientEmail:
                invitation.recipientEmail,

              scope:
                FRENCH_WARD_COMMERCIAL_INTAKE
                  .accessScope,

              resourceReference:
                FRENCH_WARD_COMMERCIAL_INTAKE
                  .reference,

              resourceVersion:
                FRENCH_WARD_COMMERCIAL_INTAKE
                  .version,

              issuedAt: {
                lte:
                  now,
              },

              expiresAt: {
                gt:
                  now,
              },

              revokedAt:
                null,

              recipient: {
                id:
                  invitation.recipientUserId,

                email:
                  invitation.recipientEmail,
              },

              request: {
                id:
                  invitation.requestId,

                status:
                  "APPROVED",

                requesterEmail:
                  invitation.recipientEmail,

                scope:
                  FRENCH_WARD_COMMERCIAL_INTAKE
                    .accessScope,

                resourceReference:
                  FRENCH_WARD_COMMERCIAL_INTAKE
                    .reference,

                resourceVersion:
                  FRENCH_WARD_COMMERCIAL_INTAKE
                    .version,

                decisionPolicy:
                  invitation.policy,
              },
            },

            select: {
              id:
                true,
            },
          });

        if (!grant) {
          return block(
            "GRANT_UNAVAILABLE",
          );
        }

        /*
         * Credential creation occurs only after:
         * - invitation availability;
         * - live SEND_LOI governing authority;
         * - exact live Institutional Access grant.
         *
         * A QUEUED invitation carrying prior credential state is
         * inconsistent and must fail closed. Automatic credential
         * rotation is intentionally prohibited.
         */
        if (
          invitation.credentialHash ||
          invitation.credentialIssuedAt
        ) {
          return block(
            "CREDENTIAL_STATE_INVALID",
          );
        }

        const credential =
          generateFrenchWardLoiCredential();

        const credentialHash =
          hashFrenchWardLoiCredential(
            credential,
          );

        const claimed =
          await tx.frenchWardLoiInvitation.updateMany({
            where: {
              id:
                invitation.id,

              actorUserId,

              deliveryStatus:
                "QUEUED",
            },

            data: {
              credentialHash,

              credentialIssuedAt:
                now,

              deliveryStatus:
                "SENDING",

              attemptedAt:
                now,

              deliveryError:
                null,
            },
          });

        if (claimed.count !== 1) {
          throw new FrenchWardLoiDeliveryError(
            "FW_LOI_DELIVERY_CLAIM_CONFLICT",
          );
        }

        return {
          dispatch:
            true as const,

          invitation,

          /*
           * Raw credential leaves the transaction only in memory.
           * It is never written to persistent storage or audit logs.
           */
          credential,
        };
      },
      {
        maxWait:
          10000,

        timeout:
          30000,
      },
    );

  if (!claim.dispatch) {
    return claim;
  }

  const accessUrl =
    buildFrenchWardLoiCredentialAccessUrl(
      accessOrigin,
      claim.credential,
    );

  const message =
    renderFrenchWardLoiInvitationMessage(
      {
        from,
        replyTo,
        accessUrl,
      },
      claim.invitation,
    );

  let status:
    | "ACCEPTED"
    | "FAILED"
    | "DELIVERY_UNKNOWN"
    | "LOGGED_ONLY" =
      "LOGGED_ONLY";

  let messageId:
    string | null =
      null;

  let error:
    string | null =
      null;

  if (input.mode === "send") {
    status =
      "DELIVERY_UNKNOWN";

    error =
      "PROVIDER_OUTCOME_UNKNOWN";

    try {
      const result =
        await input.send(
          message,
        );

      if (
        result.accepted &&
        result.messageId
      ) {
        status =
          "ACCEPTED";

        messageId =
          result.messageId;

        error =
          null;
      } else {
        status =
          "FAILED";

        error =
          "PROVIDER_REJECTED";
      }
    } catch {
      /*
       * Unknown whether the provider accepted the send.
       * The SENDING claim is resolved to DELIVERY_UNKNOWN
       * and is never automatically retried.
       */
    }
  }

  await input.client.$transaction(
    async (tx) => {
      const updated =
        await tx.frenchWardLoiInvitation.updateMany({
          where: {
            id:
              claim.invitation.id,

            actorUserId,

            deliveryStatus:
              "SENDING",
          },

          data: {
            deliveryStatus:
              status,

            messageId,

            deliveryError:
              error,
          },
        });

      if (updated.count !== 1) {
        throw new FrenchWardLoiDeliveryError(
          "FW_LOI_DELIVERY_STATE_CONFLICT",
        );
      }

      await tx.emailLog.create({
        data: {
          type:
            "FW_GOVERNING_LOI_INVITATION",

          from:
            message.from,

          to:
            message.to,

          subject:
            message.subject,

          status,
          messageId,

          rawPayload: {
            invitationId:
              claim.invitation.id,

            requestId:
              claim.invitation.requestId,

            grantId:
              claim.invitation.grantId,

            governingReference:
              claim.invitation.governingReference,

            providerIdempotencyKey:
              message.idempotencyKey,

            error,
          },
        },
      });

      await tx.domainEvent.create({
        data: {
          streamType:
            "FrenchWardLoiInvitation",

          streamId:
            claim.invitation.id,

          eventType:
            "FRENCH_WARD_LOI_DELIVERY_RECORDED",

          payload: {
            actorUserId,

            governingReference:
              claim.invitation.governingReference,

            requestId:
              claim.invitation.requestId,

            grantId:
              claim.invitation.grantId,

            status,
            messageId,
            error,
          },
        },
      });
    },
    {
      maxWait:
        10000,

      timeout:
        15000,
    },
  );

  return {
    dispatch:
      true as const,

    status,
    messageId,
    error,

    alreadyAttempted:
      false,
  };
}
