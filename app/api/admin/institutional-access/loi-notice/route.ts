import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { PERMISSIONS } from "@/domains/auth/permissions";
import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";
import { sendCommercialIntakeAccessNoticeWithClient } from
  "@/domains/institutional-access/sendCommercialIntakeAccessNoticeWithClient";

export async function POST(request: Request) {
  const principal = await getPrincipal();
  if (!principal) {
    return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
  }
  if (!principal.permissions.includes(PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE)) {
    return NextResponse.json({ ok: false, error: "Not authorized" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  const values = body as Record<string, unknown>;
  const requestId =
    typeof values.requestId === "string" ? values.requestId.trim() : "";
  const deliveryKey =
    typeof values.deliveryKey === "string" ? values.deliveryKey.trim() : "";
  if (
    !requestId || requestId.length > 191 ||
    !/^[a-zA-Z0-9_-]{16,128}$/.test(deliveryKey)
  ) {
    return NextResponse.json(
      { ok: false, error: "Valid request and delivery key required" },
      { status: 400 },
    );
  }

  const from =
    process.env.FRENCH_WARD_EMAIL_FROM ||
    process.env.DSI_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL;
  if (!from || !process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "Institutional email is not configured" },
      { status: 503 },
    );
  }

  try {
    const result = await sendCommercialIntakeAccessNoticeWithClient({
      client: prisma,
      actorUserId: principal.userId,
      requestId,
      deliveryKey,
      from,
      send: async (mail) => {
        const response = await resend.emails.send(
          {
            from: mail.from,
            to: mail.to,
            replyTo: mail.replyTo,
            subject: mail.subject,
            text: mail.text,
            html: mail.html,
          },
          { idempotencyKey: mail.idempotencyKey },
        );
        return { data: response.data, error: response.error };
      },
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "LOI_NOTICE_INPUT_INVALID") {
      return NextResponse.json(
        { ok: false, error: "Invalid LOI notice request" },
        { status: 400 },
      );
    }
    if (code === "LOI_NOTICE_GRANT_UNAVAILABLE") {
      return NextResponse.json(
        { ok: false, error: "A current approved LOI intake grant is required" },
        { status: 409 },
      );
    }
    if (code === "LOI_NOTICE_UNRESOLVED_ATTEMPT") {
      return NextResponse.json(
        { ok: false, error: "An earlier notice requires delivery reconciliation" },
        { status: 409 },
      );
    }
    if (code === "LOI_NOTICE_KEY_CONFLICT") {
      return NextResponse.json(
        { ok: false, error: "Delivery key belongs to another operation" },
        { status: 409 },
      );
    }
    console.error("[institutional-access:loi-notice]", error);
    return NextResponse.json(
      { ok: false, error: "LOI access notice could not be processed" },
      { status: 500 },
    );
  }
}
