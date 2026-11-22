import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import {
  bootstrapDigitalSettlementV1WithClient,
  type DigitalSettlementBootstrapClient,
} from "@/domains/instruments/bootstrap/bootstrapDigitalSettlementV1WithClient";
import {
  fixDigitalSettlementPricingWithClient,
  type DigitalSettlementPriceFixingClient,
} from "@/domains/instruments/commands/fixDigitalSettlementPricingWithClient";
import {
  issueDigitalSettlementInstructionWithClient,
  type DigitalSettlementIssuanceClient,
} from "@/domains/instruments/commands/issueDigitalSettlementInstructionWithClient";
import {
  issueInstrumentAccessGrantWithClient,
  type InstrumentAccessGrantIssuanceClient,
} from "@/domains/instruments/commands/issueInstrumentAccessGrantWithClient";
import {
  INSTRUMENT_PARTY_ROLE,
} from "@/domains/instruments/contracts";
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
  INDERAKSH_LEGAL_NAME,
} from "@/domains/instruments/definitions/digitalSettlementV1Definition";
import { prisma } from "@/infrastructure/db/prisma";

type RouteContext = {
  params: Promise<{
    reference: string;
  }>;
};

type IssueBody = {
  receivingAddress?: string;
  accessExpiresHours?: number;
  spotBenchmark?: string;
  spotPricePerKgUsd?: string;
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
        { ok: false, error: "FORBIDDEN" },
        { status: 403 },
      );
    }

    const { reference } = await context.params;

    if (process.env.DSI_EMAIL_MODE !== "send") {
      return NextResponse.json(
        {
          ok: false,
          error: "DSI_LIVE_EMAIL_MODE_REQUIRED",
          detail:
            "Initial issuance is blocked unless DSI_EMAIL_MODE=send so the private bearer link is delivered immediately.",
        },
        { status: 409 },
      );
    }

    if (reference !== DSI_REFERENCE) {
      return NextResponse.json(
        {
          ok: false,
          error: "DSI_REFERENCE_NOT_ALLOWED",
        },
        { status: 400 },
      );
    }

    const actor = await prisma.user.findUnique({
      where: {
        email: principal.email,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!actor) {
      return NextResponse.json(
        {
          ok: false,
          error: "DSI_OPERATOR_NOT_FOUND",
        },
        { status: 403 },
      );
    }

    const body = (await request.json()) as IssueBody;

    const receivingAddress =
      body.receivingAddress?.trim();
    const spotBenchmark = body.spotBenchmark?.trim();
    const spotPricePerKgUsd = body.spotPricePerKgUsd?.trim();

    if (!receivingAddress) {
      return NextResponse.json(
        {
          ok: false,
          error: "DSI_RECEIVING_ADDRESS_REQUIRED",
        },
        { status: 400 },
      );
    }

    if (!spotBenchmark || !spotPricePerKgUsd) {
      return NextResponse.json(
        {
          ok: false,
          error: "DSI_ISSUANCE_PRICING_REQUIRED",
          detail:
            "An approved spot benchmark and USD spot price per KG are required before issuance.",
        },
        { status: 400 },
      );
    }

    const expiresHours =
      typeof body.accessExpiresHours === "number"
        ? body.accessExpiresHours
        : 168;

    if (
      !Number.isFinite(expiresHours) ||
      expiresHours <= 0 ||
      expiresHours > 720
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "DSI_ACCESS_EXPIRY_INVALID",
        },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(
      async (
        tx: DigitalSettlementBootstrapClient &
          DigitalSettlementPriceFixingClient &
          DigitalSettlementIssuanceClient &
          InstrumentAccessGrantIssuanceClient,
      ) => {
        const bootstrap =
          await bootstrapDigitalSettlementV1WithClient({
            client:
              tx as DigitalSettlementBootstrapClient,
            actorUserId: actor.id,
            counterpartyLegalName:
              INDERAKSH_LEGAL_NAME,
          });

        const issuance =
          await fixDigitalSettlementPricingWithClient({
            client:
              tx as DigitalSettlementPriceFixingClient,
            instrumentReference: DSI_REFERENCE,
            spotPricePerKgUsd,
            spotBenchmark,
            actorUserId: actor.id,
          });

        const settlementIssuance =
          await issueDigitalSettlementInstructionWithClient({
            client:
              tx as DigitalSettlementIssuanceClient,
            instrumentReference:
              DSI_REFERENCE,
            receivingAddress,
            actorUserId: actor.id,
          });

        const existingActiveGrant =
          await tx.instrumentAccessGrant.findFirst({
            where: {
              instrument: {
                reference: DSI_REFERENCE,
              },
              recipientName:
                DIGITAL_SETTLEMENT_RECIPIENTS.buyer.name,
              revokedAt: null,
              expiresAt: {
                gt: new Date(),
              },
            },
            select: {
              id: true,
            },
          });

        let access:
          | {
              grantId: string;
              token: string;
            }
          | null = null;

        if (!existingActiveGrant) {
          const accessIssuance =
            await issueInstrumentAccessGrantWithClient({
              client:
                tx as InstrumentAccessGrantIssuanceClient,
              instrumentReference:
                DSI_REFERENCE,
              recipientName:
                DIGITAL_SETTLEMENT_RECIPIENTS.buyer.name,
              recipientRole:
                INSTRUMENT_PARTY_ROLE.COMMERCIAL_PARTICIPANT,
              issuedByUserId: actor.id,
              expiresAt: new Date(
                Date.now() +
                  expiresHours * 60 * 60 * 1000,
              ),
            });

          access = {
            grantId: accessIssuance.grant.id,
            token: accessIssuance.token,
          };
        }

        return {
          bootstrap,
          pricing: issuance,
          issuance: settlementIssuance,
          access,
          existingActiveGrantId:
            existingActiveGrant?.id ?? null,
        };
      },
    );

    if (
      !result.access &&
      result.existingActiveGrantId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "DSI_ACTIVE_ACCESS_GRANT_ALREADY_EXISTS",
          detail:
            "An active access grant already exists. Reuse or revoke it rather than issuing a second private link.",
          result: {
            bootstrap: result.bootstrap,
            issuance: result.issuance,
            accessGrantId:
              result.existingActiveGrantId,
          },
        },
        { status: 409 },
      );
    }

    if (!result.access) {
      throw new Error(
        "DSI_ACCESS_GRANT_NOT_CREATED",
      );
    }

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://www.axpt.io";

    const accessPath =
      `/french-ward/instruments/${DSI_PUBLIC_ID}` +
      `/access/${result.access.token}`;

    const accessUrl =
      `${origin.replace(/\/$/, "")}${accessPath}`;

    let email:
      | Awaited<
          ReturnType<
            typeof sendDigitalSettlementStateEmail
          >
        >
      | {
          ok: false;
          error: string;
        };

    try {
      email =
        await sendDigitalSettlementStateEmail({
          event:
            DIGITAL_SETTLEMENT_EMAIL_EVENT.ISSUED,
          reference: DSI_REFERENCE,
          accessUrl,
          verificationAmountUsdt: "50",
        });
    } catch (emailError) {
      console.error(
        "[DSI_INITIAL_ISSUANCE_EMAIL_FAILED]",
        emailError,
      );

      email = {
        ok: false,
        error:
          emailError instanceof Error
            ? emailError.message
            : String(emailError),
      };
    }

    return NextResponse.json({
      ok: true,
      result: {
        bootstrap: result.bootstrap,
        issuance: result.issuance,
        accessGrantId:
          result.access.grantId,
        accessPath,
        accessUrl,
        email,
      },
    });
  } catch (error) {
    console.error(
      "[DSI_INITIAL_ISSUANCE_ROUTE_FAILED]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "DSI_INITIAL_ISSUANCE_FAILED",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 },
    );
  }
}
