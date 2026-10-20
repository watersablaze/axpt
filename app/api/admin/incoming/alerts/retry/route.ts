import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import { dispatchAdminIncomingAlertById } from "@/domains/admin-incoming/adminIncomingAlerts";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return new NextResponse(null, { status: 403 });
  const principal = await getPrincipal();
  if (!principal || !isAdmin(principal)) return new NextResponse(null, { status: 403 });
  const body = await request.formData();
  const id = Number(body.get("id"));
  if (!Number.isSafeInteger(id) || id <= 0) return new NextResponse(null, { status: 400 });
  try { await dispatchAdminIncomingAlertById(prisma, id); }
  catch { console.error("[ADMIN_INCOMING_ALERT_RETRY_FAILED]"); }
  return NextResponse.redirect(new URL("/admin/incoming/alerts", request.url), 303);
}
