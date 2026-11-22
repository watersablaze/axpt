import { isSameOriginMutation } from "@/domains/auth/isSameOriginMutation";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import {
  cupResourcePermissionsSchema,
  reviewCommercialUtilityPackResourcePermissions,
  decideCommercialUtilityPackResourcePermissionsWithClient,
} from "@/domains/instruments/representative-program/commercial-utility-pack/application/decideCommercialUtilityPackResourcePermissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  resourceReleaseId: z.string().trim().min(1).max(191),
  reviewHash: z.string().regex(/^[a-f0-9]{64}$/),
  permissions: cupResourcePermissionsSchema,
  reason: z.string().trim().min(1).max(4000),
  confirmDecision: z.literal(true),
}).strict();

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};
const json = (body: unknown, status: number) =>
  NextResponse.json(body, { status, headers });

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "[CUP_PERMISSION_ADMIN_REQUIRED]") {
    return json({ ok: false }, 403);
  }
  if (message === "[CUP_PERMISSION_RESOURCE_REQUIRED]") {
    return json({ ok: false }, 404);
  }
  const conflict = message.startsWith("[CUP_PERMISSION_") ||
    (typeof error === "object" && error !== null &&
      "code" in error && error.code === "P2034");
  return json({
    ok: false,
    error: conflict ? "PERMISSION_DECISION_CONFLICT" : "PERMISSION_SERVICE_UNAVAILABLE",
  }, conflict ? 409 : 503);
}

export async function GET(request: Request) {
  const principal = await getPrincipal();
  if (!principal) return json({ ok: false }, 401);
  if (!isAdmin(principal)) return json({ ok: false }, 403);

  const query = new URL(request.url).searchParams;
  const resourceReleaseId = query.get("resourceReleaseId")?.trim();
  if (
    !resourceReleaseId || resourceReleaseId.length > 191 ||
    query.getAll("resourceReleaseId").length !== 1 ||
    [...query.keys()].some(key => key !== "resourceReleaseId")
  ) return json({ ok: false }, 400);

  try {
    const review = await reviewCommercialUtilityPackResourcePermissions({
      client: prisma, actorUserId: principal.userId, resourceReleaseId,
    });
    return json({ ok: true, review: {
      ...review.basis, reviewHash: review.reviewHash,
    } }, 200);
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  const principal = await getPrincipal();
  if (!principal) return json({ ok: false }, 401);
  if (!isAdmin(principal)) return json({ ok: false }, 403);
  if (!isSameOriginMutation(request)) {
    return json({ ok: false }, 403);
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return json({ ok: false }, 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return json({ ok: false }, 400);

  try {
    const result = await prisma.$transaction(async (tx: Parameters<typeof decideCommercialUtilityPackResourcePermissionsWithClient>[0]["client"]) =>
      decideCommercialUtilityPackResourcePermissionsWithClient({
        ...parsed.data, client: tx, actorUserId: principal.userId,
      }), {
        isolationLevel: "Serializable",
        maxWait: 10000,
        timeout: 30000,
      });
    return json({ ok: true, result }, 200);
  } catch (error) { return failure(error); }
}
