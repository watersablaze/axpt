import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import { updateGeneralInquiryWithClient } from "@/domains/admin-incoming/generalInquiries";
export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ inquiryId: string }> }) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return new NextResponse(null, { status: 403 });
  const principal = await getPrincipal();
  if (!principal || !isAdmin(principal)) return new NextResponse(null, { status: 403 });
  const { inquiryId } = await context.params;
  if (!/^[a-f0-9-]{36}$/i.test(inquiryId)) return new NextResponse(null, { status: 400 });
  const redirect = new URL("/admin/incoming/general/" + inquiryId, request.url);
  try {
    const data = await request.formData();
    const revision = data.get("revision");
    if (typeof revision !== "string" || !/^\d+$/.test(revision)) throw new Error("INQUIRY_UPDATE_INVALID");
    await updateGeneralInquiryWithClient(prisma, { id: inquiryId, actorUserId: principal.userId, revision: Number(revision), status: String(data.get("status") || ""), note: String(data.get("note") || "") });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "INQUIRY_NOT_FOUND") return new NextResponse(null, { status: 404 });
    redirect.searchParams.set("error", message === "INQUIRY_UPDATE_CONFLICT" ? "conflict" : "update");
  }
  return NextResponse.redirect(redirect, 303);
}
