import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { PERMISSIONS } from "@/domains/auth/permissions";
import { decideProfileAccessWithClient } from "@/domains/institutional-access/manageProfileAccessWithClient";
import { prisma } from "@/infrastructure/db/prisma";

export async function POST(request: Request) {
  const principal = await getPrincipal();
  if (!principal) {
    return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
  }
  if (!principal.permissions.includes(PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE)) {
    return NextResponse.json({ ok: false, error: "Not authorized" }, { status: 403 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const requestId = typeof input.requestId === "string" ? input.requestId.trim() : "";
  const reason = typeof input.reason === "string" ? input.reason.trim() : "";
  const decision = input.decision;
  if (!requestId || !reason || reason.length > 3000 ||
      (decision !== "APPROVED" && decision !== "DECLINED")) {
    return NextResponse.json({ ok: false, error: "Request, decision and reason required" }, { status: 400 });
  }

  const expiresAt = typeof input.expiresAt === "string"
    ? new Date(input.expiresAt) : undefined;
  if (decision === "APPROVED" &&
      (!expiresAt || !Number.isFinite(expiresAt.getTime()) || expiresAt <= new Date())) {
    return NextResponse.json({ ok: false, error: "Future expiration required" }, { status: 400 });
  }

  try {
    const result = await decideProfileAccessWithClient({
      client: prisma, actor: principal, requestId, decision, reason, expiresAt,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("MISSING_PERMISSION:")) {
      return NextResponse.json({ ok: false, error: "Not authorized" }, { status: 403 });
    }
    if (message === "ACCESS_REQUEST_RESOURCE_MISMATCH") {
      return NextResponse.json({ ok: false, error: "This request does not target the current Profile edition." }, { status: 409 });
    }
    if (message === "RECIPIENT_EMAIL_RECONCILIATION_REQUIRED") {
      return NextResponse.json({ ok: false, error: "Existing account email requires operator reconciliation." }, { status: 409 });
    }
    if (message === "ACCESS_REQUEST_NOT_PENDING" || message === "ACCESS_REQUEST_ALREADY_DECIDED") {
      return NextResponse.json({ ok: false, error: "Request is no longer pending." }, { status: 409 });
    }
    console.error("[institutional-access:profile-decision]", error);
    return NextResponse.json({ ok: false, error: "Decision could not be recorded." }, { status: 500 });
  }
}
