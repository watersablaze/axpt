import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import { globalMotherV3Definition } from "@/domains/instruments/definitions/globalMotherV3Definition";
import { INSTRUMENT_EVENT_TYPE } from "@/domains/instruments/eventTypes";
import { runInstrumentGovernanceTransaction } from "@/domains/instruments/governance/runInstrumentGovernanceTransaction";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ error: "ORIGIN_REQUIRED" }, { status: 403 });
  const principal = await getPrincipal();
  if (!isAdmin(principal) || !principal)
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }
  const input = body && typeof body === "object" && !Array.isArray(body)
    ? body as Record<string, unknown> : null;
  if (!input || typeof input.grantId !== "string" ||
      !/^[a-z0-9]{10,40}$/.test(input.grantId) || input.confirmation !== "REVOKE V3 ACCESS")
    return NextResponse.json({ error: "CONFIRMATION_REQUIRED" }, { status: 400 });
  try {
    const revokedAt = await runInstrumentGovernanceTransaction(prisma, async tx => {
      const grant = await tx.instrumentAccessGrant.findUnique({
        where: { id: input.grantId as string },
        select: { id: true, instrumentId: true, instrumentVersionId: true,
          recipientUserId: true, revokedAt: true,
          instrument: { select: { reference: true } },
          instrumentVersion: { select: { number: true } },
        },
      });
      if (!grant || grant.instrument.reference !== globalMotherV3Definition.reference ||
          grant.instrumentVersion?.number !== globalMotherV3Definition.version) throw new Error("GRANT_NOT_FOUND");
      if (grant.revokedAt) return grant.revokedAt;
      const now = new Date();
      const changed = await tx.instrumentAccessGrant.updateMany({
        where: { id: grant.id, revokedAt: null }, data: { revokedAt: now },
      });
      if (changed.count !== 1) throw new Error("GRANT_CONCURRENT_CHANGE");
      await tx.domainEvent.create({ data: {
        streamType: "INSTITUTIONAL_INSTRUMENT", streamId: grant.instrumentId,
        eventType: INSTRUMENT_EVENT_TYPE.INSTRUMENT_ACCESS_REVOKED,
        payload: { accessGrantId: grant.id, instrumentVersionId: grant.instrumentVersionId,
          recipientUserId: grant.recipientUserId, revokedAt: now.toISOString() },
        metadata: { actorUserId: principal.userId, source: "gm-v2.operator.revoke" },
        occurredAt: now,
      } });
      return now;
    });
    return NextResponse.json({ ok: true, revokedAt: revokedAt.toISOString() });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "GRANT_NOT_FOUND") return NextResponse.json({ error: code }, { status: 404 });
    if (code === "GRANT_CONCURRENT_CHANGE") return NextResponse.json({ error: code }, { status: 409 });
    console.error("[gm-v2/revoke] failed", error);
    return NextResponse.json({ error: "REVOCATION_FAILED" }, { status: 500 });
  }
}
