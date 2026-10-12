import { InstrumentShell } from "@/components/instruments/InstrumentShell";
import { SourceAuthorityPresentation } from "@/components/instruments/source-authority/SourceAuthorityPresentation";
import { resolveRepresentativeCommercialUtilityPackConsumptionWithClient } from
  "@/domains/instruments/representative-program/commercial-utility-pack/application/resolveRepresentativeCommercialUtilityPackConsumptionWithClient";
import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import {
  getPrincipal,
} from "@/domains/auth/getPrincipal";

import {
  prisma,
} from "@/infrastructure/db/prisma";

import {
  loadRepresentativeCommercialUtilityPackInstitutionalResourceWithClient,
} from "@/domains/instruments/representative-program/commercial-utility-pack/application/loadRepresentativeCommercialUtilityPackInstitutionalResourceWithClient";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

export default async function RepresentativeInstitutionalResourcePage({
  params,
}: {
  params:
    Promise<{
      resourceReleaseId: string;
    }>;
}) {
  const principal =
    await getPrincipal();

  const {
    resourceReleaseId,
  } =
    await params;

  if (!principal) {
    const next =
      `/representative/resources/` +
      `${encodeURIComponent(resourceReleaseId)}/institutional`;

    redirect(
      `/login?next=${encodeURIComponent(next)}`,
    );
  }

  const consumption =
    await resolveRepresentativeCommercialUtilityPackConsumptionWithClient({
      client: prisma,
      userId: principal.userId,
      resourceReleaseId,
      action: "VIEW",
    });

  if (!consumption.allowed) notFound();

  const resource =
    await loadRepresentativeCommercialUtilityPackInstitutionalResourceWithClient({
      client: prisma,
      userId:
        principal.userId,
      resourceReleaseId,
    });

  if (!resource) {
    notFound();
  }

  /*
   * Preserve the existing executed-agreement delivery path.
   *
   * This dispatcher only determines which governed institutional
   * presentation applies. It does not replace the agreement loader.
   */
  if (
    resource.kind ===
    "REPRESENTATIVE_PROGRAM_AGREEMENT"
  ) {
    redirect(
      `/api/representative/commercial-utility-packs/resources/` +
      `${encodeURIComponent(resource.resourceReleaseId)}/document`,
    );
  }

  if (
    resource.kind !== "SOURCE_AUTHORITY" ||
    resource.presentation.audience !== "REPRESENTATIVE"
  ) {
    notFound();
  }

  const projection = resource.presentation;
  const subject = projection.identity.subject;

  return (
    <InstrumentShell
      eyebrow="Source Authority"
      classificationLabel="Governed Institutional Source Record"
      brandLabel={subject.displayName}
      title="Source Authority Instrument"
      subtitle={[
        subject.jurisdiction,
        subject.sector,
        subject.principalCommodityActivity.join(" · "),
      ].join(" · ")}
      reference={projection.identity.instrumentReference}
      version={String(projection.identity.versionNumber)}
      status={projection.standing.replaceAll("_", " ")}
      movements={[]}
      showStatusRail={false}
      hideHero
      density="compact"
      surface="archival"
    >
      <nav aria-label="Representative resource navigation"
        className="px-6 py-4 text-sm text-[#514333]">
        <Link href="/representative"
          className="underline underline-offset-4">
          Back to Representative Workspace
        </Link>
        <p className="mt-2 break-words font-mono text-xs">
          {resource.packageReference}
        </p>
      </nav>

      <SourceAuthorityPresentation projection={projection} />

      <p className="px-6 py-6 text-sm leading-7 text-[#514333]">
        Resource access does not establish appointment or delegated
        authority. Permission to present or transmit this material
        remains separately governed by the Authorized Representation Program.
      </p>
    </InstrumentShell>
  );
}
