import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {"Cache-Control": "private, no-store, max-age=0", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff"};
const json = (body: unknown, status: number) => NextResponse.json(body, {status, headers});
type RecordRow = {
  id: string; reference: string; candidateDisplayName: string; candidateEmail: string; status: string;
  admittedParticipant: {id: string; docketReference: string; displayName: string; standing: string;
    userId: string | null; user: {email: string | null} | null} | null;
};
/** Admin-only, read-only directory. No tokens, submissions, agreements or internal notes are returned. */
export async function GET(request: Request) {
  const principal = await getPrincipal();
  if (!principal) return json({ok: false, error: "UNAUTHORIZED"}, 401);
  if (!isAdmin(principal)) return json({ok: false, error: "FORBIDDEN"}, 403);
  const query = new URL(request.url).searchParams;
  if ([...query.keys()].some(key => !["q", "after"].includes(key)) ||
      query.getAll("q").length > 1 || query.getAll("after").length > 1) return json({ok: false}, 400);
  const q = (query.get("q") ?? "").trim(), after = query.get("after");
  if (q.length > 100 || (after !== null && (!after.trim() || after.length > 191))) return json({ok: false}, 400);
  try {
    const rows: RecordRow[] = await prisma.representativeOnboardingIntake.findMany({
      where: q ? {OR: [
        {candidateDisplayName: {contains: q, mode: "insensitive"}},
        {candidateEmail: {contains: q, mode: "insensitive"}},
        {reference: {contains: q, mode: "insensitive"}},
        {admittedParticipant: {is: {docketReference: {contains: q, mode: "insensitive"}}}},
        {admittedParticipant: {is: {user: {is: {email: {contains: q, mode: "insensitive"}}}}}},
      ]} : {},
      orderBy: [{createdAt: "desc"}, {id: "desc"}], take: 26,
      ...(after ? {cursor: {id: after}, skip: 1} : {}),
      select: {id: true, reference: true, candidateDisplayName: true, candidateEmail: true, status: true,
        admittedParticipant: {select: {id: true, docketReference: true, displayName: true, standing: true,
          userId: true, user: {select: {email: true}}}}},
    });
    const records = rows.slice(0, 25);
    return json({ok: true, records, nextCursor: rows.length > 25 ? records[records.length - 1].id : null}, 200);
  } catch {
    return json({ok: false, error: "ARP_RECORD_DIRECTORY_UNAVAILABLE"}, 503);
  }
}
