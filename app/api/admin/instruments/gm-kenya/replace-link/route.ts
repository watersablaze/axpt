import { randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { PrismaClient } from "@prisma/client";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import { hashInstrumentAccessToken } from "@/domains/instruments/access/accessToken";
import { globalMotherV3Definition } from "@/domains/instruments/definitions/globalMotherV3Definition";
import { sendGlobalMotherChamberInvitation } from "@/domains/instruments/communications/globalMotherChamberInvitation";

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
  const sendInvitation = input.sendInvitation === true;
  try {
    const replacement = await prisma.$transaction(async (tx: Client) => {
      const grant = await tx.instrumentAccessGrant.findUnique({
        where: { id: input.grantId as string },
        select: { id: true, codeHash: true, instrumentId: true, instrumentVersionId: true,
          recipientUserId: true, recipientName: true, representedInstitution: true,
          representativeCapacity: true, revokedAt: true, expiresAt: true,
          recipientUser: { select: { email: true, displayName: true, name: true } },
          instrument: { select: { reference: true, currentVersion: true } },
          instrumentVersion: { select: { number: true, status: true } } },
      });
      if (!grant || grant.instrument.reference !== globalMotherV3Definition.reference)
        throw new Error("GRANT_NOT_FOUND");
      const now = new Date();
      if (grant.revokedAt || !grant.expiresAt || grant.expiresAt <= now ||
          !grant.recipientUserId || grant.instrument.currentVersion !== globalMotherV3Definition.version ||
          grant.instrumentVersion?.number !== globalMotherV3Definition.version || grant.instrumentVersion.status !== "ISSUED")
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
      return {
        token: replacement,
        grantId: grant.id,
        recipientName:
          grant.recipientName ??
          grant.recipientUser?.displayName ??
          grant.recipientUser?.name ??
          "Institutional participant",
        recipientEmail:
          grant.recipientUser?.email ?? "",
        representedInstitution:
          grant.representedInstitution ?? "",
        representativeCapacity:
          grant.representativeCapacity ?? "",
      };
    }, { maxWait: 10_000, timeout: 30_000 });

    const privatePath =
      `/french-ward/instruments/gm-kenya/access/${replacement.token}`;

    if (!sendInvitation) {
      return reply({ ok: true, privatePath });
    }

    if (
      !replacement.recipientEmail ||
      !replacement.representedInstitution ||
      !replacement.representativeCapacity
    ) {
      return reply({
        ok: true,
        privatePath,
        invitation: {
          ok: false,
          error: "RECIPIENT_EMAIL_OR_CAPACITY_MISSING",
        },
      });
    }

    try {
      const delivery =
        await sendGlobalMotherChamberInvitation({
          grantId:
            replacement.grantId,
          deliveryKey:
            randomUUID(),
          recipientName:
            replacement.recipientName,
          recipientEmail:
            replacement.recipientEmail,
          representedInstitution:
            replacement.representedInstitution,
          representativeCapacity:
            replacement.representativeCapacity,
          accessUrl:
            `${new URL(request.url).origin}${privatePath}`,
        });

      return reply({
        ok: true,
        privatePath,
        invitation: {
          ok: true,
          mode: delivery.mode,
          messageId: delivery.messageId,
        },
      });
    } catch (deliveryError) {
      console.error(
        "[gm-v2/replace-link] invitation delivery failed",
        deliveryError,
      );

      return reply({
        ok: true,
        privatePath,
        invitation: {
          ok: false,
          error: "INVITATION_SEND_FAILED",
        },
      });
    }
  } catch (cause) {
    const code = cause instanceof Error ? cause.message : "";
    if (code === "GRANT_NOT_FOUND") return reply({ error: code }, 404);
    if (code === "GRANT_NOT_ACTIVE" || code === "GRANT_CONCURRENT_CHANGE") return reply({ error: code }, 409);
    return reply({ error: "LINK_REPLACEMENT_FAILED" }, 500);
  }
}
