import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { PERMISSIONS } from "@/domains/auth/permissions";
import { prisma } from "@/infrastructure/db/prisma";
import { openAdminRepresentativeFieldRoomWithClient } from "@/domains/instruments/representative-program/communications/representativeFieldCommunications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
function failure(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status, headers });
}

function permittedOrigin(request: Request): boolean {
  const supplied = request.headers.get("origin");
  if (!supplied) return false;
  try {
    const origin = new URL(supplied);
    const target = new URL(request.url);
    if (origin.origin !== supplied) return false;
    if (origin.origin === target.origin) return true;
    const loopback = (host: string) =>
      host === "localhost" || host === "127.0.0.1" || host === "[::1]";
    return process.env.NODE_ENV === "development" &&
      origin.protocol === "http:" && target.protocol === "http:" &&
      loopback(origin.hostname) && loopback(target.hostname) &&
      origin.port === target.port;
  } catch {
    return false;
  }
}

export async function POST(request: Request, context: { params: Promise<{ participantId: string }> }) {
  if (!permittedOrigin(request)) return failure("Origin denied.", 403);
  const principal = await getPrincipal();
  if (!principal) return failure("Authentication required.", 401);
  if (!isAdmin(principal) || !principal.permissions.includes(PERMISSIONS.COMMUNICATIONS_ACCESS) ||
      !principal.permissions.includes(PERMISSIONS.COMMUNICATIONS_CONVERSATION_MANAGE)) {
    return failure("Field conversation management is unavailable for this session.", 403);
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return failure("JSON required.", 415);
  }
  const text = await request.text();
  if (text.length > 1024) return failure("Request too large.", 413);
  let body: unknown;
  try { body = JSON.parse(text); } catch { return failure("Invalid request.", 400); }
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== 0) {
    return failure("No request fields are accepted.", 400);
  }
  const { participantId } = await context.params;
  if (!/^[a-zA-Z0-9_-]{1,191}$/.test(participantId)) return failure("Invalid participant.", 400);
  try {
    const result = await openAdminRepresentativeFieldRoomWithClient({
      client: prisma, participantId, operatorUserId: principal.userId,
    });
    return NextResponse.json({ ok: true, ...result }, { headers });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "ARP_FIELD_OPERATOR_ACCESS_DENIED") return failure("Participant unavailable for this operator.", 403);
    if (code.startsWith("ARP_FIELD_")) return failure("This participant’s field room cannot be opened in its current state.", 409);
    const diagnostic = error as {
      name?: string;
      code?: string;
      meta?: { modelName?: string; table?: string };
    };
    console.error("[ARP_ADMIN_FIELD_ROOM_OPEN_FAILED]", {
      name: diagnostic?.name,
      code: diagnostic?.code,
      model: diagnostic?.meta?.modelName,
      table: diagnostic?.meta?.table,
    });
    return failure("Field conversation could not be opened. Retry safely.", 503);
  }
}
