import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { hashInstrumentAccessToken } from "@/domains/instruments/access/accessToken";
import {
  DIGITAL_SETTLEMENT_EMAIL_EVENT,
  sendDigitalSettlementStateEmail,
} from "@/domains/instruments/communications/sendDigitalSettlementStateEmail";
import {
  DIGITAL_SETTLEMENT_RECIPIENTS,
} from "@/domains/instruments/communications/digitalSettlementRecipients";
import {
  DSI_PUBLIC_ID,
  DSI_REFERENCE,
} from "@/domains/instruments/definitions/digitalSettlementV1Definition";
import { prisma } from "@/infrastructure/db/prisma";

type RouteContext = {
  params: Promise<{
    reference: string;
  }>;
};

type Body = {
  accessUrl?: string;
};

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const principal = await getPrincipal();

    if (!principal) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    if (!principal.roles.includes("ADMIN_PLATFORM")) {
      return NextResponse.json(
        { ok: false, error: "ADMIN_PLATFORM_REQUIRED" },
        { status: 403 },
      );
    }

    if (process.env.DSI_EMAIL_MODE !== "send") {
      return NextResponse.json(
        {
          ok: false,
          error: "DSI_LIVE_EMAIL_MODE_REQUIRED",
        },
        { status: 409 },
      );
    }

    const { reference } = await context.params;

    if (reference !== DSI_REFERENCE) {
      return NextResponse.json(
        {
          ok: false,
          error: "DSI_REFERENCE_NOT_ALLOWED",
        },
        { status: 400 },
      );
    }

    const body = (await request.json()) as Body;
    const submittedAccessUrl = body.accessUrl?.trim();

    if (!submittedAccessUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: "DSI_ACCESS_URL_REQUIRED",
        },
        { status: 400 },
      );
    }

    let accessUrl: URL;

    try {
      accessUrl = new URL(submittedAccessUrl);
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "DSI_ACCESS_URL_INVALID",
        },
        { status: 400 },
      );
    }

    if (
      accessUrl.protocol !== "https:" ||
      accessUrl.hostname !== "www.axpt.io"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "DSI_ACCESS_URL_ORIGIN_INVALID",
        },
        { status: 400 },
      );
    }

    const expectedPrefix =
      `/french-ward/instruments/${DSI_PUBLIC_ID}/access/`;

    if (
      !accessUrl.pathname.startsWith(expectedPrefix) ||
      accessUrl.search ||
      accessUrl.hash
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "DSI_ACCESS_URL_PATH_INVALID",
        },
        { status: 400 },
      );
    }

    const token = decodeURIComponent(
      accessUrl.pathname.slice(expectedPrefix.length),
    ).trim();

    if (!token || token.includes("/")) {
      return NextResponse.json(
        {
          ok: false,
          error: "DSI_ACCESS_TOKEN_INVALID",
        },
        { status: 400 },
      );
    }

    const codeHash = hashInstrumentAccessToken(token);
    const now = new Date();

    const grant = await prisma.instrumentAccessGrant.findUnique({
      where: {
        codeHash,
      },
      select: {
        id: true,
        recipientName: true,
        accessLevel: true,
        revokedAt: true,
        expiresAt: true,
        instrument: {
          select: {
            reference: true,
          },
        },
      },
    });

    if (
      !grant ||
      grant.instrument.reference !== DSI_REFERENCE ||
      grant.recipientName !==
        DIGITAL_SETTLEMENT_RECIPIENTS.buyer.name ||
      grant.accessLevel !== "VIEW" ||
      grant.revokedAt ||
      (grant.expiresAt &&
        grant.expiresAt.getTime() <= now.getTime())
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "DSI_ACTIVE_ACCESS_GRANT_NOT_CONFIRMED",
        },
        { status: 409 },
      );
    }

    const settlement =
      await prisma.digitalSettlementInstruction.findFirst({
        where: {
          instrument: {
            reference: DSI_REFERENCE,
          },
        },
        select: {
          verificationAmountUsdt: true,
        },
      });

    const email =
      await sendDigitalSettlementStateEmail({
        event:
          DIGITAL_SETTLEMENT_EMAIL_EVENT.ACCESS_REISSUED,
        reference: DSI_REFERENCE,
        accessUrl: submittedAccessUrl,
        verificationAmountUsdt:
          settlement?.verificationAmountUsdt?.toString() ??
          "50",
        deliveryKey: grant.id,
      });

    return NextResponse.json({
      ok: true,
      result: {
        accessGrantId: grant.id,
        email,
      },
    });
  } catch (error) {
    console.error(
      "[DSI_ACCESS_REISSUED_ROUTE_FAILED]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error: "DSI_ACCESS_REISSUED_ROUTE_FAILED",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 },
    );
  }
}
