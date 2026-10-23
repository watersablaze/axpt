import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { PERMISSIONS } from "@/domains/auth/permissions";
import { prisma } from "@/infrastructure/db/prisma";
import { requestInstitutionalAccessWithClient } from "@/domains/institutional-access/manageInstitutionalAccessWithClient";

const recipient = {
  requesterName: "James Crawford",
  requesterEmail: "james.crawfordgcsam@protonmail.com",
  institutionalAffiliation: "Growthcorp Solutions Asset Management Limited",
  requesterCapacity: "Institutional document recipient",
};

const resources = [
  "GSAM-SCO-PROGRAM-100MT-2026-001",
  "GSAM-SCO-PROGRAM-1000MT-2026-001",
] as const;

export async function POST(request: Request) {
  const principal = await getPrincipal();

  if (!principal?.userId ||
      !principal.permissions.includes(PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE)) {
    return NextResponse.json(
      { ok: false, error: "OPERATOR_PERMISSION_REQUIRED" },
      { status: 403 }
    );
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  let validOrigin = false;

  if (origin && host) {
    try {
      const parsed = new URL(origin);
      const protocol =
        forwardedProto === "https" || forwardedProto === "http"
          ? forwardedProto
          : new URL(request.url).protocol.slice(0, -1);

      validOrigin =
        (parsed.protocol === "https:" || parsed.protocol === "http:") &&
        parsed.protocol === `${protocol}:` &&
        parsed.host === host &&
        !parsed.username &&
        !parsed.password;
    } catch {
      validOrigin = false;
    }
  }

  if (!validOrigin) {
    return NextResponse.json(
      { ok: false, error: "REQUEST_ORIGIN_MISMATCH" },
      { status: 403 }
    );
  }

  const existing = await prisma.institutionalAccessRequest.findMany({
    where: {
      requesterEmail: recipient.requesterEmail,
      resourceReference: { in: [...resources] },
      scope: "SUPPORTING_DOCUMENT_VIEW",
      resourceVersion: 1,
      status: { in: ["PENDING", "APPROVED"] },
    },
    select: { resourceReference: true },
  });

  const present = new Set(existing.map((row: { resourceReference: string }) => row.resourceReference));
  const prepared: string[] = [];

  for (const reference of resources) {
    if (present.has(reference)) continue;

    await requestInstitutionalAccessWithClient({
      client: prisma,
      ...recipient,
      purpose: "Operator-prepared GSAM SCO document review access",
      scope: "SUPPORTING_DOCUMENT_VIEW",
      resourceReference: reference,
      resourceVersion: 1,
    });

    prepared.push(reference);
  }

  return NextResponse.json({
    ok: true,
    prepared,
    alreadyPresent: resources.filter(ref => !prepared.includes(ref)),
  });
}
