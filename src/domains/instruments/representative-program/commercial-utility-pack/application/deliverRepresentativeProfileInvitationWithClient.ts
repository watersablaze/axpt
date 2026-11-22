import type { PrismaClient } from "@prisma/client";

export type ProfileDeliveryChannel = "recipient" | "admin";
export type ProfileDeliveryMessage = {
  from: string; to: string[]; replyTo: string;
  subject: string; text: string; html: string;
};
type DeliveryTransaction = Pick<PrismaClient,
  "$queryRaw" | "representativeProfileIntroduction" | "domainEvent" | "emailLog"
>;
function escape(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

/** A committed grant is required. Provider calls never run in a DB transaction.
 * Only QUEUED is claimable. Uncertain outcomes are held for operator inspection.
 */
export async function deliverRepresentativeProfileInvitationWithClient(input: {
  client: PrismaClient;
  introductionId: string;
  actorUserId: string;
  mode: "send" | "log";
  from: string;
  replyTo: string;
  currentResource: { reference: string; version: number };
  send: (message: ProfileDeliveryMessage) => Promise<{
    accepted: boolean; messageId?: string;
  }>;
}) {
  async function deliver(channel: ProfileDeliveryChannel) {
    const claim = await input.client.$transaction(async (tx: DeliveryTransaction) => {
      await tx.$queryRaw`
        SELECT i.id FROM "RepresentativeProfileIntroduction" i
        JOIN "InstitutionalAccessGrant" g ON g.id = i."grantId"
        WHERE i.id = ${input.introductionId} AND i."actorUserId" = ${input.actorUserId}
        FOR UPDATE OF i FOR SHARE OF g
      `;
      const record = await tx.representativeProfileIntroduction.findFirst({
        where: { id: input.introductionId, actorUserId: input.actorUserId },
        include: { grant: true, participant: { select: { displayName: true } } },
      });
      if (!record) throw new Error("PROFILE_INTRODUCTION_NOT_FOUND");
      const status = channel === "recipient"
        ? record.recipientDeliveryStatus : record.adminDeliveryStatus;
      if (status !== "QUEUED") return null;
      const grant = record.grant;
      if (channel === "recipient" && (
        grant.revokedAt || grant.expiresAt <= new Date() ||
        grant.scope !== "PROFILE_VIEW" ||
        grant.resourceReference !== input.currentResource.reference ||
        grant.resourceVersion !== input.currentResource.version ||
        grant.recipientUserId !== record.recipientUserId ||
        grant.recipientEmail !== record.recipientEmail
      )) {
        await tx.representativeProfileIntroduction.update({
          where: { id: record.id },
          data: { recipientDeliveryStatus: "FAILED", recipientDeliveryError: "ACCESS_UNAVAILABLE" },
        });
        return null;
      }
      const attemptedAt = new Date();
      await tx.representativeProfileIntroduction.update({
        where: { id: record.id },
        data: channel === "recipient"
          ? { recipientDeliveryStatus: "SENDING", recipientAttemptedAt: attemptedAt }
          : { adminDeliveryStatus: "SENDING", adminAttemptedAt: attemptedAt },
      });
      return record;
    }, { maxWait: 10000, timeout: 15000 });
    if (!claim) return;

    const signIn = "https://www.axpt.io/login?next=%2Ffrench-ward%2Fprofile";
    const adminUrl = "https://www.axpt.io/admin/representative-program/profile-introductions";
    const subject = channel === "recipient"
      ? "Your French-Ward Institutional Profile Invitation"
      : "Profile introduction — " + claim.participant.displayName;
    const text = channel === "recipient" ? [
      "Hello " + claim.recipientName + ",",
      claim.participant.displayName + " has invited you to view French-Ward’s Official Institutional Profile.",
      "Open the Profile: " + signIn,
      "Sign in with " + claim.recipientEmail + " and enter the access code sent to that address. Profile access has already been arranged; no further access request is required.",
      "Access expires: " + claim.grant.expiresAt.toISOString() + ". This invitation covers the Institutional Profile.",
      "For correspondence: french-ward@axpt.io",
      "French-Ward Administration\nFrench-Ward, Inc.",
    ].join("\n\n") : [
      "A representative Profile introduction has been recorded.",
      "Representative: " + claim.participant.displayName,
      "Recipient: " + claim.recipientName + " <" + claim.recipientEmail + ">",
      "Organization: " + claim.recipientOrganization,
      "Purpose: " + claim.purpose,
      "Publication: " + claim.resourceReference + " / Edition " + claim.resourceVersion,
      "Access expires: " + claim.grant.expiresAt.toISOString(),
      "Introduction: " + claim.id,
      "Review: " + adminUrl,
      "This notification records granted access; it does not confirm that the recipient has viewed the Profile.",
    ].join("\n\n");
    const message: ProfileDeliveryMessage = {
      from: input.from,
      to: channel === "recipient" ? [claim.recipientEmail] : claim.adminRecipients,
      replyTo: input.replyTo,
      subject, text,
      html: '<div style="font-family:Arial,sans-serif;line-height:1.7;color:#23313a">' +
        '<h2>French-Ward, Inc.</h2>' + text.split("\n\n").map(paragraph =>
          "<p>" + escape(paragraph).replaceAll("\n", "<br>") + "</p>"
        ).join("") + '<p><a href="' + (channel === "recipient" ? signIn : adminUrl) +
        '">' + (channel === "recipient" ? "Open Institutional Profile" : "Review introductions") + '</a></p></div>',
    };
    let status: "ACCEPTED" | "FAILED" | "DELIVERY_UNKNOWN" | "LOGGED_ONLY" = "LOGGED_ONLY";
    let messageId: string | null = null;
    let error: string | null = null;
    if (input.mode === "send") {
      try {
        const response = await input.send(message);
        if (response.accepted && response.messageId) {
          status = "ACCEPTED";
          messageId = response.messageId;
        } else {
          status = "FAILED";
          error = "PROVIDER_REJECTED";
        }
      } catch {
        status = "DELIVERY_UNKNOWN";
        error = "PROVIDER_OUTCOME_UNKNOWN";
      }
    }
    // If persistence fails after provider acceptance, SENDING remains visible
    // and cannot be automatically reclaimed, preventing duplicate delivery.
    await input.client.$transaction(async (tx: DeliveryTransaction) => {
      const updated = await tx.representativeProfileIntroduction.updateMany({
        where: channel === "recipient"
          ? { id: claim.id, recipientDeliveryStatus: "SENDING" }
          : { id: claim.id, adminDeliveryStatus: "SENDING" },
        data: channel === "recipient"
          ? { recipientDeliveryStatus: status, recipientMessageId: messageId, recipientDeliveryError: error }
          : { adminDeliveryStatus: status, adminMessageId: messageId, adminDeliveryError: error },
      });
      if (updated.count !== 1) throw new Error("PROFILE_DELIVERY_STATE_CONFLICT");
      await tx.emailLog.create({ data: {
        type: "ARP_PROFILE_INVITATION_" + channel.toUpperCase(),
        from: message.from, to: message.to.join(","), subject,
        status, messageId,
        rawPayload: { introductionId: claim.id, channel, mode: input.mode, error },
      } });
      await tx.domainEvent.create({ data: {
        streamType: "RepresentativeProfileIntroduction", streamId: claim.id,
        eventType: "PROFILE_INVITATION_DELIVERY_RECORDED",
        payload: { channel, status, messageId, error },
      } });
    }, { maxWait: 10000, timeout: 15000 });
  }
  // Attempt both independently; a recipient delivery problem must not silence Admin.
  const results = await Promise.allSettled([deliver("recipient"), deliver("admin")]);
  return { persistenceIssue: results.some(result => result.status === "rejected") };
}
