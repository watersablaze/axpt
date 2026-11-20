import { NextResponse } from "next/server";
import { z } from "zod";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import {
  releaseCommercialUtilityPackModule,
} from "@/domains/instruments/representative-program/commercial-utility-pack";
import { prisma } from "@/infrastructure/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  packageId: z.string().trim().min(1).max(191),
  module: z.enum([
    "REPRESENTATION",
    "COMMERCIAL_PARAMETERS",
    "DOCUMENTS",
    "OPERATING_BOUNDARIES",
  ]),
  confirmRelease: z.literal(true),
}).strict();

function jsonNoStore(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(request: Request) {
  const principal = await getPrincipal();

  if (!principal) {
    return jsonNoStore({ ok: false, error: "UNAUTHORIZED" }, 401);
  }

  if (!isAdmin(principal)) {
    return jsonNoStore({ ok: false, error: "FORBIDDEN" }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonNoStore({ ok: false, error: "INVALID_JSON" }, 400);
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonNoStore({
      ok: false,
      error: "INVALID_COMMERCIAL_UTILITY_PACK_MODULE_RELEASE_REQUEST",
    }, 400);
  }

  try {
    const result = await releaseCommercialUtilityPackModule({
      client: prisma,
      packageId: parsed.data.packageId,
      module: parsed.data.module,
      actorUserId: principal.userId,
    });

    return jsonNoStore({
      ok: true,
      moduleRelease: {
        packageId: result.packageId,
        module: result.module,
        currentResourceCount: result.currentResourceCount,
        releasedResourceCount: result.releasedResourceCount,
        moduleTransitioned: result.moduleTransitioned,
        packageChanged: result.packageChanged,
        package: {
          id: result.package.id,
          reference: result.package.reference,
          state: result.package.state,
          releaseState: result.package.releaseState,
        },
      },
    }, 200);
  } catch (error) {
    const code = error instanceof Error
      ? /^\[([A-Z0-9_]+)\]/.exec(error.message)?.[1]
      : undefined;

    if (
      code === "CUP_RESOURCE_RELEASE_ADMIN_REQUIRED" ||
      code === "CUP_MODULE_TRANSITION_ADMIN_REQUIRED"
    ) {
      return jsonNoStore({ ok: false, error: "FORBIDDEN" }, 403);
    }

    if (
      code === "CUP_MODULE_RELEASE_APPLICATION_MODULE_NOT_FOUND" ||
      code === "CUP_MODULE_TRANSITION_PACKAGE_NOT_FOUND" ||
      code === "CUP_RELEASE_RECONCILIATION_PACKAGE_NOT_FOUND"
    ) {
      return jsonNoStore({
        ok: false,
        error: "COMMERCIAL_UTILITY_PACK_MODULE_NOT_FOUND",
      }, 404);
    }

    if (
      code &&
      (
        code.startsWith("CUP_MODULE_RELEASE_APPLICATION_") ||
        code.startsWith("CUP_RESOURCE_RELEASE_") ||
        code.startsWith("CUP_MODULE_TRANSITION_") ||
        code.startsWith("CUP_MODULE_RELEASE_REQUIRES_") ||
        code.startsWith("CUP_RELEASE_RECONCILIATION_")
      )
    ) {
      return jsonNoStore({
        ok: false,
        error: "COMMERCIAL_UTILITY_PACK_MODULE_RELEASE_CONFLICT",
        reason: code,
      }, 409);
    }

    console.error("[ARP_CUP_MODULE_RELEASE_FAILED]", error);
    return jsonNoStore({
      ok: false,
      error: "COMMERCIAL_UTILITY_PACK_MODULE_RELEASE_FAILED",
    }, 500);
  }
}
