import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { PERMISSIONS } from "@/domains/auth/permissions";
import { isSameOriginMutation } from "@/domains/auth/isSameOriginMutation";
import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";
import { retryRepresentativeBuyerDossierAccessNoticeWithClient } from "@/domains/instruments/representative-program/commercial-utility-pack/application/retryRepresentativeBuyerDossierAccessNoticeWithClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });

export async function POST(request: Request) {
  const principal = await getPrincipal();
  if (!principal) return json({ ok: false }, 401);
  if (!isAdmin(principal) ||
      !principal.permissions.includes(PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE)) {
    return json({ ok: false }, 403);
  }
  if (!isSameOriginMutation(request)) return json({ ok: false }, 403);
  const mode = process.env.REPRESENTATIVE_BUYER_DOSSIER_EMAIL_MODE ??
    process.env.REPRESENTATIVE_PROFILE_INVITATION_EMAIL_MODE ??
    process.env.REPRESENTATIVE_ONBOARDING_EMAIL_MODE ?? "log";
  if (mode !== "send" || !process.env.RESEND_API_KEY?.trim()) {
    return json({ ok: false, error: "PROVIDER_NOT_CONFIGURED" }, 503);
  }
  let body: unknown;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 500) return json({ ok: false }, 413);
    body = JSON.parse(raw);
  } catch { return json({ ok: false }, 400); }
  const parsed = z.object({ dossierId: z.string().uuid() }).strict().safeParse(body);
  if (!parsed.success) return json({ ok: false, error: "RETRY_INVALID" }, 400);
  try {
    const result = await retryRepresentativeBuyerDossierAccessNoticeWithClient({
      client: prisma, dossierId: parsed.data.dossierId,
      operatorUserId: principal.userId,
      from: process.env.FRENCH_WARD_EMAIL_FROM ||
        process.env.REPRESENTATIVE_ONBOARDING_FROM_EMAIL ||
        "French-Ward <french-ward@axpt.io>",
      replyTo: process.env.REPRESENTATIVE_ONBOARDING_REPLY_TO_EMAIL ||
        "french-ward@axpt.io",
      send: async message => {
        const response = await resend.emails.send(message);
        return { accepted: !response.error && Boolean(response.data?.id),
          messageId: response.data?.id };
      },
    });
    return json({ ok: true, result }, 202);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    const unavailable = ["BUYER_DOSSIER_RETRY_NOT_ELIGIBLE",
      "BUYER_DOSSIER_RETRY_ACCESS_UNAVAILABLE", "BUYER_DOSSIER_RETRY_CONFLICT"];
    return json({ ok: false, error: unavailable.includes(reason) ? reason : "BUYER_DOSSIER_RETRY_UNCONFIRMED" },
      unavailable.includes(reason) ? 409 : 503);
  }
}
