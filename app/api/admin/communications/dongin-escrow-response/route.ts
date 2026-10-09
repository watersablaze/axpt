import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import {
  buildDonginEscrowResponseEmail,
  DONGIN_ESCROW_RESPONSE_TYPE,
  sendDonginEscrowResponseEmail,
} from "@/domains/instruments/communications/donginEscrowResponseEmail";

type Body = {
  action?: "preview" | "send";
};

export async function POST(request: Request) {
  try {
    const principal = await getPrincipal();

    if (!principal) {
      return NextResponse.json(
        {
          ok: false,
          error: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    if (!principal.roles.includes("ADMIN_PLATFORM")) {
      return NextResponse.json(
        {
          ok: false,
          error: "ADMIN_PLATFORM_REQUIRED",
        },
        { status: 403 },
      );
    }

    const body = (await request.json()) as Body;
    const action = body.action;

    if (
      action !== "preview" &&
      action !== "send"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "DONGIN_ESCROW_RESPONSE_ACTION_REQUIRED",
        },
        { status: 400 },
      );
    }

    const message =
      buildDonginEscrowResponseEmail();

    if (action === "preview") {
      return NextResponse.json({
        ok: true,
        result: {
          deliveryMode:
            message.deliveryMode,
          communicationKey:
            message.type,
          communicationType:
            message.communicationType,
          from: message.from,
          to: message.to,
          cc: message.cc,
          subject: message.subject,
          heading: message.heading,
          englishLines:
            message.englishLines,
          koreanLines:
            message.koreanLines,
          html: message.html,
        },
      });
    }

    if (
      process.env.DSI_EMAIL_MODE !==
      "send"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "DONGIN_ESCROW_RESPONSE_LIVE_EMAIL_MODE_REQUIRED",
          detail:
            "Live correspondence is blocked until DSI_EMAIL_MODE=send.",
        },
        { status: 409 },
      );
    }

    const delivery =
      await sendDonginEscrowResponseEmail();

    return NextResponse.json({
      ok: true,
      result: {
        communicationKey:
          DONGIN_ESCROW_RESPONSE_TYPE,
        delivery,
      },
    });
  } catch (error) {
    console.error(
      "[DONGIN_ESCROW_RESPONSE_ROUTE_FAILED]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "DONGIN_ESCROW_RESPONSE_ROUTE_FAILED",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 },
    );
  }
}
