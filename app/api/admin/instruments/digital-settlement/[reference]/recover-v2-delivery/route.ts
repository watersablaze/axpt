import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import {
  recoverDigitalSettlementV2DeliveryGrantWithClient,
  type DigitalSettlementV2DeliveryRecoveryClient,
} from "@/domains/instruments/commands/recoverDigitalSettlementV2DeliveryGrantWithClient";
import {
  buildDigitalSettlementV2RecoveryDelivery,
} from "@/domains/instruments/communications/digitalSettlementV2RecoveryDelivery";
import {
  deliverDigitalSettlementEmail,
} from "@/domains/instruments/communications/deliverDigitalSettlementEmail";
import {
  DSI_REFERENCE,
} from "@/domains/instruments/definitions/digitalSettlementV1Definition";
import {
  type DigitalSettlementV2RecipientKey,
} from "@/domains/instruments/definitions/digitalSettlementV2FinancierRevision";
import { prisma } from "@/infrastructure/db/prisma";

type RouteContext = {
  params: Promise<{
    reference: string;
  }>;
};

type Body = {
  recipientKey?: string;
  accessExpiresHours?: number;
};

const RECIPIENT_KEYS =
  new Set<DigitalSettlementV2RecipientKey>([
    "financier",
    "buyerRepresentative",
    "externalReviewer",
    "bobby",
    "lawrence",
  ]);

function isRecipientKey(
  value: string,
): value is DigitalSettlementV2RecipientKey {
  return RECIPIENT_KEYS.has(
    value as DigitalSettlementV2RecipientKey,
  );
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const principal = await getPrincipal();

    if (!principal) {
      return NextResponse.json(
        {
          ok: false,
          committed: false,
          error: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    if (!principal.roles.includes("ADMIN_PLATFORM")) {
      return NextResponse.json(
        {
          ok: false,
          committed: false,
          error: "ADMIN_PLATFORM_REQUIRED",
        },
        { status: 403 },
      );
    }

    if (process.env.DSI_EMAIL_MODE !== "send") {
      return NextResponse.json(
        {
          ok: false,
          committed: false,
          error: "DSI_LIVE_EMAIL_MODE_REQUIRED",
          detail:
            "Delivery recovery requires DSI_EMAIL_MODE=send because the replacement bearer credential must be delivered immediately after commit.",
        },
        { status: 409 },
      );
    }

    const { reference } = await context.params;

    if (reference !== DSI_REFERENCE) {
      return NextResponse.json(
        {
          ok: false,
          committed: false,
          error: "DSI_REFERENCE_NOT_ALLOWED",
        },
        { status: 400 },
      );
    }

    const body = (await request.json()) as Body;

    const recipientKey =
      typeof body.recipientKey === "string"
        ? body.recipientKey
        : "";

    if (!isRecipientKey(recipientKey)) {
      return NextResponse.json(
        {
          ok: false,
          committed: false,
          error: "DSI_V2_RECOVERY_RECIPIENT_INVALID",
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
          committed: false,
          error: "DSI_ACCESS_EXPIRY_INVALID",
        },
        { status: 400 },
      );
    }

    const actor =
      await prisma.user.findUnique({
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
          committed: false,
          error: "DSI_OPERATOR_NOT_FOUND",
        },
        { status: 403 },
      );
    }

    const accessExpiresAt =
      new Date(
        Date.now() +
          expiresHours *
            60 *
            60 *
            1000,
      );

    let recovery: Awaited<
      ReturnType<
        typeof recoverDigitalSettlementV2DeliveryGrantWithClient
      >
    >;

    try {
      recovery =
        await prisma.$transaction(
          async (
            tx: DigitalSettlementV2DeliveryRecoveryClient,
          ) =>
            recoverDigitalSettlementV2DeliveryGrantWithClient({
              client: tx,
              instrumentReference: reference,
              recipientKey,
              actorUserId: actor.id,
              accessExpiresAt,
            }),
        );
    } catch (error) {
      const detail =
        error instanceof Error
          ? error.message
          : String(error);

      const conflict =
        detail.includes(
          "DSI_V2_RECOVERY_DELIVERY_ALREADY_SUCCESSFUL",
        ) ||
        detail.includes(
          "DSI_V2_RECOVERY_ACTIVE_GRANT_AMBIGUOUS",
        ) ||
        detail.includes(
          "DSI_V2_RECOVERY_CURRENT_VERSION_INVALID",
        ) ||
        detail.includes(
          "DSI_V2_RECOVERY_VERSION_STATE_INVALID",
        );

      return NextResponse.json(
        {
          ok: false,
          committed: false,
          error:
            conflict
              ? "DSI_V2_DELIVERY_RECOVERY_NOT_ALLOWED"
              : "DSI_V2_DELIVERY_RECOVERY_TRANSACTION_FAILED",
          detail,
        },
        {
          status:
            conflict
              ? 409
              : 500,
        },
      );
    }

    const committedResult = {
      reference,
      version:
        recovery.instrumentVersion.number,
      recipientKey:
        recovery.key,
      recipientName:
        recovery.recipientName,
      replacedGrantId:
        recovery.replacedGrantId,
      replacementGrantId:
        recovery.grant.id,
      instrumentVersionId:
        recovery.grant.instrumentVersionId,
      accessLevel:
        recovery.grant.accessLevel,
      expiresAt:
        recovery.grant.expiresAt,
    };

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://www.axpt.io";

    try {
      const delivery =
        buildDigitalSettlementV2RecoveryDelivery({
          origin,
          recovery,
        });

      const result =
        await deliverDigitalSettlementEmail(
          delivery.input,
        );

      return NextResponse.json({
        ok: true,
        committed: true,
        result: {
          ...committedResult,
          delivery: {
            ok: true,
            deliveryKey:
              delivery.deliveryKey,
            mode:
              result.mode,
            alreadyDelivered:
              result.alreadyDelivered ?? false,
            messageId:
              result.messageId ?? null,
          },
        },
      });
    } catch (error) {
      console.error(
        "[DSI_V2_RECOVERY_POST_COMMIT_DELIVERY_FAILED]",
        error,
      );

      return NextResponse.json({
        ok: true,
        committed: true,
        result: {
          ...committedResult,
          delivery: {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : String(error),
          },
        },
      });
    }
  } catch (error) {
    console.error(
      "[DSI_V2_RECOVERY_ROUTE_FAILED_PRECOMMIT]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        committed: false,
        error:
          "DSI_V2_DELIVERY_RECOVERY_ROUTE_FAILED",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 },
    );
  }
}
