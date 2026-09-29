import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import type { PrismaClient } from "@prisma/client";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import { hashInstrumentAccessToken } from "@/domains/instruments/access/accessToken";
import { globalMotherV2Definition } from "@/domains/instruments/definitions/globalMotherV2Definition";

type Client = Pick<PrismaClient, "instrumentAccessGrant" | "globalMotherRecipientChallenge" | "session" | "domainEvent">;

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const reply = (body: object, status = 200) => NextResponse.json(body, { status, headers });
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return reply({ error: "ORIGIN_REQUIRED" }, 403);
  const principal = await getPrincipal();
  if (!principal || !isAdmin(principal)) return reply({ error: "FORBIDDEN" }, 403);
  let input: Record<string, unknown>;
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    input = body as Record<string, unknown>;
  } catch { return reply({ error: "INVALID_PAYLOAD" }, 400); }
  if (typeof input.grantId !== "string" || !/^[a-z0-9]{10,40}$/.test(input.grantId) ||
      input.confirmation !== "REPLACE PRIVATE LINK")
    return reply({ error: "CONFIRMATION_REQUIRED" }, 400);
  try {
    const token = await prisma.$transaction(async (tx: Client) => {
      const grant = await tx.instrumentAccessGrant.findUnique({
        where: { id: input.grantId as string },
        select: { id: true, codeHash: true, instrumentId: true, instrumentVersionId: true,
          recipientUserId: true, revokedAt: true, expiresAt: true,
          instrument: { select: { reference: true, currentVersion: true } },
          instrumentVersion: { select: { number: true, status: true } } },
      });
      if (!grant || grant.instrument.reference !== globalMotherV2Definition.reference)
        throw new Error("GRANT_NOT_FOUND");
      const now = new Date();
      if (grant.revokedAt || !grant.expiresAt || grant.expiresAt <= now ||
          !grant.recipientUserId || grant.instrument.currentVersion !== 2 ||
          grant.instrumentVersion?.number !== 2 || grant.instrumentVersion.status !== "ISSUED")
        throw new Error("GRANT_NOT_ACTIVE");
      const replacement = randomBytes(32).toString("base64url");
      const changed = await tx.instrumentAccessGrant.updateMany({
        where: { id: grant.id, codeHash: grant.codeHash, revokedAt: null, expiresAt: { gt: now } },
        data: { codeHash: hashInstrumentAccessToken(replacement) },
      });
      if (changed.count !== 1) throw new Error("GRANT_CONCURRENT_CHANGE");
      await tx.globalMotherRecipientChallenge.deleteMany({ where: { grantId: grant.id } });
      await tx.session.updateMany({
        where: { userId: grant.recipientUserId, deviceInfo: `gm-grant:${grant.id}`, status: "active" },
        data: { status: "invalidated", invalidatedAt: now },
      });
      await tx.domainEvent.create({ data: {
        streamType: "INSTITUTIONAL_INSTRUMENT", streamId: grant.instrumentId,
        eventType: "INSTRUMENT_ACCESS_LINK_REPLACED",
        payload: { accessGrantId: grant.id, instrumentVersionId: grant.instrumentVersionId,
          recipientUserId: grant.recipientUserId, replacedAt: now.toISOString() },
        metadata: { actorUserId: principal.userId, source: "gm-v2.operator.replace-link" },
        occurredAt: now,
      } });
      return replacement;
    }, { maxWait: 10_000, timeout: 30_000 });
    return reply({ ok: true, privatePath: `/french-ward/instruments/gm-kenya/access/${token}` });
  } catch (cause) {
    const code = cause instanceof Error ? cause.message : "";
    if (code === "GRANT_NOT_FOUND") return reply({ error: code }, 404);
    if (code === "GRANT_NOT_ACTIVE" || code === "GRANT_CONCURRENT_CHANGE") return reply({ error: code }, 409);
    return reply({ error: "LINK_REPLACEMENT_FAILED" }, 500);
  }
}
