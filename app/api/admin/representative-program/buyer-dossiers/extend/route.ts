import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { PERMISSIONS } from "@/domains/auth/permissions";
import { isSameOriginMutation } from "@/domains/auth/isSameOriginMutation";
import { prisma } from "@/infrastructure/db/prisma";
import { extendRepresentativeBuyerDossierWithClient } from "@/domains/instruments/representative-program/commercial-utility-pack/application/extendRepresentativeBuyerDossierWithClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });
const requestSchema = z.object({
  dossierId: z.string().uuid(),
  days: z.union([z.literal(14), z.literal(30), z.literal(60)]),
  expectedExpiresAt: z.string().datetime(),
}).strict();

export async function POST(request: Request) {
  const principal = await getPrincipal();
  if (!principal) return json({ ok: false }, 401);
  if (!isAdmin(principal) ||
      !principal.permissions.includes(PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE)) {
    return json({ ok: false }, 403);
  }
  if (!isSameOriginMutation(request)) return json({ ok: false }, 403);
  let input: unknown;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 1000) return json({ ok: false }, 413);
    input = JSON.parse(raw);
  } catch { return json({ ok: false }, 400); }
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return json({ ok: false, error: "INVALID_EXTENSION" }, 400);
  try {
    const result = await extendRepresentativeBuyerDossierWithClient({
      client: prisma, operatorUserId: principal.userId, ...parsed.data,
    });
    return json({ ok: true, result });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    const allowed = ["BUYER_DOSSIER_EXTENSION_UNAVAILABLE", "BUYER_DOSSIER_EXTENSION_GRANT_CONFLICT",
      "BUYER_DOSSIER_EXTENSION_CONFLICT", "BUYER_DOSSIER_EXTENSION_LIMIT", "BUYER_DOSSIER_EXTENSION_INVALID"];
    return json({ ok: false, error: allowed.includes(reason) ? reason : "BUYER_DOSSIER_EXTENSION_FAILED" },
      allowed.includes(reason) ? 409 : 503);
  }
}
