import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { hashInstrumentAccessToken } from "@/domains/instruments/access/accessToken";
import {
  buildTransactionReviewReleaseEmail,
  sendTransactionReviewReleaseEmail,
} from "@/domains/instruments/communications/transactionReviewReleaseEmail";
import {
  DSI_PUBLIC_ID,
  DSI_REFERENCE,
} from "@/domains/instruments/definitions/digitalSettlementV1Definition";
import {
  DSI_V2_VERSION,
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
  accessUrl?: string;
};

async function resolveReviewReleaseContext(
  request: Request,
  reference: string,
  accessUrlInput: string,
) {
  if (reference !== INDERAKSH_TRANSACTION_REFERENCE) {
    throw new Error("[TRANSACTION_REVIEW_REFERENCE_NOT_ALLOWED]");
  }

  const [spa, commercialSchedule] = await Promise.all([
    loadIssuedTransactionDocument(reference, "SPA"),
    loadIssuedTransactionDocument(reference, "COMMERCIAL_SCHEDULE"),
  ]);

  if (
    !spa ||
    !commercialSchedule ||
    spa.status !== "REVIEW" ||
    commercialSchedule.status !== "REVIEW"
  ) {
    throw new Error(
      "[TRANSACTION_REVIEW_DOCUMENTS_NOT_READY]",
    );
  }

  let accessUrl: URL;

  try {
    accessUrl = new URL(accessUrlInput);
  } catch {
    throw new Error("[TRANSACTION_REVIEW_ACCESS_URL_INVALID]");
  }

  const requestOrigin = new URL(request.url).origin;
  const allowedOrigins = new Set([
    requestOrigin,
    "https://www.axpt.io",
  ]);

  if (
    accessUrl.protocol !== "https:" ||
    !allowedOrigins.has(accessUrl.origin) ||
    accessUrl.search ||
    accessUrl.hash
  ) {
    throw new Error(
      "[TRANSACTION_REVIEW_ACCESS_URL_ORIGIN_INVALID]",
    );
  }

  const prefix =
    `/french-ward/instruments/${DSI_PUBLIC_ID}/access/`;

  if (!accessUrl.pathname.startsWith(prefix)) {
    throw new Error(
      "[TRANSACTION_REVIEW_ACCESS_URL_PATH_INVALID]",
    );
  }

  const token = decodeURIComponent(
    accessUrl.pathname.slice(prefix.length),
  ).trim();

  if (!token || token.includes("/")) {
    throw new Error(
      "[TRANSACTION_REVIEW_ACCESS_TOKEN_INVALID]",
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

  const now = new Date();

  if (
    !grant ||
    grant.instrument.reference !== DSI_REFERENCE ||
    grant.instrument.currentVersion !== DSI_V2_VERSION ||
    grant.instrumentVersion?.number !== DSI_V2_VERSION ||
    grant.recipientName !== "Corey Keller" ||
    grant.accessLevel !== "VIEW" ||
    grant.revokedAt ||
    (grant.expiresAt &&
      grant.expiresAt.getTime() <= now.getTime())
  ) {
    throw new Error(
      "[TRANSACTION_REVIEW_ACTIVE_BUYER_ACCESS_NOT_CONFIRMED]",
    );
  }

  return {
    accessUrl: accessUrl.toString(),
    spa,
    commercialSchedule,
  } as const;
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
    const body = (await request.json()) as Body;
    const action = body.action;
    const accessUrl = body.accessUrl?.trim() ?? "";

    if (
      (action !== "preview" && action !== "send") ||
      !accessUrl
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "TRANSACTION_REVIEW_ACTION_AND_ACCESS_URL_REQUIRED",
        },
        { status: 400 },
      );
    }

    const resolved =
      await resolveReviewReleaseContext(
        request,
        reference,
        accessUrl,
      );

    const input = {
      accessUrl: resolved.accessUrl,
      spaVersion: resolved.spa.version,
      spaSha256: resolved.spa.sha256,
      commercialScheduleVersion:
        resolved.commercialSchedule.version,
      commercialScheduleSha256:
        resolved.commercialSchedule.sha256,
    } as const;

    if (action === "preview") {
      const preview =
        buildTransactionReviewReleaseEmail(input);

      return NextResponse.json({
        ok: true,
        result: {
          deliveryMode:
            process.env.DSI_EMAIL_MODE === "send"
              ? "send"
              : "log",
          releaseKey: preview.releaseKey,
          buyer: {
            to: preview.buyer.recipient.email,
            subject: preview.buyer.subject,
            heading: preview.buyer.heading,
            authority: preview.buyer.authority,
            lines: preview.buyer.lines,
          },
          internal: {
            to: preview.internal.recipients.map(
              (recipient) => recipient.email,
            ),
            subject: preview.internal.subject,
            heading: preview.internal.heading,
            authority: preview.internal.authority,
            lines: preview.internal.lines,
          },
          documents: {
            spa: {
              version: resolved.spa.version,
              sha256: resolved.spa.sha256,
            },
            commercialSchedule: {
              version:
                resolved.commercialSchedule.version,
              sha256:
                resolved.commercialSchedule.sha256,
            },
          },
        },
      });
    }

    if (process.env.DSI_EMAIL_MODE !== "send") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "TRANSACTION_REVIEW_LIVE_EMAIL_MODE_REQUIRED",
          detail:
            "Counterparty review release is blocked until DSI_EMAIL_MODE=send.",
        },
        { status: 409 },
      );
    }

    const delivery =
      await sendTransactionReviewReleaseEmail(input);

    return NextResponse.json({
      ok: true,
      result: {
        releaseKey: delivery.releaseKey,
        buyer: delivery.buyer,
        internal: delivery.internal,
      },
    });
  } catch (error) {
    console.error(
      "[TRANSACTION_REVIEW_RELEASE_ROUTE_FAILED]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "TRANSACTION_REVIEW_RELEASE_ROUTE_FAILED",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 },
    );
  }
}
