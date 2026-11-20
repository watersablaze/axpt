import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/infrastructure/db/prisma";
import {
  authorizeDigitalSettlementPrincipalWithClient,
  type DigitalSettlementPrincipalAuthorizationClient,
} from "@/domains/instruments/commands/authorizeDigitalSettlementPrincipalWithClient";
import {
  DIGITAL_SETTLEMENT_EMAIL_EVENT,
  sendDigitalSettlementStateEmail,
} from "@/domains/instruments/communications/sendDigitalSettlementStateEmail";

export async function POST(
  _req: Request,
  context: { params: Promise<{ reference: string }> },
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

    const actor = await prisma.user.findUnique({
      where: { email: principal.email },
      select: { id: true, email: true },
    });

    if (!actor) {
      return NextResponse.json(
        { ok: false, error: "OPERATOR_USER_NOT_FOUND" },
        { status: 403 },
      );
    }

    const { reference } = await context.params;

    const result = await prisma.$transaction(
      async (tx: DigitalSettlementPrincipalAuthorizationClient) =>
        authorizeDigitalSettlementPrincipalWithClient({
          client: tx,
          instrumentReference: reference,
          actorUserId: actor.id,
        }),
    );

    const settlement = await prisma.digitalSettlementInstruction.findFirst({
      where: {
        instrument: {
          reference,
        },
      },
      select: {
        settlementAmountUsd: true,
        verificationAmountUsdt: true,
      },
    });

    const remainingAmountUsdt =
      settlement?.settlementAmountUsd != null
        ? (
            Number(settlement.settlementAmountUsd) -
            Number(settlement.verificationAmountUsdt)
          ).toFixed(2)
        : null;

    const email = await sendDigitalSettlementStateEmail({
      event: DIGITAL_SETTLEMENT_EMAIL_EVENT.PRINCIPAL_AUTHORIZED,
      reference,
      verificationAmountUsdt:
        settlement?.verificationAmountUsdt?.toString() ?? null,
      remainingAmountUsdt,
    });

    return NextResponse.json({
      ok: true,
      result,
      email,
    });
  } catch (error) {
    console.error("[DSI_AUTHORIZE_PRINCIPAL_ROUTE_FAILED]", error);

    return NextResponse.json(
      {
        ok: false,
        error: "DSI_AUTHORIZE_PRINCIPAL_ROUTE_FAILED",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
