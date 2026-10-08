import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/infrastructure/db/prisma";
import { resolveRepresentativeCommercialUtilityPackConsumptionWithClient } from
  "@/domains/instruments/representative-program/commercial-utility-pack/application/resolveRepresentativeCommercialUtilityPackConsumptionWithClient";
import { loadRepresentativeCommercialUtilityPackResourceWithClient } from
  "@/domains/instruments/representative-program/commercial-utility-pack/application/loadRepresentativeCommercialUtilityPackResourceWithClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escape(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;",
  }[character]!));
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ resourceReleaseId: string }> },
) {
  const headers = {
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Content-Security-Policy":
      "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
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
    const section = (title: string, items: readonly string[], paragraphs = false) =>
      "<section><h2>" + escape(title) + "</h2>" +
      (paragraphs
        ? items.map(item => "<p>" + escape(item) + "</p>").join("")
        : "<ul>" + items.map(item => "<li>" + escape(item) + "</li>").join("") + "</ul>") +
      "</section>";

    const html = "<!doctype html><html lang=\"en\"><head>" +
      "<meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" +
      "<title>" + escape(profile.displayName) + " Institutional Profile</title>" +
      "<style>body{margin:0;background:#f5f1e8;color:#241f19;font:15px/1.65 Georgia,serif}" +
      "main{max-width:800px;margin:auto;padding:48px 32px}header{border-bottom:2px solid #8b7147;padding-bottom:24px}" +
      "h1{font-size:34px;line-height:1.15;margin:12px 0}h2{font-size:19px;color:#69502f}" +
      ".meta{font:12px/1.6 sans-serif;color:#665d50}section{margin-top:26px;padding-top:12px;border-top:1px solid #d3c8b6}" +
      "li{margin:7px 0}footer{margin-top:32px;border-top:1px solid #d3c8b6;padding-top:16px;font-size:12px}" +
      "@media print{body{background:white}main{padding:0}h2{break-after:avoid}p,li{orphans:3;widows:3}}</style>" +
      "</head><body><main><header><p class=\"meta\">" + escape(profile.legalName) + "</p>" +
      "<h1>Institutional Profile</h1><p>" + escape(profile.classification) + "</p>" +
      "<p class=\"meta\">" + escape(profile.reference) + " · Edition " + profile.version + "</p></header>" +
      "<p>" + escape(profile.publicDescription) + "</p><p>" + escape(profile.orientation) + "</p>" +
      section("Institutional Identity", profile.institutionalDefinition, true) +
      section("Fields of Activity", profile.domains) +
      section("Practice Areas", profile.practiceAreas) +
      section("Operating Principles", profile.operatingPrinciples) +
      "<section><h2>Operating Sequence</h2><ol>" +
      profile.operatingContinuum.map(item => "<li>" + escape(item) + "</li>").join("") +
      "</ol></section><footer>This profile describes French-Ward’s institutional activities. " +
      "Relationship-specific capacities and transaction terms are established by their applicable records and agreements." +
      "</footer></main></body></html>";

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
