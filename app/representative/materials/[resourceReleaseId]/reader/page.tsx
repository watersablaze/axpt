import CupReaderReady from "../../../CupReaderReady";
import CupPdfReader from "../../../CupPdfReader";
import { loadRepresentativeSupportingDocumentWithClient } from "@/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/loadRepresentativeSupportingDocumentWithClient";
import boundaries from "../../../resources/[resourceReleaseId]/operating-boundaries.module.css";
import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import { FrenchWardInstitutionalProfileView } from
  "@/components/french-ward/profile/FrenchWardInstitutionalProfileView";
import { InstrumentShell } from "@/components/instruments/InstrumentShell";
import { SourceAuthorityPresentation } from
  "@/components/instruments/source-authority/SourceAuthorityPresentation";
import { loadRepresentativeCommercialUtilityPackResourceWithClient } from
  "@/domains/instruments/representative-program/commercial-utility-pack/application/loadRepresentativeCommercialUtilityPackResourceWithClient";
import { loadRepresentativeCommercialUtilityPackInstitutionalResourceWithClient } from
  "@/domains/instruments/representative-program/commercial-utility-pack/application/loadRepresentativeCommercialUtilityPackInstitutionalResourceWithClient";
import { resolveRepresentativeCommercialUtilityPackConsumptionWithClient } from
  "@/domains/instruments/representative-program/commercial-utility-pack/application/resolveRepresentativeCommercialUtilityPackConsumptionWithClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function CupPublicationReader({ params, searchParams }: {
  params: Promise<{ resourceReleaseId: string }>;
  searchParams: Promise<{ previewParticipantId?: string | string[] }>;
}) {
  const { resourceReleaseId } = await params;
  const query = await searchParams;
  const previewParticipantId = query.previewParticipantId;
  if (!resourceReleaseId || resourceReleaseId.length > 191) notFound();
  const principal = await getPrincipal();
  if (!principal) redirect("/login?next=" + encodeURIComponent("/representative"));
  let userId = principal.userId;
  if (previewParticipantId !== undefined) {
    if (typeof previewParticipantId !== "string" || !previewParticipantId ||
        previewParticipantId.length > 191 || !isAdmin(principal)) notFound();
    const participant = await prisma.representativeProgramParticipant.findUnique({
      where: { id: previewParticipantId }, select: { userId: true },
    });
    if (!participant?.userId) notFound();
    userId = participant.userId;
  }
  const decision = await resolveRepresentativeCommercialUtilityPackConsumptionWithClient({
    client: prisma, userId, resourceReleaseId, action: "VIEW",
  });
  if (!decision.allowed) notFound();
  const input = { client: prisma, userId, resourceReleaseId };
  const api = previewParticipantId
    ? "/api/admin/representative-program/participants/" + encodeURIComponent(previewParticipantId) +
      "/workspace-preview/resources/" + encodeURIComponent(resourceReleaseId)
    : "/api/representative/commercial-utility-packs/resources/" + encodeURIComponent(resourceReleaseId);
  const supporting = await loadRepresentativeSupportingDocumentWithClient(input);
  if (supporting) return <main style={{ margin: 0, background: "#0b1b24", color: "#eef1e9" }}>
    <p style={{ padding: "12px 18px", margin: 0, fontSize: 12 }}>{supporting.publication.disclosureNote}</p>
    <CupPdfReader title={supporting.publication.title} href={api + "/supporting-document?mode=inline"} />
  </main>;
  const resource = await loadRepresentativeCommercialUtilityPackResourceWithClient(input);
  if (resource?.kind === "INSTITUTIONAL_PROFILE") return <main className="min-h-screen bg-[#0c1d25] p-4 text-[#eee7da]">
    <CupReaderReady />
    <FrenchWardInstitutionalProfileView profile={resource.content} packageReference={resource.packageReference} />
  </main>;
  if (resource?.kind === "OPERATING_BOUNDARIES") {
    const content = resource.content;
    return <main className={boundaries.page}><CupReaderReady /><article className={boundaries.record}>
      <h1 className={boundaries.title}>{content.title}</h1>
      <p className={boundaries.reference}>{content.reference} · Version {content.version}</p>
      <p className={boundaries.scope}>{content.scope}</p>
      <p className={boundaries.authority}>{content.authorityStatement}</p>
      {content.boundaries.map(boundary => <section key={boundary.key} className={boundaries.section}>
        <h2 className={boundaries.sectionTitle}>{boundary.title}</h2>
        <p className={boundaries.statement}>{boundary.statement}</p>
        <p className={boundaries.instruction}>{boundary.representativeInstruction}</p>
      </section>)}
    </article></main>;
  }
  const institutional = await loadRepresentativeCommercialUtilityPackInstitutionalResourceWithClient(input);
  if (institutional?.kind === "REPRESENTATIVE_PROGRAM_AGREEMENT") return <CupPdfReader fillViewport title="Executed Representative Agreement" href={api + "/document?mode=inline"} />;
  if (institutional?.kind !== "SOURCE_AUTHORITY" || institutional.presentation.audience !== "REPRESENTATIVE") notFound();
  const projection = institutional.presentation;
  const subject = projection.identity.subject;
  return <><CupReaderReady /><InstrumentShell eyebrow="Source Authority" classificationLabel="Governed Institutional Source Record"
    brandLabel={subject.displayName} title="Source Authority Instrument"
    subtitle={[subject.jurisdiction, subject.sector, subject.principalCommodityActivity.join(" · ")].join(" · ")}
    reference={projection.identity.instrumentReference} version={String(projection.identity.versionNumber)}
    status={projection.standing.replaceAll("_", " ")} movements={[]} showStatusRail={false}
    hideHero density="compact" surface="archival">
    <SourceAuthorityPresentation projection={projection} />
  </InstrumentShell></>;
}
