import { NextResponse } from "next/server";
import type { PrismaClient } from "@prisma/client";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import {
  issueInstrumentAccessGrantWithClient,
  type InstrumentAccessGrantIssuanceClient,
} from "@/domains/instruments/commands/issueInstrumentAccessGrantWithClient";
import {
  revokeInstrumentAccessGrantWithClient,
  type InstrumentAccessGrantRevocationClient,
} from "@/domains/instruments/commands/revokeInstrumentAccessGrantWithClient";
import {
  DSI_PUBLIC_ID,
  DSI_REFERENCE,
} from "@/domains/instruments/definitions/digitalSettlementV1Definition";
import {
  DIGITAL_SETTLEMENT_V2_ACCESS_PLAN,
} from "@/domains/instruments/definitions/digitalSettlementV2AccessPlan";
import { DSI_V2_VERSION } from "@/domains/instruments/definitions/digitalSettlementV2FinancierRevision";
import { prisma } from "@/infrastructure/db/prisma";

type RouteContext = {
  params: Promise<{ reference: string }>;
};

type RotationClient =
  InstrumentAccessGrantIssuanceClient &
  InstrumentAccessGrantRevocationClient &
  Pick<PrismaClient, "institutionalInstrument" | "instrumentAccessGrant">;

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

    if (reference !== DSI_REFERENCE) {
      return NextResponse.json(
        { ok: false, error: "DSI_REFERENCE_NOT_ALLOWED" },
        { status: 400 },
      );
    }

    const actor = await prisma.user.findUnique({
      where: { email: principal.email },
      select: { id: true },
    });

    if (!actor) {
      return NextResponse.json(
        { ok: false, error: "DSI_OPERATOR_NOT_FOUND" },
        { status: 403 },
      );
    }

    const buyerPlan = DIGITAL_SETTLEMENT_V2_ACCESS_PLAN.find(
      (entry) => entry.key === "buyerRepresentative",
    );

    if (!buyerPlan) {
      return NextResponse.json(
        { ok: false, error: "DSI_BUYER_ACCESS_PLAN_NOT_FOUND" },
        { status: 500 },
      );
    }

    const expiresAt = new Date(
      Date.now() + 168 * 60 * 60 * 1000,
    );

    const rotation = await prisma.$transaction(
      async (tx: RotationClient) => {
        const instrument =
          await tx.institutionalInstrument.findUnique({
            where: { reference },
            select: {
              id: true,
              currentVersion: true,
              versions: {
                where: {
                  number: DSI_V2_VERSION,
                },
                select: {
                  id: true,
                  number: true,
                },
              },
            },
          });

        if (!instrument) {
          throw new Error(
            "[DSI_BUYER_ACCESS_INSTRUMENT_NOT_FOUND]",
          );
        }

        if (instrument.currentVersion !== DSI_V2_VERSION) {
          throw new Error(
            `[DSI_BUYER_ACCESS_VERSION_INVALID] ${instrument.currentVersion}`,
          );
        }

        const currentVersion = instrument.versions[0];

        if (!currentVersion) {
          throw new Error(
            "[DSI_BUYER_ACCESS_CURRENT_VERSION_NOT_FOUND]",
          );
        }

        const activeGrants =
          await tx.instrumentAccessGrant.findMany({
            where: {
              instrumentId: instrument.id,
              instrumentVersionId: currentVersion.id,
              recipientName: buyerPlan.recipientName,
              accessLevel: buyerPlan.accessLevel,
              revokedAt: null,
            },
            select: {
              id: true,
              instrumentVersionId: true,
            },
            orderBy: { issuedAt: "desc" },
          });

        if (activeGrants.length !== 1) {
          throw new Error(
            `[DSI_BUYER_ACCESS_ACTIVE_GRANT_COUNT_INVALID] ${activeGrants.length}`,
          );
        }

        const currentGrant = activeGrants[0];

        await revokeInstrumentAccessGrantWithClient({
          client: tx,
          accessGrantId: currentGrant.id,
          revokedByUserId: actor.id,
        });

        const replacement =
          await issueInstrumentAccessGrantWithClient({
            client: tx,
            instrumentReference: reference,
            instrumentVersionNumber: DSI_V2_VERSION,
            recipientName: buyerPlan.recipientName,
            recipientRole: buyerPlan.recipientRole,
            accessLevel: buyerPlan.accessLevel,
            issuedByUserId: actor.id,
            expiresAt,
          });

        if (
          !replacement.instrumentVersion ||
          replacement.instrumentVersion.number !== DSI_V2_VERSION ||
          replacement.grant.instrumentVersionId !==
            replacement.instrumentVersion.id
        ) {
          throw new Error(
            "[DSI_BUYER_ACCESS_REPLACEMENT_VERSION_BINDING_INVALID]",
          );
        }

        return {
          replacedGrantId: currentGrant.id,
          replacementGrantId: replacement.grant.id,
          token: replacement.token,
          expiresAt: replacement.grant.expiresAt,
        };
      },
    );

    const accessUrl = new URL(
      `/french-ward/instruments/${DSI_PUBLIC_ID}/access/${rotation.token}`,
      request.url,
    ).toString();

    return NextResponse.json({
      ok: true,
      result: {
        replacedGrantId: rotation.replacedGrantId,
        replacementGrantId: rotation.replacementGrantId,
        expiresAt: rotation.expiresAt,
        accessUrl,
      },
    });
  } catch (error) {
    console.error(
      "[DSI_BUYER_ACCESS_REISSUE_FAILED]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error: "DSI_BUYER_ACCESS_REISSUE_FAILED",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 },
    );
  }
}
