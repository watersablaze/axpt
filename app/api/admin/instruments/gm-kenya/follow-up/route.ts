import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { hashInstrumentAccessToken } from "@/domains/instruments/access/accessToken";
import {
  renderGlobalMotherChamberFollowUp,
  sendGlobalMotherChamberFollowUp,
} from "@/domains/instruments/communications/globalMotherChamberFollowUp";
import { globalMotherV4Definition } from "@/domains/instruments/definitions/globalMotherV4Definition";
import { prisma } from "@/infrastructure/db/prisma";

const DELIVERY_KEY = "RESPONSE_DELIBERATION_20261005";

const ACCESS_PREFIX = "/french-ward/instruments/gm-kenya/access/";

function reply(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return reply({ error: "ORIGIN_REQUIRED" }, 403);
  }

  const principal = await getPrincipal();

  if (!principal || !isAdmin(principal)) {
    return reply({ error: "FORBIDDEN" }, 403);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return reply({ error: "INVALID_PAYLOAD" }, 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return reply({ error: "INVALID_PAYLOAD" }, 400);
  }

  const input = body as Record<string, unknown>;

  const action =
    input.action === "preview" || input.action === "send" ? input.action : null;

  const grantId = typeof input.grantId === "string" ? input.grantId.trim() : "";

  const submittedAccessUrl =
    typeof input.accessUrl === "string" ? input.accessUrl.trim() : "";

  if (!action || !/^[a-z0-9]{10,40}$/.test(grantId) || !submittedAccessUrl) {
    return reply({ error: "FOLLOW_UP_INPUT_REQUIRED" }, 400);
  }

  if (action === "send" && input.confirmation !== "SEND CHAMBER FOLLOW-UP") {
    return reply({ error: "CONFIRMATION_REQUIRED" }, 400);
  }

  const grant = await prisma.instrumentAccessGrant.findUnique({
    where: {
      id: grantId,
    },
    select: {
      id: true,
      codeHash: true,
      recipientName: true,
      representedInstitution: true,
      representativeCapacity: true,
      revokedAt: true,
      expiresAt: true,
      recipientUser: {
        select: {
          email: true,
          displayName: true,
          name: true,
        },
      },
      instrument: {
        select: {
          reference: true,
          currentVersion: true,
        },
      },
      instrumentVersion: {
        select: {
          number: true,
          status: true,
        },
      },
    },
  });

  const now = new Date();

  if (
    !grant ||
    grant.instrument.reference !== globalMotherV4Definition.reference ||
    grant.instrument.currentVersion !== globalMotherV4Definition.version ||
    grant.instrumentVersion?.number !== globalMotherV4Definition.version ||
    grant.instrumentVersion.status !== "ISSUED" ||
    grant.revokedAt ||
    !grant.expiresAt ||
    grant.expiresAt <= now ||
    !grant.recipientUser?.email
  ) {
    return reply({ error: "ACTIVE_GRANT_REQUIRED" }, 409);
  }

  if (!grant.recipientName?.includes("Khan-Khan")) {
    return reply(
      { error: "RESPONSE_FOLLOW_UP_RECIPIENT_MISMATCH" },
      409,
    );
  }

  let accessUrl: URL;

  try {
    accessUrl = new URL(submittedAccessUrl);
  } catch {
    return reply({ error: "PRIVATE_ACCESS_URL_INVALID" }, 400);
  }

  const requestOrigin = new URL(request.url).origin;

  const allowedOrigins = new Set([
    requestOrigin,
    "https://axpt.io",
    "https://www.axpt.io",
    "https://axpt.vercel.app",
  ]);

  if (
    accessUrl.protocol !== "https:" ||
    !allowedOrigins.has(accessUrl.origin) ||
    !accessUrl.pathname.startsWith(ACCESS_PREFIX) ||
    accessUrl.search ||
    accessUrl.hash
  ) {
    return reply({ error: "PRIVATE_ACCESS_URL_INVALID" }, 400);
  }

  const token = decodeURIComponent(
    accessUrl.pathname.slice(ACCESS_PREFIX.length),
  ).trim();

  if (
    !token ||
    token.includes("/") ||
    hashInstrumentAccessToken(token) !== grant.codeHash
  ) {
    return reply({ error: "PRIVATE_ACCESS_DOES_NOT_MATCH_GRANT" }, 409);
  }

  const recipientName =
    grant.recipientName ??
    grant.recipientUser.displayName ??
    grant.recipientUser.name ??
    "Chamber Participant";

  const representedInstitution =
    grant.representedInstitution ?? "Institution not recorded";

  const representativeCapacity =
    grant.representativeCapacity ?? "Capacity not recorded";

  const message = {
    grantId: grant.id,
    recipientName,
    recipientEmail: grant.recipientUser.email,
    representedInstitution,
    representativeCapacity,
    accessUrl: accessUrl.toString(),
  };

  if (action === "preview") {
    const rendered = renderGlobalMotherChamberFollowUp(message);

    return reply({
      ok: true,
      to: message.recipientEmail,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    });
  }

  const delivery = await sendGlobalMotherChamberFollowUp({
    ...message,
    deliveryKey: DELIVERY_KEY,
  });

  return reply({
    ok: true,
    delivery: {
      ok: delivery.ok,
      mode: delivery.mode,
      alreadyDelivered: delivery.alreadyDelivered,
      messageId: delivery.messageId,
    },
  });
}
