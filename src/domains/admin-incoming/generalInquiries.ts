import type { PrismaClient } from "@prisma/client";
import { queueAdminIncomingAlert } from "./adminIncomingAlerts";

type Tx = Pick<PrismaClient, "frenchWardInquiry" | "frenchWardInquiryEvent" | "emailLog">;
export type InquiryInput = { name: string; email: string; organization: string; subject: string; message: string };
export async function createGeneralInquiryWithClient(client: PrismaClient, input: InquiryInput) {
  return client.$transaction(async (tx: Tx) => {
    const record = await tx.frenchWardInquiry.create({ data: { ...input, events: { create: { toStatus: "OPEN", note: "Public inquiry received." } } }, select: { id: true } });
    await queueAdminIncomingAlert({ emailLog: tx.emailLog }, { kind: "GENERAL_INQUIRY", sourceId: record.id });
    const copy = await tx.emailLog.create({ data: {
      type: "FRENCH_WARD_INQUIRY_COPY_V1:" + record.id, to: "french-ward@axpt.io", subject: "FW Inquiry: " + input.subject,
      status: "QUEUED", rawPayload: { inquiryId: record.id },
    }, select: { id: true } });
    return { id: record.id, copyLogId: copy.id };
  }, { timeout: 15000 });
}

/** Canonical actor is supplied by the guarded Admin route; viewing never changes status. */
export async function updateGeneralInquiryWithClient(client: PrismaClient, input: {
  id: string; actorUserId: string; revision: number; status: string; note: string;
}) {
  const note = input.note.trim();
  if (!input.actorUserId || !Number.isSafeInteger(input.revision) || input.revision < 0 ||
      !["OPEN", "IN_REVIEW", "CLOSED"].includes(input.status) || !note || note.length > 2000) throw new Error("INQUIRY_UPDATE_INVALID");
  return client.$transaction(async (tx: Tx) => {
    const current = await tx.frenchWardInquiry.findUnique({ where: { id: input.id }, select: { status: true, revision: true } });
    if (!current) throw new Error("INQUIRY_NOT_FOUND");
    if (current.revision !== input.revision) throw new Error("INQUIRY_UPDATE_CONFLICT");
    const changed = await tx.frenchWardInquiry.updateMany({ where: { id: input.id, revision: input.revision }, data: { status: input.status, revision: { increment: 1 } } });
    if (changed.count !== 1) throw new Error("INQUIRY_UPDATE_CONFLICT");
    await tx.frenchWardInquiryEvent.create({ data: { inquiryId: input.id, actorUserId: input.actorUserId, fromStatus: current.status, toStatus: input.status, note } });
  }, { timeout: 15000 });
}

/** Preserve the existing French-Ward mailbox copy without making email the receipt. */
export async function deliverGeneralInquiryCopy(client: PrismaClient, input: InquiryInput, id: number) {
  try {
    if (process.env.ADMIN_INCOMING_ALERT_EMAIL_MODE !== "send") {
      await client.emailLog.updateMany({ where: { id, status: "QUEUED" }, data: { status: "LOGGED_ONLY" } }); return;
    }
    if (!process.env.RESEND_API_KEY?.trim()) return;
    const claim = await client.emailLog.updateMany({ where: { id, status: "QUEUED" }, data: { status: "SENDING" } });
    if (claim.count !== 1) return;
    let response;
    try {
      const { Resend } = await import("resend");
      response = await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: process.env.FRENCH_WARD_EMAIL_FROM || process.env.NOTIFY_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || "French-Ward <no-reply@axpt.io>",
        to: "french-ward@axpt.io", replyTo: input.email, subject: "FW Inquiry: " + input.subject,
        text: ["French-Ward public inquiry", "Name: " + input.name, "Email: " + input.email, "Organization: " + input.organization, "Subject: " + input.subject, "", input.message].join("\n"),
      });
    } catch { await client.emailLog.update({ where: { id }, data: { status: "DELIVERY_UNCERTAIN" } }); return; }
    await client.emailLog.update({ where: { id }, data: { status: response.error ? "FAILED" : response.data?.id ? "SENT" : "DELIVERY_UNCERTAIN", messageId: response.data?.id || null } });
  } catch { console.error("[FRENCH_WARD_INQUIRY_COPY_FAILED]"); }
}
