import type { PrismaClient } from "@prisma/client";
import type { loadRecipientBuyerDossierWithClient } from "./loadRecipientBuyerDossierWithClient";

type DeliveryTransaction = Parameters<typeof loadRecipientBuyerDossierWithClient>[0]["client"] &
  Pick<PrismaClient, "$queryRaw" | "domainEvent" | "emailLog">;
export type BuyerDossierMessage = { from: string; to: string[]; replyTo: string; subject: string; text: string; html: string };
const escape = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
/** QUEUED alone is claimable. Provider calls happen after the claim commits.
 * The server route supplies the access checker; no request-body callback exists.
 * Uncertain delivery and interrupted SENDING claims are held for operator review.
 */
export async function deliverRepresentativeBuyerDossierWithClient(input: {
  client: PrismaClient; dossierId: string; actorUserId: string; mode: "send" | "log";
  from: string; replyTo: string;
  accessCurrent: (tx: DeliveryTransaction, record: { id: string; recipientUserId: string; recipientEmail: string }) => Promise<boolean>;
  send: (message: BuyerDossierMessage) => Promise<{ accepted: boolean; messageId?: string }>;
}) {
  async function deliver(channel: "recipient" | "admin") {
    const record = await input.client.$transaction(async (tx: DeliveryTransaction) => {
      await tx.$queryRaw`SELECT id FROM "RepresentativeBuyerDossier" WHERE id = ${input.dossierId} AND "actorUserId" = ${input.actorUserId} FOR UPDATE`;
      const row = await tx.representativeBuyerDossier.findFirst({ where: { id: input.dossierId, actorUserId: input.actorUserId },
        include: { items: { orderBy: { resourceReleaseId: "asc" } }, participant: { select: { displayName: true } } } });
      if (!row) throw new Error("BUYER_DOSSIER_NOT_FOUND");
      const status = channel === "recipient" ? row.recipientDeliveryStatus : row.adminDeliveryStatus;
      if (status !== "QUEUED") return null;
      if (channel === "recipient") {
        await tx.$queryRaw`SELECT g.id FROM "InstitutionalAccessGrant" g JOIN "RepresentativeBuyerDossierItem" i ON i."grantId" = g.id WHERE i."dossierId" = ${row.id} ORDER BY g.id FOR SHARE OF g`;
        if (!await input.accessCurrent(tx, row)) {
          await tx.representativeBuyerDossier.update({ where: { id: row.id }, data: { recipientDeliveryStatus: "FAILED", recipientDeliveryError: "ACCESS_UNAVAILABLE" } });
          return null;
        }
      }
      await tx.representativeBuyerDossier.update({ where: { id: row.id }, data: channel === "recipient"
        ? { recipientDeliveryStatus: "SENDING", recipientAttemptedAt: new Date() }
        : { adminDeliveryStatus: "SENDING", adminAttemptedAt: new Date() } });
      return row;
    }, { maxWait: 10000, timeout: 30000 });
    if (!record) return;
    const signIn = "https://www.axpt.io/login?next=" + encodeURIComponent("/french-ward/dossiers/" + record.id);
    const adminUrl = "https://www.axpt.io/admin/representative-program/buyer-dossiers";
    const materials = record.items.map((item: { label: string; resourceReference: string; resourceVersion: number }) =>
      item.label + " — " + item.resourceReference + " · Edition " + item.resourceVersion).join("\n");
    const subject = channel === "recipient" ? "Your French-Ward Document Invitation" : "Buyer introduction — " + record.participant.displayName;
    const text = channel === "recipient" ? [
      "Hello " + record.recipientName + ",",
      record.participant.displayName + " has introduced you to French-Ward and arranged access to the following institutional materials:",
      materials,
      "Open your documents: " + signIn,
      "Sign in with " + record.recipientEmail + " and enter the access code sent to that address. No additional access request is needed.",
      "You can return through this invitation until " + record.expiresAt.toISOString() + ". Each document displays its publication reference and edition.",
      "For correspondence: french-ward@axpt.io",
      "French-Ward Administration\nFrench-Ward, Inc.",
    ].join("\n\n") : [
      "A buyer introduction and selected document dossier have been recorded.",
      "Representative: " + record.participant.displayName,
      "Recipient: " + record.recipientName + " <" + record.recipientEmail + ">",
      "Organization: " + record.recipientOrganization,
      "Purpose (internal): " + record.purpose,
      "Selected publications:\n" + materials,
      "Access expires: " + record.expiresAt.toISOString(),
      "Dossier: " + record.id,
      "Review: " + adminUrl,
      "Email acceptance does not confirm that the recipient has opened or read the documents.",
    ].join("\n\n");
    const message: BuyerDossierMessage = { from: input.from, replyTo: input.replyTo,
      to: channel === "recipient" ? [record.recipientEmail] : record.adminRecipients, subject, text,
      html: '<div style="font-family:Arial,sans-serif;line-height:1.7;color:#23313a"><h2>French-Ward, Inc.</h2>' +
        text.split("\n\n").map(paragraph => '<p>' + escape(paragraph).replaceAll("\n", "<br>") + '</p>').join("") +
        '<p><a href="' + escape(channel === "recipient" ? signIn : adminUrl) + '">' +
        (channel === "recipient" ? "Open Your Documents" : "Review Buyer Introductions") + '</a></p></div>',
    };
    let status: "ACCEPTED" | "FAILED" | "DELIVERY_UNKNOWN" | "LOGGED_ONLY" = "LOGGED_ONLY";
    let messageId: string | null = null;
    let error: string | null = null;
    if (input.mode === "send") {
      try {
        const response = await input.send(message);
        if (response.accepted && response.messageId) { status = "ACCEPTED"; messageId = response.messageId; }
        else { status = "FAILED"; error = "PROVIDER_REJECTED"; }
      } catch { status = "DELIVERY_UNKNOWN"; error = "PROVIDER_OUTCOME_UNKNOWN"; }
    }
    await input.client.$transaction(async (tx: DeliveryTransaction) => {
      const updated = await tx.representativeBuyerDossier.updateMany({
        where: channel === "recipient" ? { id: record.id, recipientDeliveryStatus: "SENDING" } : { id: record.id, adminDeliveryStatus: "SENDING" },
        data: channel === "recipient" ? { recipientDeliveryStatus: status, recipientMessageId: messageId, recipientDeliveryError: error }
          : { adminDeliveryStatus: status, adminMessageId: messageId, adminDeliveryError: error },
      });
      if (updated.count !== 1) throw new Error("BUYER_DOSSIER_DELIVERY_STATE_CONFLICT");
      await tx.emailLog.create({ data: { type: "ARP_BUYER_DOSSIER_" + channel.toUpperCase(), from: input.from,
        to: message.to.join(","), subject, status, messageId, rawPayload: { dossierId: record.id, channel, mode: input.mode, error } } });
      await tx.domainEvent.create({ data: { streamType: "RepresentativeBuyerDossier", streamId: record.id,
        eventType: "BUYER_DOSSIER_DELIVERY_RECORDED", payload: { channel, status, messageId, error } } });
    }, { maxWait: 10000, timeout: 15000 });
  }
  const results = await Promise.allSettled([deliver("recipient"), deliver("admin")]);
  return { persistenceIssue: results.some(result => result.status === "rejected") };
}
