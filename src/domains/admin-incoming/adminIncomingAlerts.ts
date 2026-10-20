import type { PrismaClient } from "@prisma/client";

type Client = Pick<PrismaClient, "emailLog">;
export type IncomingAlert = { kind: "PROFILE_REQUEST" | "LOI_ACCESS_REQUEST" | "ARP_FIELD_MESSAGE"; sourceId: string };
const recipient = "connect@axpt.io";
const prefix = "ADMIN_INCOMING_V1:";
const titles = { PROFILE_REQUEST: "Profile access request", LOI_ACCESS_REQUEST: "LOI access request", ARP_FIELD_MESSAGE: "Representative field communication" };
export function incomingAlertType(input: IncomingAlert) { return prefix + input.kind + ":" + input.sourceId; }

/** Called inside the transaction creating the request/message; no network IO here. */
export async function queueAdminIncomingAlert(client: Client, input: IncomingAlert) {
  const reviewPath = input.kind === "ARP_FIELD_MESSAGE" ? "/admin/incoming?lane=field" : "/admin/institutional-access?requestId=" + encodeURIComponent(input.sourceId);
  return client.emailLog.create({ data: {
    type: incomingAlertType(input), to: recipient, subject: "[AXPT • Review] " + titles[input.kind], status: "QUEUED",
    rawPayload: { kind: input.kind, sourceId: input.sourceId, reviewPath },
  }, select: { id: true } });
}

export type AlertSend = (input: { to: string; from: string; subject: string; text: string; html: string }) => Promise<{ data: { id: string } | null; error: unknown }>;
/** A single CAS claim prevents concurrent sends. Ambiguous outcomes remain held. */
export async function deliverAdminIncomingAlert(client: Client, id: number, options: {
  mode: "send" | "log"; from: string; send: AlertSend;
}) {
  const row = await client.emailLog.findUnique({ where: { id } });
  if (!row?.type?.startsWith(prefix) || row.to !== recipient) return;
  const payload = row.rawPayload as { kind?: string; sourceId?: string; reviewPath?: string } | null;
  if (!payload || !Object.prototype.hasOwnProperty.call(titles, payload.kind || "") || !payload.sourceId) return;
  // Reconstruct the URL from validated canonical fields, never from a supplied URL.
  const path = payload.kind === "ARP_FIELD_MESSAGE" ? "/admin/incoming?lane=field" : "/admin/institutional-access?requestId=" + encodeURIComponent(payload.sourceId);
  const url = "https://www.axpt.io" + path;
  const claim = await client.emailLog.updateMany({ where: { id, status: { in: ["QUEUED", "FAILED", "LOGGED_ONLY"] } }, data: { status: "SENDING" } });
  if (claim.count !== 1) return;
  if (options.mode === "log") {
    await client.emailLog.update({ where: { id }, data: { status: "LOGGED_ONLY" } }); return;
  }
  const title = titles[payload.kind as keyof typeof titles];
  const text = title + " received. Review and act in AXPT Admin: " + url + "\nNo access decision has been made by this notification.";
  const html = `<div style="background:#edf1f4;padding:32px;font-family:Arial,sans-serif;color:#173043"><div style="max-width:560px;margin:auto;background:#fff;padding:32px;border-top:3px solid #a98c50"><p style="font-size:12px;letter-spacing:2px">AXPT · ADMIN INCOMING</p><h1 style="font-size:24px">${title}</h1><p>A new item is ready for your review.</p><p style="margin:28px 0"><a href="${url}" style="background:#173043;color:#fff;padding:13px 20px;text-decoration:none">Review in Admin</a></p><p style="font-size:12px;color:#526573">This alert does not approve access or change the underlying record.</p></div></div>`;
  let response: Awaited<ReturnType<AlertSend>>;
  try { response = await options.send({ to: recipient, from: options.from, subject: row.subject || title, text, html }); }
  catch { await client.emailLog.update({ where: { id }, data: { status: "DELIVERY_UNCERTAIN" } }); return; }
  await client.emailLog.update({ where: { id }, data: {
    status: response.error ? "FAILED" : response.data?.id ? "SENT" : "DELIVERY_UNCERTAIN",
    messageId: response.data?.id || null,
  } });
}

/** Email errors never change a successfully committed request into an HTTP failure. */
export async function dispatchAdminIncomingAlert(client: Client, input: IncomingAlert) {
  try {
    const row = await client.emailLog.findFirst({ where: { type: incomingAlertType(input) }, orderBy: { id: "asc" }, select: { id: true } });
    if (!row) return;
    await dispatchAdminIncomingAlertById(client, row.id);
  } catch { console.error("[ADMIN_INCOMING_ALERT_DISPATCH_FAILED]"); }
}
export async function dispatchAdminIncomingAlertById(client: Client, id: number) {
  const mode = process.env.ADMIN_INCOMING_ALERT_EMAIL_MODE === "send" ? "send" : "log";
  // Missing credentials leave the durable queue available for an operator retry.
  if (mode === "send" && !process.env.RESEND_API_KEY?.trim()) return;
  await deliverAdminIncomingAlert(client, id, {
    mode, from: process.env.NOTIFY_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || "AXPT <no-reply@axpt.io>",
    send: async input => {
      const { Resend } = await import("resend");
      return new Resend(process.env.RESEND_API_KEY).emails.send(input);
    },
  });
}
