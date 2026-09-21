import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import {
  issueDigitalSettlementV2FinancierRevisionWithClient,
  type DigitalSettlementV2FinancierRevisionIssuanceClient,
} from "@/domains/instruments/commands/issueDigitalSettlementV2FinancierRevisionWithClient";
import {
  buildDigitalSettlementV2Deliveries,
} from "@/domains/instruments/communications/digitalSettlementV2DeliveryAssembly";
import {
  buildDigitalSettlementV2DeliveryRequests,
} from "@/domains/instruments/communications/digitalSettlementV2DeliveryRequests";
import {
  sendDigitalSettlementV2Deliveries,
} from "@/domains/instruments/communications/sendDigitalSettlementV2Deliveries";
import {
  DSI_REFERENCE,
} from "@/domains/instruments/definitions/digitalSettlementV1Definition";
import { prisma } from "@/infrastructure/db/prisma";

type RouteContext = {
  params: Promise<{
    reference: string;
  }>;
};

type Body = {
  accessExpiresHours?: number;
};

export async function POST(
  request: Request,
  context: RouteContext,
) {
  /*
   * Everything before this transaction is validation/authentication.
   * Everything after a successful transaction is post-commit delivery.
   *
   * Do not move external delivery into the transaction.
   */
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

    if (process.env.DSI_EMAIL_MODE !== "send") {
      return NextResponse.json(
        {
          ok: false,
          error: "DSI_LIVE_EMAIL_MODE_REQUIRED",
          detail:
            "V2 issuance is blocked unless DSI_EMAIL_MODE=send so all five private bearer links can be delivered immediately after commit.",
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

    const body = (await request.json()) as Body;

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

    const accessExpiresAt =
      new Date(
        Date.now() +
          expiresHours * 60 * 60 * 1000,
      );

    let issuance: Awaited<
      ReturnType<
        typeof issueDigitalSettlementV2FinancierRevisionWithClient
      >
    >;

    try {
      issuance = await prisma.$transaction(
        async (
          tx: DigitalSettlementV2FinancierRevisionIssuanceClient,
        ) =>
          issueDigitalSettlementV2FinancierRevisionWithClient({
            client: tx,
            instrumentReference: reference,
            actorUserId: actor.id,
            accessExpiresAt,
          }),
      );
    } catch (error) {
      const detail =
        error instanceof Error
          ? error.message
          : String(error);

      if (
        detail.includes(
          "DSI_V2_ISSUANCE_ALREADY_COMPLETED",
        )
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "DSI_V2_ALREADY_ISSUED_REQUIRES_DELIVERY_RECOVERY",
            detail:
              "Version 2 is already current. This initial-issuance route will not create replacement access grants. Use the governed delivery-recovery path instead.",
          },
          { status: 409 },
        );
      }

      console.error(
        "[DSI_V2_ISSUANCE_TRANSACTION_FAILED]",
        error,
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "DSI_V2_ISSUANCE_TRANSACTION_FAILED",
          detail,
        },
        { status: 500 },
      );
    }

    /*
     * Institutional truth is committed at this point.
     *
     * Any failure below MUST NOT be represented as an issuance
     * rollback or trigger automatic replacement grants.
     */

    const committedResult = {
      reference,
      version:
        issuance.supersession.versionNumber,
      transitioned:
        issuance.supersession.transitioned,
      accessGrants:
        issuance.grants.map((entry) => ({
          recipientKey:
            entry.key,
          recipientName:
            entry.recipientName,
          grantId:
            entry.grant.id,
          instrumentVersionId:
            entry.grant.instrumentVersionId,
          accessLevel:
            entry.grant.accessLevel,
          expiresAt:
            entry.grant.expiresAt,
        })),
    };

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://www.axpt.io";

    try {
      const deliveries =
        buildDigitalSettlementV2Deliveries({
          origin,
          grants:
            issuance.grants,
        });

      const requests =
        buildDigitalSettlementV2DeliveryRequests(
          deliveries,
        );

      const outcomes =
        await sendDigitalSettlementV2Deliveries(
          requests,
        );

      const deliveryComplete =
        outcomes.length === 5 &&
        outcomes.every(
          (outcome) =>
            outcome.ok,
        );

      return NextResponse.json({
        ok: true,
        committed: true,
        result: {
          ...committedResult,
          delivery: {
            ok:
              deliveryComplete,
            attempted:
              outcomes.length,
            succeeded:
              outcomes.filter(
                (outcome) =>
                  outcome.ok,
              ).length,
            failed:
              outcomes.filter(
                (outcome) =>
                  !outcome.ok,
              ).length,
            outcomes,
          },
        },
      });
    } catch (error) {
      console.error(
        "[DSI_V2_POST_COMMIT_DELIVERY_FAILED]",
        error,
      );

      return NextResponse.json({
        ok: true,
        committed: true,
        result: {
          ...committedResult,
          delivery: {
            ok: false,
            attempted: 0,
            succeeded: 0,
            failed: 5,
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
      "[DSI_V2_ISSUE_ROUTE_FAILED_PRECOMMIT]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        committed: false,
        error:
          "DSI_V2_ISSUE_ROUTE_FAILED",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 },
    );
  }
}
