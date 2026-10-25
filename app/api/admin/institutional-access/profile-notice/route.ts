import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { PERMISSIONS } from "@/domains/auth/permissions";
import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";
import { sendProfileAccessNoticeWithClient } from
  "@/domains/institutional-access/sendProfileAccessNoticeWithClient";

export async function POST(request: Request) {
  const principal = await getPrincipal();

  if (!principal) {
    return NextResponse.json(
      { ok: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  if (
    !principal.permissions.includes(
      PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE
    )
  ) {
    return NextResponse.json(
      { ok: false, error: "Not authorized" },
      { status: 403 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 }
    );
  }

  const input = body as Record<string, unknown>;

  const requestId =
    typeof input.requestId === "string"
      ? input.requestId.trim()
      : "";

  const deliveryKey =
    typeof input.deliveryKey === "string"
      ? input.deliveryKey.trim()
      : "";

  if (
    !requestId ||
    requestId.length > 191 ||
    !/^[a-zA-Z0-9_-]{16,128}$/.test(deliveryKey)
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Valid request and delivery key required",
      },
      { status: 400 }
    );
  }

  const from =
    process.env.FRENCH_WARD_EMAIL_FROM ||
    process.env.DSI_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL;

  if (!from || !process.env.RESEND_API_KEY) {
    return NextResponse.json(
      {
        ok: false,
        error: "Institutional email is not configured",
      },
      { status: 503 }
    );
  }

  try {
    const result = await sendProfileAccessNoticeWithClient({
      client: prisma,
      actorUserId: principal.userId,
      requestId,
      deliveryKey,
      from,
      send: async mail => {
        const response = await resend.emails.send(
          {
            from: mail.from,
            to: mail.to,
            replyTo: mail.replyTo,
            subject: mail.subject,
            text: mail.text,
            html: mail.html,
          },
          { idempotencyKey: mail.idempotencyKey }
        );

        return {
          data: response.data,
          error: response.error,
        };
      },
    });

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "";

    if (message === "PROFILE_NOTICE_INPUT_INVALID") {
      return NextResponse.json(
        { ok: false, error: "Invalid notice request" },
        { status: 400 }
      );
    }

    if (message === "PROFILE_NOTICE_GRANT_UNAVAILABLE") {
      return NextResponse.json(
        {
          ok: false,
          error: "An active approved Profile grant is required",
        },
        { status: 409 }
      );
    }

    if (message === "PROFILE_NOTICE_KEY_CONFLICT") {
      return NextResponse.json(
        {
          ok: false,
          error: "Delivery key belongs to another operation",
        },
        { status: 409 }
      );
    }

    console.error("[institutional-access:profile-notice]", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Profile access notice could not be processed",
      },
      { status: 500 }
    );
  }
}
