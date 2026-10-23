import {renderFrenchWardProfileHtml} from "@/components/french-ward/profile/renderFrenchWardProfileHtml";
import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/infrastructure/db/prisma";
import { resolveRepresentativeCommercialUtilityPackConsumptionWithClient } from
  "@/domains/instruments/representative-program/commercial-utility-pack/application/resolveRepresentativeCommercialUtilityPackConsumptionWithClient";
import { loadRepresentativeCommercialUtilityPackResourceWithClient } from
  "@/domains/instruments/representative-program/commercial-utility-pack/application/loadRepresentativeCommercialUtilityPackResourceWithClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ resourceReleaseId: string }> },
) {
  const headers = {
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Content-Security-Policy":
      "default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  };

  const principal = await getPrincipal();
  if (!principal) return new NextResponse(null, { status: 401, headers });

  const { resourceReleaseId } = await context.params;
  if (!resourceReleaseId.trim() || resourceReleaseId.length > 191) {
    return new NextResponse(null, { status: 400, headers });
  }

  try {
    const decision =
      await resolveRepresentativeCommercialUtilityPackConsumptionWithClient({
        client: prisma,
        userId: principal.userId,
        resourceReleaseId,
        action: "DOWNLOAD",
      });

    if (!decision.allowed) {
      return new NextResponse(null, {
        status: decision.reason === "RESOURCE_UNAVAILABLE" ? 404 : 403,
        headers,
      });
    }

    const resource =
      await loadRepresentativeCommercialUtilityPackResourceWithClient({
        client: prisma,
        userId: principal.userId,
        resourceReleaseId,
      });

    if (!resource || resource.kind !== "INSTITUTIONAL_PROFILE") {
      return new NextResponse(null, { status: 404, headers });
    }

    const profile = resource.content;
    const html = await renderFrenchWardProfileHtml(profile);

    const filename =
      (profile.reference + "-v" + profile.version + ".html").replace(/[^a-zA-Z0-9._-]/g, "_");

    return new NextResponse(html, {
      headers: {
        ...headers,
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": 'attachment; filename="' + filename + '"',
      },
    });
  } catch {
    console.error("[REPRESENTATIVE_CUP_PROFILE_DOWNLOAD_FAILED]");
    return new NextResponse(null, { status: 503, headers });
  }
}
