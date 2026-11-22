import type { PrismaClient } from "@prisma/client";
import type { loadRecipientBuyerDossierWithClient } from "./loadRecipientBuyerDossierWithClient";

type DeliveryTransaction = Parameters<typeof loadRecipientBuyerDossierWithClient>[0]["client"] &
  Pick<PrismaClient, "$queryRaw" | "domainEvent" | "emailLog">;
export type BuyerDossierMessage = { from: string; to: string[]; cc?: string[]; replyTo: string; subject: string; text: string; html: string };
const escape = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

export type BuyerDossierMessageRecord = {
  id:string; recipientName:string; recipientEmail:string; recipientOrganization:string;
  purpose:string; expiresAt:Date; loiAccessGrantId?:string|null; adminRecipients:string[];
  participant:{displayName:string}; actor:{email:string|null};
  items:Array<{label:string; resourceReference:string; resourceVersion:number}>;
};
function representativeCc(email:string|null|undefined, recipientEmail:string) {
  const value=email?.trim().toLowerCase();
  if(!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null;
  return value===recipientEmail.trim().toLowerCase()?[]:[value];
}
/** Shared exact sender/preview renderer. Pure: no database, grants, delivery, or logging. */
export function renderRepresentativeBuyerDossierMessage(
  input:{from:string; replyTo:string}, record:BuyerDossierMessageRecord, channel:"recipient"|"admin",
):BuyerDossierMessage {
  const cc=channel==="recipient"?representativeCc(record.actor.email,record.recipientEmail):[];
  if(cc===null) throw new Error("REPRESENTATIVE_CC_UNAVAILABLE");
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
  const paragraphStyle = "margin:0 0 20px;color:#40535b;font-size:15px;line-height:1.75";
  const frame = (title:string, eyebrow:string, content:string, preheader:string) =>
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<style>@media only screen and (max-width:480px){.emailOuter{padding:16px 8px!important}.emailBody{padding:26px 22px!important}.emailMasthead{padding:19px 22px!important}.emailTitle{font-size:29px!important}.emailButton{display:block!important;text-align:center!important}}a:focus-visible{outline:2px solid #5b7b84;outline-offset:4px}</style></head>' +
    '<body style="margin:0;padding:0;background:#e8ebe8;font-family:Arial,Helvetica,sans-serif;color:#263e47">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">' + escape(preheader) + '</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e8ebe8"><tr><td class="emailOuter" align="center" style="padding:36px 16px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#f7f4ec;border:1px solid #c8d0ca">' +
    '<tr><td class="emailMasthead" style="padding:22px 36px;background:#233c45;border-top:3px solid #9b8a68;border-bottom:1px solid #83968f">' +
    '<p style="margin:0;color:#f1eee4;font-size:12px;line-height:1.5;letter-spacing:2px;font-weight:bold">FRENCH-WARD, INC.</p>' +
    '<p style="margin:5px 0 0;color:#b7c9ca;font-size:9px;line-height:1.5;letter-spacing:1.4px;text-transform:uppercase">' + escape(eyebrow) + '</p></td></tr>' +
    '<tr><td class="emailBody" style="padding:34px 36px 30px">' +
    '<h1 class="emailTitle" style="margin:0 0 26px;color:#233d46;font-family:Georgia,Times,serif;font-size:34px;font-weight:normal;line-height:1.2;letter-spacing:-.5px">' + escape(title) + '</h1>' + content +
    '<div style="margin-top:28px;padding-top:20px;border-top:1px solid #cbd2c9">' +
    '<p style="margin:0;color:#344e57;font-size:12px;line-height:1.7">French-Ward Administration<br><span style="color:#75837f">French-Ward, Inc.</span></p>' +
    '<p style="margin:12px 0 0;color:#71827f;font-size:11px;line-height:1.7">For correspondence · <a href="mailto:french-ward@axpt.io" style="color:#4a6a72;text-decoration:underline">french-ward@axpt.io</a></p></div>' +
    '</td></tr></table></td></tr></table></body></html>';
  const recipientBody =
    '<p style="' + paragraphStyle + '">Hello ' + escape(record.recipientName) + ',</p>' +
    '<p style="' + paragraphStyle + '">' + escape(record.participant.displayName) + ' has introduced you to French-Ward. The following materials have been selected for your review.</p>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0;border-top:1px solid #b7c4bc">' +
    record.items.map((item,index) => '<tr><td width="30" valign="top" style="padding:17px 10px 17px 0;border-bottom:1px solid #d4d9d0;color:#8a795b;font-size:10px;line-height:1.7">' + String(index+1).padStart(2,"0") + '</td>' +
      '<td style="padding:15px 0;border-bottom:1px solid #d4d9d0"><p style="margin:0;color:#29434b;font-size:15px;line-height:1.6;font-weight:bold">' + escape(item.label) + '</p>' +
      '<p style="margin:4px 0 0;color:#71817f;font-size:10px;line-height:1.6">' + escape(item.resourceReference) + ' · Edition ' + item.resourceVersion + '</p></td></tr>').join("") + '</table>' +
    '<p style="margin:28px 0"><a class="emailButton" href="' + escape(signIn) + '" style="display:inline-block;padding:14px 22px;background:#294b55;border:1px solid #294b55;border-radius:2px;color:#f7f4ec;font-size:13px;font-weight:bold;line-height:1.5;text-decoration:none">Review Your Documents →</a></p>' +
    '<p style="' + paragraphStyle + 'font-size:13px">Enter <strong>' + escape(record.recipientEmail) + '</strong>, request your six-digit access code, and enter it to continue. No password or additional access request is needed.</p>' +
    '<p style="margin:0 0 20px;color:#6e7e7c;font-size:12px;line-height:1.75">Keep this invitation to return. Access is available until <strong style="font-weight:normal;color:#405b62">' + escape(record.expiresAt.toUTCString()) + '</strong>.</p>' +
    (record.loiAccessGrantId ? '<p style="' + paragraphStyle + 'font-size:13px"><strong>LOI access included.</strong> Open Commercial Intake in your document reception to submit a proposed transaction for French-Ward review. Submission does not approve a transaction.</p>' : '');
  const adminBody = text.split("\n\n").map(paragraph => '<p style="' + paragraphStyle + 'font-size:13px">' + escape(paragraph).replaceAll("\n", "<br>") + '</p>').join("") +
    '<p style="margin:24px 0 0"><a href="' + escape(adminUrl) + '" style="color:#365e69;font-size:13px;text-decoration:underline">Review Buyer Introductions →</a></p>';
  const message: BuyerDossierMessage = {
    from:input.from, replyTo:input.replyTo,
    to:channel === "recipient" ? [record.recipientEmail] : record.adminRecipients,
    ...(channel === "recipient" && cc.length ? {cc} : {}),
    subject,text,
    html:channel === "recipient"
      ? frame("Your documents are ready.","Selected documents · Private access",recipientBody,"Your selected French-Ward documents are ready for review.")
      : frame("Buyer introduction recorded.","Administration · Delivery notice",adminBody,"A representative buyer introduction has been recorded."),
  };
  return message;
}

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
        include: { items: { orderBy: { resourceReleaseId: "asc" } }, participant: { select: { displayName: true } }, actor: { select: { email:true } } } });
      if (!row) throw new Error("BUYER_DOSSIER_NOT_FOUND");
      const status = channel === "recipient" ? row.recipientDeliveryStatus : row.adminDeliveryStatus;
      if (status !== "QUEUED") return null;
      if (channel === "recipient") {
        if(representativeCc(row.actor?.email,row.recipientEmail)===null) {
          await tx.representativeBuyerDossier.update({where:{id:row.id},data:{recipientDeliveryStatus:"FAILED",recipientDeliveryError:"REPRESENTATIVE_CC_UNAVAILABLE"}});
          return null;
        }
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
    const message = renderRepresentativeBuyerDossierMessage(input, record, channel);
    const subject = message.subject;
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
        to: message.to.join(","), subject, status, messageId, rawPayload: { dossierId: record.id, channel, mode: input.mode, error, cc:message.cc ?? [] } } });
      await tx.domainEvent.create({ data: { streamType: "RepresentativeBuyerDossier", streamId: record.id,
        eventType: "BUYER_DOSSIER_DELIVERY_RECORDED", payload: { channel, status, messageId, error } } });
    }, { maxWait: 10000, timeout: 15000 });
  }
  const results = await Promise.allSettled([deliver("recipient"), deliver("admin")]);
  return { persistenceIssue: results.some(result => result.status === "rejected") };
}
