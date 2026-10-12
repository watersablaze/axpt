import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import {
  renderGlobalMotherChamberV2Continuation,
  sendGlobalMotherChamberV2Continuation,
} from "@/domains/instruments/communications/globalMotherChamberV2Continuation";
import { buildGlobalMotherKhanKhanOrientationPdf } from "@/domains/instruments/communications/globalMotherKhanKhanOrientation";
import { getDigitalSettlementSender } from "@/domains/instruments/communications/digitalSettlementSender";
import { globalMotherV4Definition } from "@/domains/instruments/definitions/globalMotherV4Definition";
import { prisma } from "@/infrastructure/db/prisma";

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
    input.action === "preview" ||
    input.action === "attachment" ||
    input.action === "send"
      ? input.action
      : null;
  const grantId = typeof input.grantId === "string" ? input.grantId.trim() : "";

  if (!action || !/^[a-z0-9]{10,40}$/.test(grantId)) {
    return reply({ error: "V2_CONTINUATION_INPUT_REQUIRED" }, 400);
  }

  if (
    action === "send" &&
    input.confirmation !== "SEND CHAMBER V2 CONTINUATION"
  ) {
    return reply({ error: "CONFIRMATION_REQUIRED" }, 400);
  }

  const grant = await prisma.instrumentAccessGrant.findUnique({
    where: { id: grantId },
    select: {
      id: true,
      recipientName: true,
      representedInstitution: true,
      representativeCapacity: true,
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
        },
      },
      instrumentVersion: {
        select: {
          number: true,
        },
      },
    },
  });

  if (
    !grant ||
    grant.instrument.reference !== globalMotherV4Definition.reference ||
    grant.instrumentVersion?.number !== globalMotherV4Definition.version ||
    !grant.recipientUser?.email ||
    !grant.recipientName?.includes("Khan-Khan")
  ) {
    return reply({ error: "KHAN_KHAN_V1_GRANT_REQUIRED" }, 409);
  }

  const recipientName =
    grant.recipientName ??
    grant.recipientUser.displayName ??
    grant.recipientUser.name ??
    "Imperial Khan-Khan";

  const message = {
    grantId: grant.id,
    recipientName,
    recipientEmail: grant.recipientUser.email,
    representedInstitution:
      grant.representedInstitution ?? "Ahma Olmec Tartarian Government",
    representativeCapacity:
      grant.representativeCapacity ?? "Imperial Khan-Khan",
  };

  if (action === "attachment") {
    const pdf = await buildGlobalMotherKhanKhanOrientationPdf();

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'inline; filename="Chamber-V2-Orientation-Khan-Khan-GM-KENYA-RCF-001.pdf"',
      },
    });
  }

  if (action === "preview") {
    const rendered = renderGlobalMotherChamberV2Continuation(message);

    return reply({
      ok: true,
      from: getDigitalSettlementSender(),
      to: rendered.to,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
      privateCredentialIncluded: false,
      attachment: {
        filename: "Chamber-V2-Orientation-Khan-Khan-GM-KENYA-RCF-001.pdf",
        status: "READY_FOR_REVIEW",
      },
    });
  }

  try {
    const delivery = await sendGlobalMotherChamberV2Continuation(message);

    return reply({
      ok: true,
      delivery: {
        ok: delivery.ok,
        mode: delivery.mode,
        alreadyDelivered: delivery.alreadyDelivered,
        messageId: delivery.messageId,
      },
    });
  } catch (error) {
    console.error("[gm-v2/continuation] failed", error);

    return reply(
      {
        error:
          error instanceof Error
            ? error.message
            : "CHAMBER_V2_CONTINUATION_SEND_FAILED",
      },
      500,
    );
  }
}
