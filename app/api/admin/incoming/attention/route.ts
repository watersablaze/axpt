import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import { loadAdminAttention } from "@/domains/admin-incoming/loadAdminAttention";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
export async function GET() {
  const principal = await getPrincipal();
  if (!principal) return NextResponse.json({ ok: false }, { status: 401, headers });
  if (!isAdmin(principal)) return NextResponse.json({ ok: false }, { status: 403, headers });
  const { pending, field, checkedAt } = await loadAdminAttention(prisma, principal, false);
  return NextResponse.json({ ok: true, pending, field, checkedAt }, { headers });
}
