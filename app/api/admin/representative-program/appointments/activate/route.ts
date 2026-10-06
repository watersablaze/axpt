import { NextResponse } from "next/server";
import { z } from "zod";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { activateRepresentativeProgramAppointment } from "@/domains/instruments/representative-program";
import { prisma } from "@/infrastructure/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z
  .object({
    appointmentId: z.string().trim().min(1).max(191),
  })
  .strict();

function jsonNoStore(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(request: Request) {
  const principal = await getPrincipal();

  if (!principal) {
    return jsonNoStore(
      {
        ok: false,
        error: "UNAUTHORIZED",
      },
      401,
    );
  }

  if (!isAdmin(principal)) {
    return jsonNoStore(
      {
        ok: false,
        error: "FORBIDDEN",
      },
      403,
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonNoStore(
      {
        ok: false,
        error: "INVALID_JSON",
      },
      400,
    );
  }

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return jsonNoStore(
      {
        ok: false,
        error: "INVALID_APPOINTMENT_ACTIVATION_REQUEST",
      },
      400,
    );
  }

  try {
    const activation =
      await activateRepresentativeProgramAppointment({
        client: prisma,
        appointmentId: parsed.data.appointmentId,
        actorUserId: principal.userId,
      });

    return jsonNoStore(
      {
        ok: true,
        activation,
        authority: {
          created: false,
          changed: false,
        },
      },
      200,
    );
  } catch (error) {
    if (!(error instanceof Error)) {
      console.error(
        "[ARP_APPOINTMENT_ACTIVATION_ROUTE_FAILED]",
        error,
      );

      return jsonNoStore(
        {
          ok: false,
          error: "APPOINTMENT_ACTIVATION_FAILED",
        },
        500,
      );
    }

    const message = error.message;

    if (
      message.includes(
        "ARP_APPOINTMENT_ACTIVATION_APPOINTMENT_NOT_FOUND",
      )
    ) {
      return jsonNoStore(
        {
          ok: false,
          error: "APPOINTMENT_NOT_FOUND",
        },
        404,
      );
    }

    if (
      message.includes(
        "ARP_APPOINTMENT_ACTIVATION_ADMIN_REQUIRED",
      )
    ) {
      return jsonNoStore(
        {
          ok: false,
          error: "FORBIDDEN",
        },
        403,
      );
    }

    if (
      message.startsWith(
        "[ARP_APPOINTMENT_ACTIVATION_",
      )
    ) {
      return jsonNoStore(
        {
          ok: false,
          error: "APPOINTMENT_ACTIVATION_CONFLICT",
        },
        409,
      );
    }

    console.error(
      "[ARP_APPOINTMENT_ACTIVATION_ROUTE_FAILED]",
      error,
    );

    return jsonNoStore(
      {
        ok: false,
        error: "APPOINTMENT_ACTIVATION_FAILED",
      },
      500,
    );
  }
}
