import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import {
  buildGlobalMotherChamberOrientationPdf,
  renderGlobalMotherChamberOrientationEmail,
  sendGlobalMotherChamberOrientation,
} from "@/domains/instruments/communications/globalMotherChamberOrientation";
import { getDigitalSettlementSender } from "@/domains/instruments/communications/digitalSettlementSender";

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
  const recipientEmail =
    typeof input.recipientEmail === "string"
      ? input.recipientEmail.trim().toLowerCase()
      : "";

  if (
    !action ||
    !recipientEmail ||
    recipientEmail.length > 254 ||
    !recipientEmail.includes("@")
  ) {
    return reply({ error: "RECIPIENT_EMAIL_REQUIRED" }, 400);
  }

  if (
    action === "send" &&
    input.confirmation !== "SEND CHAMBER ORIENTATION"
  ) {
    return reply({ error: "CONFIRMATION_REQUIRED" }, 400);
  }

  const message = {
    recipientEmail,
  };

  if (action === "attachment") {
    const pdf = await buildGlobalMotherChamberOrientationPdf();

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'inline; filename="Chamber-Orientation-GM-KENYA-RCF-001-Chamber-V2.pdf"',
      },
    });
  }

  if (action === "preview") {
    const rendered = renderGlobalMotherChamberOrientationEmail(message);

    return reply({
      ok: true,
      from: getDigitalSettlementSender(),
      to: rendered.to,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
      attachment: {
        filename: "Chamber-Orientation-GM-KENYA-RCF-001-Chamber-V2.pdf",
        status: "READY_FOR_REVIEW",
      },
      privateCredentialIncluded: false,
    });
  }

  try {
    const delivery = await sendGlobalMotherChamberOrientation(message);

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
    console.error("[gm-v2/orientation] failed", error);

    return reply(
      {
        error:
          error instanceof Error
            ? error.message
            : "CHAMBER_ORIENTATION_SEND_FAILED",
      },
      500,
    );
  }
}
