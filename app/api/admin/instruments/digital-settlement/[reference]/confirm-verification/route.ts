import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/infrastructure/db/prisma";
import {
  confirmDigitalSettlementVerificationWithClient,
  type DigitalSettlementVerificationClient,
} from "@/domains/instruments/commands/confirmDigitalSettlementVerificationWithClient";
import {
  DIGITAL_SETTLEMENT_EMAIL_EVENT,
  sendDigitalSettlementStateEmail,
} from "@/domains/instruments/communications/sendDigitalSettlementStateEmail";

type Body = {
  transactionHash?: string;
  observedAmountUsdt?: string;
  observedReceivingAddress?: string;
};

export async function POST(
  req: Request,
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
    const body = (await req.json()) as Body;

    if (
      !body.transactionHash ||
      !body.observedAmountUsdt ||
      !body.observedReceivingAddress
    ) {
      return NextResponse.json(
        { ok: false, error: "VERIFICATION_EVIDENCE_REQUIRED" },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(
      async (tx: DigitalSettlementVerificationClient) =>
        confirmDigitalSettlementVerificationWithClient({
          client: tx,
          instrumentReference: reference,
          transactionHash: body.transactionHash!,
          observedAmountUsdt: body.observedAmountUsdt!,
          observedReceivingAddress: body.observedReceivingAddress!,
          actorUserId: actor.id,
        }),
    );

    const email = await sendDigitalSettlementStateEmail({
      event: DIGITAL_SETTLEMENT_EMAIL_EVENT.VERIFICATION_CONFIRMED,
      reference,
      verificationAmountUsdt: body.observedAmountUsdt,
      verificationTxHash: body.transactionHash,
    });

    return NextResponse.json({
      ok: true,
      result,
      email,
    });
  } catch (error) {
    console.error("[DSI_CONFIRM_VERIFICATION_ROUTE_FAILED]", error);

    return NextResponse.json(
      {
        ok: false,
        error: "DSI_CONFIRM_VERIFICATION_ROUTE_FAILED",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
