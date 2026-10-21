import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import { commercialPapers, COMMERCIAL_PAPER_KEYS } from "@/domains/instruments/representative-program/commercial-utility-pack/commercial-papers/catalog";
import { stageCommercialPapers } from "@/domains/instruments/representative-program/commercial-utility-pack/commercial-papers/stageCommercialPapers";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const id = z.string().trim().min(1).max(191);
const bodySchema = z.object({packageId: id, keys: z.array(z.enum(COMMERCIAL_PAPER_KEYS)).min(1).max(2)
  .refine(keys => new Set(keys).size === keys.length),
  expectedContentHashes: z.record(z.string(), z.string().regex(/^[a-f0-9]{64}$/)),
  confirmPreparedStatus: z.literal(true),
}).strict();
const headers = {"Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer"};
const json = (body: unknown, status: number) => NextResponse.json(body, {status, headers});
export async function GET(request: Request) {
  const principal = await getPrincipal();
  if (!principal) return json({ok: false}, 401);
  if (!isAdmin(principal)) return json({ok: false}, 403);
  const query = new URL(request.url).searchParams;
  if (query.getAll("packageId").length !== 1 || [...query.keys()].some(key => key !== "packageId")) return json({ok: false}, 400);
  const parsed = id.safeParse(query.get("packageId"));
  if (!parsed.success) return json({ok: false}, 400);
  try {
    const pack = await prisma.commercialUtilityPack.findUnique({where: {id: parsed.data},
      select: {id: true, participantId: true, version: true, state: true, releaseState: true, audience: true,
        modules: {select: {module: true, state: true}}}});
    const documents = pack?.modules.filter((entry: {module: string; state: string}) => entry.module === "DOCUMENTS");
    if (!pack || pack.version !== 1 || pack.audience !== "REPRESENTATIVE" ||
        !["PREPARING", "CURRENT"].includes(pack.state) || !["PARTIAL", "RELEASED"].includes(pack.releaseState) ||
        documents?.length !== 1 || documents[0].state !== "RELEASED") return json({ok: false, error: "COMMERCIAL_PAPER_PACKAGE_CONFLICT"}, 409);
    return json({ok: true, packageId: pack.id, participantId: pack.participantId,
      papers: commercialPapers().map(({content: _content, ...paper}) => ({...paper,
        previewHref: "/admin/representative-program/commercial-papers/" + paper.key + "?hash=" + paper.contentHash}))}, 200);
  } catch {return json({ok: false, error: "COMMERCIAL_PAPERS_UNAVAILABLE"}, 503);}
}
export async function POST(request: Request) {
  const principal = await getPrincipal();
  if (!principal) return json({ok: false}, 401);
  if (!isAdmin(principal)) return json({ok: false}, 403);
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ok: false}, 403);
  let body: unknown;
  try {const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > 4000) return json({ok: false}, 413);
    body = JSON.parse(text);
  } catch {return json({ok: false}, 400);}
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return json({ok: false}, 400);
  try {
    const result = await stageCommercialPapers({...parsed.data, client: prisma, actorUserId: principal.userId});
    return json({ok: true, result}, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "[CUP_COMMERCIAL_PAPER_ADMIN_REQUIRED]") return json({ok: false}, 403);
    const conflict = message.startsWith("[CUP_COMMERCIAL_PAPER_") ||
      (typeof error === "object" && error !== null && "code" in error && ["P2034", "P2010", "P2002"].includes(String(error.code)));
    return json({ok: false, error: conflict ? "COMMERCIAL_PAPER_STAGING_CONFLICT" : "COMMERCIAL_PAPER_STAGING_UNAVAILABLE"}, conflict ? 409 : 503);
  }
}
