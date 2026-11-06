import {
  NextResponse,
} from "next/server";

import {
  z,
} from "zod";

import {
  getPrincipal,
} from "@/domains/auth/getPrincipal";

import {
  isSameOriginMutation,
} from "@/domains/auth/isSameOriginMutation";

import {
  prisma,
} from "@/infrastructure/db/prisma";

import {
  createFrenchWardLoiInvitationWithClient,
  FRENCH_WARD_SEND_LOI_CONFIRMATION,
  FrenchWardLoiInvitationError,
} from "@/domains/institutions/french-ward/commercial/createFrenchWardLoiInvitationWithClient";

import {
  deliverFrenchWardLoiInvitationWithClient,
  FrenchWardLoiDeliveryError,
} from "@/domains/institutions/french-ward/commercial/deliverFrenchWardLoiInvitationWithClient";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

const responseHeaders = {
  "Cache-Control":
    "private, no-store, max-age=0",

  "Referrer-Policy":
    "no-referrer",

  "X-Content-Type-Options":
    "nosniff",
};

function json(
  body: unknown,
  status = 200,
) {
  return NextResponse.json(
    body,
    {
      status,
      headers:
        responseHeaders,
    },
  );
}

const schema =
  z.object({
    recipientName:
      z.string()
        .trim()
        .min(1)
        .max(120),

    recipientEmail:
      z.string()
        .trim()
        .toLowerCase()
        .email()
        .max(254),

    recipientOrganization:
      z.string()
        .trim()
        .min(1)
        .max(180),

    purpose:
      z.string()
        .trim()
        .min(1)
        .max(1000),

    idempotencyKey:
      z.string()
        .uuid(),
  }).strict();

function resolveMode() {
  const value =
    process.env
      .FRENCH_WARD_LOI_EMAIL_MODE ??
    "log";

  if (
    value !== "send" &&
    value !== "log"
  ) {
    return null;
  }

  return value;
}

function resolveAccessOrigin(
  request: Request,
) {
  /*
   * Production recipient links are anchored to the canonical
   * public AXPT origin and never to request Host / Origin data.
   *
   * Development may use only local loopback runtime origins.
   */
  if (
    process.env.NODE_ENV ===
    "production"
  ) {
    return "https://www.axpt.io";
  }

  try {
    const url =
      new URL(request.url);

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return null;
    }

    if (
      url.hostname !== "localhost" &&
      url.hostname !== "127.0.0.1"
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

function invitationErrorStatus(
  code: string,
) {
  switch (code) {
    case "FW_LOI_INVITATION_INVALID":
      return 400;

    case "FW_LOI_IDEMPOTENCY_CONFLICT":
    case "FW_LOI_RECIPIENT_RECONCILIATION_REQUIRED":
      return 409;

    case "FW_LOI_SEND_AUTHORITY_REQUIRED":
      return 403;

    case "FW_LOI_INTAKE_UNAVAILABLE":
      return 503;

    default:
      return 503;
  }
}

export async function POST(
  request: Request,
) {
  const principal =
    await getPrincipal();

  if (!principal) {
    return json(
      {
        ok: false,
        error:
          "AUTHENTICATION_REQUIRED",
      },
      401,
    );
  }

  if (
    !isSameOriginMutation(
      request,
    )
  ) {
    return json(
      {
        ok: false,
        error:
          "ORIGIN_MISMATCH",
      },
      403,
    );
  }

  let body:
    unknown;

  try {
    const raw =
      await request.text();

    if (
      Buffer.byteLength(
        raw,
        "utf8",
      ) > 6000
    ) {
      return json(
        {
          ok: false,
          error:
            "REQUEST_TOO_LARGE",
        },
        413,
      );
    }

    body =
      JSON.parse(raw);
  } catch {
    return json(
      {
        ok: false,
        error:
          "INVALID_REQUEST",
      },
      400,
    );
  }

  const parsed =
    schema.safeParse(
      body,
    );

  if (!parsed.success) {
    return json(
      {
        ok: false,
        error:
          "INVALID_LOI_INVITATION",
      },
      400,
    );
  }

  const mode =
    resolveMode();

  const accessOrigin =
    resolveAccessOrigin(
      request,
    );

  if (
    !mode ||
    !accessOrigin
  ) {
    return json(
      {
        ok: false,
        error:
          "DELIVERY_NOT_CONFIGURED",
      },
      503,
    );
  }

  if (
    mode === "send" &&
    !process.env
      .RESEND_API_KEY
      ?.trim()
  ) {
    return json(
      {
        ok: false,
        error:
          "DELIVERY_NOT_CONFIGURED",
      },
      503,
    );
  }

  let invitationId:
    string | null =
      null;

  let replay =
    false;

  try {
    const created =
      await createFrenchWardLoiInvitationWithClient({
        client:
          prisma,

        actorUserId:
          principal.userId,

        confirmation:
          FRENCH_WARD_SEND_LOI_CONFIRMATION,

        fields:
          parsed.data,
      });

    invitationId =
      created.invitation.id;

    replay =
      created.replay;
  } catch (error) {
    if (
      error instanceof
      FrenchWardLoiInvitationError
    ) {
      return json(
        {
          ok: false,
          error:
            error.code,
        },
        invitationErrorStatus(
          error.code,
        ),
      );
    }

    return json(
      {
        ok: false,
        error:
          "FW_LOI_ISSUANCE_UNCONFIRMED",
      },
      503,
    );
  }

  if (!invitationId) {
    return json(
      {
        ok: false,
        error:
          "FW_LOI_ISSUANCE_UNCONFIRMED",
      },
      503,
    );
  }

  try {
    const delivery =
      await deliverFrenchWardLoiInvitationWithClient({
        client:
          prisma,

        invitationId,

        actorUserId:
          principal.userId,

        mode,

        from:
          process.env
            .FRENCH_WARD_EMAIL_FROM ??
          "French-Ward <french-ward@axpt.io>",

        replyTo:
          process.env
            .FRENCH_WARD_EMAIL_REPLY_TO ??
          "french-ward@axpt.io",

        accessOrigin,

        send:
          async message => {
            /*
             * Lazy import preserves provider-free log mode.
             */
            const {
              resend,
            } =
              await import(
                "@/infrastructure/email/client"
              );

            const response =
              await resend.emails.send(
                message,
              );

            return {
              accepted:
                !response.error &&
                Boolean(
                  response.data?.id,
                ),

              messageId:
                response.data?.id,
            };
          },
      });

    return json(
      {
        ok: true,

        invitationId,

        replay,

        delivery: {
          status:
            delivery.status,

          alreadyAttempted:
            delivery
              .alreadyAttempted,

          messageId:
            delivery.messageId ??
            null,

          error:
            delivery.error ??
            null,
        },
      },
      202,
    );
  } catch (error) {
    /*
     * Issuance has already committed at this point.
     * Never report the invitation as uncreated and never
     * invite the browser to generate a new idempotency key.
     */
    return json(
      {
        ok: true,

        invitationId,

        replay,

        delivery: {
          status:
            "UNCONFIRMED",

          alreadyAttempted:
            false,

          messageId:
            null,

          error:
            error instanceof
              FrenchWardLoiDeliveryError
              ? error.code
              : "FW_LOI_DELIVERY_UNCONFIRMED",
        },
      },
      202,
    );
  }
}
