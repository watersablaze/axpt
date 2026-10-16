import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import { reviewSelectedCommercialUtilityPackAdditions, releaseSelectedCommercialUtilityPackAdditions } from "@/domains/instruments/representative-program/commercial-utility-pack/application/releaseSelectedCommercialUtilityPackAdditions";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const id = z.string().trim().min(1).max(191);
const selection = z.object({packageId: id, resourceReleaseIds: z.array(id).min(1).max(5)
  .refine(ids => new Set(ids).size === ids.length)}).strict();
const decision = selection.extend({reviewHash: z.string().regex(/^[a-f0-9]{64}$/),
  reason: z.string().trim().min(1).max(4000), confirmRelease: z.literal(true)}).strict();
const headers = {"Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer"};
const json = (body: unknown, status: number) => NextResponse.json(body, {status, headers});
function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "[CUP_ADDITION_ADMIN_REQUIRED]" || message === "[CUP_RESOURCE_RELEASE_ADMIN_REQUIRED]")
    return json({ok: false}, 403);
  const rawSerializationConflict = typeof error === "object" && error !== null &&
    "code" in error && error.code === "P2010" && "meta" in error &&
    typeof error.meta === "object" && error.meta !== null &&
    "code" in error.meta && error.meta.code === "40001";
  const conflict = rawSerializationConflict || message.startsWith("[CUP_ADDITION_") || message.startsWith("[CUP_RESOURCE_RELEASE_") ||
    (typeof error === "object" && error !== null && "code" in error && error.code === "P2034");
  return json({ok: false, error: conflict ? "ADDITIONS_RELEASE_CONFLICT" : "ADDITIONS_RELEASE_UNAVAILABLE"}, conflict ? 409 : 503);
}
export async function GET(request: Request) {
  const principal = await getPrincipal();
  if (!principal) return json({ok: false}, 401);
  if (!isAdmin(principal)) return json({ok: false}, 403);
  const query = new URL(request.url).searchParams;
  if (query.getAll("packageId").length !== 1 || [...query.keys()].some(key => !["packageId", "resourceReleaseId"].includes(key)))
    return json({ok: false}, 400);
  const parsed = selection.safeParse({packageId: query.get("packageId"), resourceReleaseIds: query.getAll("resourceReleaseId")});
  if (!parsed.success) return json({ok: false}, 400);
  try {
    const review = await reviewSelectedCommercialUtilityPackAdditions({...parsed.data, client: prisma, actorUserId: principal.userId});
    // Storage locators and raw metadata never enter the operator review payload.
    return json({ok: true, review: {packageId: review.pack.id, packageReference: review.pack.reference,
      participantId: review.pack.participantId, reviewHash: review.reviewHash,
      resources: review.resources.map(resource => ({id: resource.id, resourceId: resource.resourceId,
        label: resource.label, state: resource.state, canView: resource.canView, canDownload: resource.canDownload,
        canPresent: resource.canPresent, canTransmit: resource.canTransmit}))}}, 200);
  } catch (error) {return failure(error);}
}
export async function POST(request: Request) {
  const principal = await getPrincipal();
  if (!principal) return json({ok: false}, 401);
  if (!isAdmin(principal)) return json({ok: false}, 403);
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ok: false}, 403);
  let body: unknown;
  try {
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > 12000) return json({ok: false}, 413);
    body = JSON.parse(text);
  } catch {return json({ok: false}, 400);}
  const parsed = decision.safeParse(body);
  if (!parsed.success) return json({ok: false}, 400);
  try {
    const result = await releaseSelectedCommercialUtilityPackAdditions({...parsed.data, client: prisma, actorUserId: principal.userId});
    return json({ok: true, result}, 200);
  } catch (error) {return failure(error);}
}
