import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";
import { projectFrenchWardInstitutionalProfile } from "@/domains/institutions/french-ward/projectFrenchWardInstitutionalProfile";
import { createRepresentativeProfileInvitationWithClient, ProfileInvitationError } from "@/domains/instruments/representative-program/commercial-utility-pack/application/createRepresentativeProfileInvitationWithClient";
import { deliverRepresentativeProfileInvitationWithClient } from "@/domains/instruments/representative-program/commercial-utility-pack/application/deliverRepresentativeProfileInvitationWithClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });
const schema = z.object({
  recipientName: z.string().trim().min(1).max(120),
  recipientEmail: z.string().trim().email().max(254),
  recipientOrganization: z.string().trim().min(1).max(180),
  purpose: z.string().trim().min(1).max(1000),
  idempotencyKey: z.string().uuid(),
}).strict();
type Context = { params: Promise<{ resourceReleaseId: string }> };
async function receipt(introductionId: string, actorUserId: string, resourceReleaseId: string) {
  return prisma.representativeProfileIntroduction.findFirst({
    where: { id: introductionId, actorUserId, resourceReleaseId },
    select: {
      id: true, recipientName: true, recipientEmail: true,
      recipientDeliveryStatus: true, adminDeliveryStatus: true,
      grant: { select: { expiresAt: true, revokedAt: true } },
    },
  });
}
export async function GET(request: Request, context: Context) {
  const principal = await getPrincipal();
  if (!principal) return json({ ok: false }, 401);
  const { resourceReleaseId } = await context.params;
  const id = new URL(request.url).searchParams.get("introductionId") || "";
  if (!id || id.length > 191 || !resourceReleaseId || resourceReleaseId.length > 191) return json({ ok: false }, 400);
  try {
    const result = await receipt(id, principal.userId, resourceReleaseId);
    return result ? json({ ok: true, receipt: result }) : json({ ok: false }, 404);
  } catch { return json({ ok: false, error: "STATUS_UNAVAILABLE" }, 503); }
}
export async function POST(request: Request, context: Context) {
  const principal = await getPrincipal();
  if (!principal) return json({ ok: false }, 401);
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ ok: false }, 403);
  const { resourceReleaseId } = await context.params;
  if (!resourceReleaseId || resourceReleaseId.length > 191) return json({ ok: false }, 400);
  let body: unknown;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 12000) return json({ ok: false }, 413);
    body = JSON.parse(raw);
  } catch { return json({ ok: false }, 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return json({ ok: false, error: "INVALID_INVITATION" }, 400);
  const modeValue = process.env.REPRESENTATIVE_PROFILE_INVITATION_EMAIL_MODE ?? process.env.REPRESENTATIVE_ONBOARDING_EMAIL_MODE ?? "log";
  if (!["send", "log"].includes(modeValue)) return json({ ok: false, error: "DELIVERY_NOT_CONFIGURED" }, 503);
  const mode = modeValue === "send" ? "send" : "log";
  if (mode === "send" && !process.env.RESEND_API_KEY?.trim()) return json({ ok: false, error: "DELIVERY_NOT_CONFIGURED" }, 503);
  const adminRecipients = (process.env.REPRESENTATIVE_PROFILE_ADMIN_EMAILS || "connect@axpt.io").split(",");
  let introductionId: string | null = null;
  try {
    const created = await createRepresentativeProfileInvitationWithClient({
      client: prisma, userId: principal.userId,
      fields: { ...parsed.data, resourceReleaseId }, adminRecipients,
    });
    const id: string = created.introduction.id;
    introductionId = id;
    const profile = projectFrenchWardInstitutionalProfile();
    const delivery = await deliverRepresentativeProfileInvitationWithClient({
      client: prisma, introductionId: id, actorUserId: principal.userId, mode,
      from: process.env.FRENCH_WARD_EMAIL_FROM || process.env.REPRESENTATIVE_ONBOARDING_FROM_EMAIL || "French-Ward <french-ward@axpt.io>",
      replyTo: process.env.REPRESENTATIVE_ONBOARDING_REPLY_TO_EMAIL || "french-ward@axpt.io",
      currentResource: { reference: profile.reference, version: profile.version },
      send: async message => {
        const response = await resend.emails.send(message);
        return { accepted: !response.error && Boolean(response.data?.id), messageId: response.data?.id };
      },
    });
    const result = await receipt(id, principal.userId, resourceReleaseId);
    if (!result) return json({ ok: true, introductionId, statusUnavailable: true }, 202);
    return json({ ok: true, introductionId, receipt: result, persistenceIssue: delivery.persistenceIssue }, 202);
  } catch (error) {
    // Once committed, never misreport the introduction as uncreated.
    if (introductionId) return json({ ok: true, introductionId, statusUnavailable: true }, 202);
    if (error instanceof ProfileInvitationError) {
      const status = error.code === "INVITATION_RATE_LIMIT" ? 429
        : error.code === "IDEMPOTENCY_CONFLICT" ? 409
        : error.code === "INVALID_INVITATION" ? 400
        : error.code === "ADMIN_NOTIFICATION_NOT_CONFIGURED" ? 503 : 403;
      return json({ ok: false, error: error.code }, status);
    }
    // Serialization/connection failures retain the browser's same submission key.
    return json({ ok: false, error: "INVITATION_RETRY_REQUIRED" }, 503);
  }
}
