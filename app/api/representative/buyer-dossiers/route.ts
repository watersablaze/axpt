import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";
import { resolveRepresentativeBuyerDossierSelectionWithClient } from "@/domains/instruments/representative-program/commercial-utility-pack/application/resolveRepresentativeBuyerDossierSelectionWithClient";
import { createRepresentativeBuyerDossierWithClient, BuyerDossierError } from "@/domains/instruments/representative-program/commercial-utility-pack/application/createRepresentativeBuyerDossierWithClient";
import { deliverRepresentativeBuyerDossierWithClient } from "@/domains/instruments/representative-program/commercial-utility-pack/application/deliverRepresentativeBuyerDossierWithClient";
import { loadRecipientBuyerDossierWithClient } from "@/domains/instruments/representative-program/commercial-utility-pack/application/loadRecipientBuyerDossierWithClient";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });
const schema = z.object({
  resourceReleaseIds: z.array(z.string().trim().min(1).max(191)).min(1).max(2).refine(ids=>new Set(ids).size===ids.length),
  reviewHash: z.string().regex(/^[a-f0-9]{64}$/), recipientName: z.string().trim().min(1).max(120),
  recipientEmail: z.string().trim().email().max(254), recipientOrganization: z.string().trim().min(1).max(180),
  purpose: z.string().trim().min(1).max(1000), idempotencyKey: z.string().uuid(),
}).strict();
const receipt = (id: string, actorUserId: string) => prisma.representativeBuyerDossier.findFirst({
  where: { id, actorUserId }, select: { id: true, recipientName: true, recipientEmail: true,
    expiresAt: true, revokedAt: true, recipientDeliveryStatus: true, adminDeliveryStatus: true,
    items: { select: { label: true, resourceReference: true, resourceVersion: true } } },
});
export async function GET(request: Request) {
  const principal = await getPrincipal();
  if (!principal) return json({ ok: false }, 401);
  const url = new URL(request.url);
  try {
    const id = url.searchParams.get("dossierId");
    if (id !== null) {
      if (!id || id.length > 191) return json({ ok: false }, 400);
      const result = await receipt(id, principal.userId);
      return result ? json({ ok: true, receipt: result }) : json({ ok: false }, 404);
    }
    const ids = url.searchParams.getAll("resourceReleaseId");
    if (!ids.length || ids.length > 2 || ids.some(id=>!id || id.length>191) || new Set(ids).size!==ids.length) return json({ ok: false }, 400);
    const now = new Date();
    const appointments: Array<{ id: string }> = await prisma.representativeProgramAppointment.findMany({
      where: { participant: { userId: principal.userId }, instrument: { status: "ACTIVE" }, effectiveAt: { lte: now },
        endedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }, select: { id: true }, take: 2,
    });
    if (appointments.length!==1) return json({ ok: false }, 403);
    const review = await resolveRepresentativeBuyerDossierSelectionWithClient({ client: prisma, userId: principal.userId,
      appointmentId: appointments[0].id, resourceReleaseIds: ids, at: now });
    return review.allowed ? json({ ok: true, review }) : json({ ok: false, error: review.reason }, 403);
  } catch { return json({ ok: false, error: "DOSSIER_REVIEW_UNAVAILABLE" }, 503); }
}
export async function POST(request: Request) {
  const principal = await getPrincipal();
  if (!principal) return json({ ok: false }, 401);
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ ok: false }, 403);
  let body: unknown;
  try { const raw = await request.text(); if (Buffer.byteLength(raw,"utf8")>12000) return json({ok:false},413); body=JSON.parse(raw); }
  catch { return json({ok:false},400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return json({ ok:false, error:"INVALID_DOSSIER" },400);
  const mode = process.env.REPRESENTATIVE_BUYER_DOSSIER_EMAIL_MODE ?? process.env.REPRESENTATIVE_PROFILE_INVITATION_EMAIL_MODE ?? process.env.REPRESENTATIVE_ONBOARDING_EMAIL_MODE ?? "log";
  if ((mode!=="send" && mode!=="log") || (mode==="send" && !process.env.RESEND_API_KEY?.trim())) return json({ok:false,error:"DELIVERY_NOT_CONFIGURED"},503);
  let dossierId: string | null = null;
  try {
    const created = await createRepresentativeBuyerDossierWithClient({ client: prisma, userId: principal.userId,
      fields: parsed.data, adminRecipients: (process.env.REPRESENTATIVE_PROFILE_ADMIN_EMAILS || "connect@axpt.io").split(",") });
    const id: string = created.dossier.id; dossierId=id;
    const delivery = await deliverRepresentativeBuyerDossierWithClient({ client: prisma, dossierId:id, actorUserId:principal.userId, mode,
      from:process.env.FRENCH_WARD_EMAIL_FROM || process.env.REPRESENTATIVE_ONBOARDING_FROM_EMAIL || "French-Ward <french-ward@axpt.io>",
      replyTo:process.env.REPRESENTATIVE_ONBOARDING_REPLY_TO_EMAIL || "french-ward@axpt.io",
      accessCurrent: async (tx, record) => { const view = await loadRecipientBuyerDossierWithClient({client:tx,dossierId:record.id,userId:record.recipientUserId,email:record.recipientEmail}); return Boolean(view?.items.length && view.items.every(item=>item.available)); },
      send:async message=>{ const response=await resend.emails.send(message); return {accepted:!response.error && Boolean(response.data?.id),messageId:response.data?.id}; },
    });
    const result=await receipt(id,principal.userId);
    return json({ok:true,dossierId:id,receipt:result,statusUnavailable:!result,persistenceIssue:delivery.persistenceIssue},202);
  } catch(error) {
    if(dossierId) return json({ok:true,dossierId,statusUnavailable:true},202);
    if(error instanceof BuyerDossierError) return json({ok:false,error:error.code},error.code==="DOSSIER_RATE_LIMIT"?429:error.code==="INVALID_DOSSIER"?400:["IDEMPOTENCY_CONFLICT","DOSSIER_REVIEW_CHANGED"].includes(error.code)?409:error.code==="ADMIN_NOTIFICATION_NOT_CONFIGURED"?503:403);
    return json({ok:false,error:"DOSSIER_RETRY_REQUIRED"},503);
  }
}
