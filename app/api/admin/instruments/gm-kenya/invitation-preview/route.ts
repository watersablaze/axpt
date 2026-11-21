import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { renderGlobalMotherChamberInvitation } from "@/domains/instruments/communications/globalMotherChamberInvitation";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "ORIGIN_REQUIRED" }, { status: 403 });
  }

  const principal = await getPrincipal();

  if (!principal || !isAdmin(principal)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const values = input as Record<string, unknown>;

  const email =
    typeof values.email === "string" ? values.email.trim().toLowerCase() : "";

  const name = typeof values.name === "string" ? values.name.trim() : "";

  const institution =
    typeof values.institution === "string" ? values.institution.trim() : "";

  const capacity =
    typeof values.capacity === "string" ? values.capacity.trim() : "";

  if (
    email.length > 254 ||
    !email.includes("@") ||
    !name ||
    name.length > 160 ||
    !institution ||
    institution.length > 160 ||
    !capacity ||
    capacity.length > 160
  ) {
    return NextResponse.json(
      {
        error: "IDENTITY_AND_CAPACITY_REQUIRED",
      },
      { status: 400 },
    );
  }

  const rendered = renderGlobalMotherChamberInvitation({
    recipientName: name,
    recipientEmail: email,
    representedInstitution: institution,
    representativeCapacity: capacity,
    accessUrl: null,
  });

  return NextResponse.json(
    {
      ok: true,
      to: email,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
