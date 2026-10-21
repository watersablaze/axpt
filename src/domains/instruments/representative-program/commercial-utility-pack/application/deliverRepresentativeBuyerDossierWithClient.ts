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
        if (row.loiAccessGrantId) {
          await tx.$queryRaw`SELECT id FROM "InstitutionalAccessGrant" WHERE id = ${row.loiAccessGrantId} FOR SHARE`;
        }
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
    const subject = channel === "recipient" ? "French-Ward | Your selected documents" : "Buyer introduction — " + record.participant.displayName;
    const text = channel === "recipient" ? [
      "Hello " + record.recipientName + ",",
      record.participant.displayName + " has introduced you to French-Ward. Your selected documents are ready for review:",
      materials,
      "Review your documents: " + signIn,
      "To begin, open the link and enter " + record.recipientEmail + ". Request your six-digit access code, then enter it to open your documents. No password or additional access request is needed.",
      "Keep this invitation to return to your documents. Access is available until " + record.expiresAt.toUTCString() + ". Each publication includes its reference and edition.",
      ...(record.loiAccessGrantId ? ["Your invitation also includes access to open and submit the Letter of Intent. Find Commercial Intake in your document reception. Submission does not approve a transaction."] : []),
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
      "LOI access: " + (record.loiAccessGrantId ? "Included — form access and submission" : "Not included"),
      "Dossier: " + record.id,
      "Review: " + adminUrl,
      "Email acceptance does not confirm that the recipient has opened or read the documents.",
    ].join("\n\n");
    const message: BuyerDossierMessage = { from: input.from, replyTo: input.replyTo,
      to: channel === "recipient" ? [record.recipientEmail] : record.adminRecipients, subject, text,
      html: channel === "recipient"
        ? '<!doctype html><html><body style="margin:0;background:#070d16;color:#f5f7fa;font-family:Arial,Helvetica,sans-serif">' +
          '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#070d16"><tr><td style="padding:32px 16px">' +
          '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#101f32;border:1px solid #2b415b"><tr><td style="padding:32px 30px;border-top:3px solid #bfa36b">' +
          '<p style="margin:0 0 28px;color:#dcc38f;font-size:12px;letter-spacing:2px">FRENCH-WARD, INC.</p>' +
          '<h1 style="margin:0 0 24px;font-size:28px;line-height:1.3;color:#ffffff">Your documents are ready.</h1>' +
          '<p style="font-size:16px;line-height:1.8;color:#e4eaf2">Hello ' + escape(record.recipientName) + ',</p>' +
          '<p style="font-size:16px;line-height:1.8;color:#e4eaf2">' + escape(record.participant.displayName) + ' has introduced you to French-Ward. The following materials have been selected for your review.</p>' +
          '<div style="margin:24px 0;padding:18px 20px;background:#091421;border-left:2px solid #bfa36b">' +
          record.items.map((item: { label: string; resourceReference: string; resourceVersion: number }) =>
            '<p style="margin:10px 0 18px;line-height:1.6;color:#ffffff;font-size:15px">' + escape(item.label) +
            '<br><span style="font-size:12px;color:#b7c7d9">' + escape(item.resourceReference) + ' · Edition ' + item.resourceVersion + '</span></p>').join('') + '</div>' +
          '<p style="margin:30px 0"><a href="' + escape(signIn) + '" style="display:inline-block;background:#dcc38f;color:#08111e;padding:14px 22px;text-decoration:none;font-weight:bold;border-radius:3px">Review Your Documents →</a></p>' +
          '<p style="font-size:15px;line-height:1.8;color:#e4eaf2">Enter <strong>' + escape(record.recipientEmail) + '</strong>, request your six-digit access code, and enter it to continue. No password or additional access request is needed.</p>' +
          '<p style="font-size:14px;line-height:1.8;color:#b7c7d9">Keep this invitation to return. Access is available until <strong>' + escape(record.expiresAt.toUTCString()) + '</strong>.</p>' +
          (record.loiAccessGrantId ? '<p style="font-size:15px;line-height:1.8;color:#e4eaf2"><strong style="color:#dcc38f">LOI access included.</strong> Open Commercial Intake in your document reception to submit a proposed transaction for French-Ward review. Submission does not approve a transaction.</p>' : '') +
          '<p style="margin-top:30px;padding-top:22px;border-top:1px solid #2b415b;font-size:14px;line-height:1.8;color:#b7c7d9">Questions or correspondence?<br><a href="mailto:french-ward@axpt.io" style="color:#dcc38f">french-ward@axpt.io</a><br><br>French-Ward Administration<br>French-Ward, Inc.</p>' +
          '</td></tr></table></td></tr></table></body></html>'
        : '<div style="font-family:Arial,sans-serif;line-height:1.7;color:#23313a"><h2>French-Ward, Inc.</h2>' +
          text.split("\n\n").map(paragraph => '<p>' + escape(paragraph).replaceAll("\n", "<br>") + '</p>').join("") +
          '<p><a href="' + escape(adminUrl) + '">Review Buyer Introductions</a></p></div>',
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
