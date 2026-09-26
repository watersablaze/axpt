import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { hashInstrumentAccessToken } from "@/domains/instruments/access/accessToken";
import {
  buildTransactionAudienceAccessEmails,
  sendTransactionAudienceAccessEmails,
} from "@/domains/instruments/communications/transactionAudienceAccessEmail";
import {
  DSI_PUBLIC_ID,
  DSI_REFERENCE,
} from "@/domains/instruments/definitions/digitalSettlementV1Definition";
import {
  DIGITAL_SETTLEMENT_V2_ACCESS_PLAN,
} from "@/domains/instruments/definitions/digitalSettlementV2AccessPlan";
import {
  DSI_V2_VERSION,
  type DigitalSettlementV2RecipientKey,
} from "@/domains/instruments/definitions/digitalSettlementV2FinancierRevision";
import {
  INDERAKSH_TRANSACTION_REFERENCE,
} from "@/domains/instruments/definitions/inderakshTransactionContinuity";
import {
  loadIssuedTransactionDocument,
} from "@/domains/instruments/transaction-documents/contracts";
import { prisma } from "@/infrastructure/db/prisma";

type RouteContext = {
  params: Promise<{ reference: string }>;
};

type Body = {
  action?: "preview" | "send";
  accessUrls?: Partial<
    Record<DigitalSettlementV2RecipientKey, string>
  >;
};

const recipientKeys =
  DIGITAL_SETTLEMENT_V2_ACCESS_PLAN.map(
    (entry) => entry.key,
  );

async function validateAudienceLinks(
  request: Request,
  accessUrls: Body["accessUrls"],
) {
  const requestOrigin = new URL(request.url).origin;
  const allowedOrigins = new Set([
    requestOrigin,
    "https://www.axpt.io",
  ]);

  const validated = {} as Record<
    DigitalSettlementV2RecipientKey,
    {
      accessUrl: string;
      grantId: string;
    }
  >;

  for (const plan of DIGITAL_SETTLEMENT_V2_ACCESS_PLAN) {
    const input = accessUrls?.[plan.key]?.trim();

    if (!input) {
      throw new Error(
        `[TRANSACTION_AUDIENCE_ACCESS_URL_REQUIRED] ${plan.key}`,
      );
    }

    let url: URL;

    try {
      url = new URL(input);
    } catch {
      throw new Error(
        `[TRANSACTION_AUDIENCE_ACCESS_URL_INVALID] ${plan.key}`,
      );
    }

    if (
      url.protocol !== "https:" ||
      !allowedOrigins.has(url.origin) ||
      url.search ||
      url.hash
    ) {
      throw new Error(
        `[TRANSACTION_AUDIENCE_ACCESS_URL_ORIGIN_INVALID] ${plan.key}`,
      );
    }

    const prefix =
      `/french-ward/instruments/${DSI_PUBLIC_ID}/access/`;

    if (!url.pathname.startsWith(prefix)) {
      throw new Error(
        `[TRANSACTION_AUDIENCE_ACCESS_URL_PATH_INVALID] ${plan.key}`,
      );
    }

    const token = decodeURIComponent(
      url.pathname.slice(prefix.length),
    ).trim();

    if (!token || token.includes("/")) {
      throw new Error(
        `[TRANSACTION_AUDIENCE_ACCESS_TOKEN_INVALID] ${plan.key}`,
      );
    }

    const grant =
      await prisma.instrumentAccessGrant.findUnique({
        where: {
          codeHash: hashInstrumentAccessToken(token),
        },
        select: {
          id: true,
          recipientName: true,
          recipientRole: true,
          accessLevel: true,
          revokedAt: true,
          expiresAt: true,
          instrument: {
            select: {
              reference: true,
              currentVersion: true,
            },
          },
          instrumentVersion: {
            select: {
              number: true,
            },
          },
        },
      });

    if (
      !grant ||
      grant.instrument.reference !== DSI_REFERENCE ||
      grant.instrument.currentVersion !== DSI_V2_VERSION ||
      grant.instrumentVersion?.number !== DSI_V2_VERSION ||
      grant.recipientName !== plan.recipientName ||
      grant.recipientRole !== plan.recipientRole ||
      grant.accessLevel !== plan.accessLevel ||
      grant.revokedAt ||
      (grant.expiresAt &&
        grant.expiresAt.getTime() <= Date.now())
    ) {
      throw new Error(
        `[TRANSACTION_AUDIENCE_ACTIVE_GRANT_NOT_CONFIRMED] ${plan.key}`,
      );
    }

    validated[plan.key] = {
      accessUrl: url.toString(),
      grantId: grant.id,
    };
  }

  if (
    Object.keys(validated).length !==
    recipientKeys.length
  ) {
    throw new Error(
      "[TRANSACTION_AUDIENCE_VALIDATION_COUNT_INVALID]",
    );
  }

  return validated;
}

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

    const { reference } = await context.params;

    if (reference !== INDERAKSH_TRANSACTION_REFERENCE) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "TRANSACTION_AUDIENCE_REFERENCE_NOT_ALLOWED",
        },
        { status: 400 },
      );
    }

    const body = (await request.json()) as Body;

    if (
      body.action !== "preview" &&
      body.action !== "send"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "TRANSACTION_AUDIENCE_ACTION_REQUIRED",
        },
        { status: 400 },
      );
    }

    const [spa, commercialSchedule] =
      await Promise.all([
        loadIssuedTransactionDocument(
          reference,
          "SPA",
        ),
        loadIssuedTransactionDocument(
          reference,
          "COMMERCIAL_SCHEDULE",
        ),
      ]);

    if (
      !spa ||
      !commercialSchedule ||
      spa.status !== "REVIEW" ||
      commercialSchedule.status !== "REVIEW"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "TRANSACTION_AUDIENCE_REVIEW_DOCUMENTS_NOT_READY",
        },
        { status: 409 },
      );
    }

    const validated =
      await validateAudienceLinks(
        request,
        body.accessUrls,
      );

    const accessUrls =
      Object.fromEntries(
        Object.entries(validated).map(
          ([key, value]) => [
            key,
            value.accessUrl,
          ],
        ),
      ) as Record<
        DigitalSettlementV2RecipientKey,
        string
      >;

    const grantIds =
      Object.fromEntries(
        Object.entries(validated).map(
          ([key, value]) => [
            key,
            value.grantId,
          ],
        ),
      ) as Record<
        DigitalSettlementV2RecipientKey,
        string
      >;

    if (body.action === "preview") {
      const messages =
        buildTransactionAudienceAccessEmails(
          accessUrls,
        );

      return NextResponse.json({
        ok: true,
        result: {
          deliveryMode:
            process.env.DSI_EMAIL_MODE === "send"
              ? "send"
              : "log",
          messages: messages.map((message) => ({
            key: message.key,
            to: message.recipient.email,
            recipientName:
              message.recipient.name,
            subject: message.subject,
            heading: message.heading,
            surface: message.surface,
            authority: message.authority,
            lines: message.lines,
            html: message.html,
          })),
        },
      });
    }

    if (process.env.DSI_EMAIL_MODE !== "send") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "TRANSACTION_AUDIENCE_LIVE_EMAIL_MODE_REQUIRED",
          detail:
            "Audience access email delivery is blocked until DSI_EMAIL_MODE=send.",
        },
        { status: 409 },
      );
    }

    const delivery =
      await sendTransactionAudienceAccessEmails({
        accessUrls,
        grantIds,
      });

    return NextResponse.json({
      ok: true,
      result: {
        delivery,
      },
    });
  } catch (error) {
    console.error(
      "[TRANSACTION_AUDIENCE_RELEASE_FAILED]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "TRANSACTION_AUDIENCE_RELEASE_FAILED",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 },
    );
  }
}
