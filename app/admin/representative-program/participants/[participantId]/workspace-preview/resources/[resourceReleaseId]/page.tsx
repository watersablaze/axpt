import CommercialPaperReview from "../../../../../../../representative/CommercialPaperReview";
import { loadRepresentativeCommercialPaper } from "@/domains/instruments/representative-program/commercial-utility-pack/commercial-papers/loadRepresentativeCommercialPaper";
import { SupportingDocumentView } from "../../../../../../../representative/SupportingDocumentView";
import { loadRepresentativeSupportingDocumentWithClient } from "@/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/loadRepresentativeSupportingDocumentWithClient";
import boundaries from "../../../../../../../representative/resources/[resourceReleaseId]/operating-boundaries.module.css";
import Link from "next/link";
import ProfileUseControls from "../../../../../../../representative/ProfileUseControls";
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

export default async function OperatorResourcePreview({
  params,
}: {
  params: Promise<{ participantId: string; resourceReleaseId: string }>;
}) {
  const { participantId, resourceReleaseId } = await params;
  if (!participantId || participantId.length > 191 ||
      !resourceReleaseId || resourceReleaseId.length > 191) notFound();

  const base = "/admin/representative-program/participants/" +
    encodeURIComponent(participantId) + "/workspace-preview";
  const principal = await getPrincipal();
  if (!principal) redirect("/login?next=" + encodeURIComponent(base));
  if (!isAdmin(principal)) notFound();

  const participant = await prisma.representativeProgramParticipant.findUnique({
    where: { id: participantId },
    select: { userId: true, displayName: true },
  });
  if (!participant?.userId) notFound();

  const decision = await resolveRepresentativeCommercialUtilityPackConsumptionWithClient({
    client: prisma, userId: participant.userId, resourceReleaseId, action: "VIEW",
  });
  if (!decision.allowed) notFound();

  const input = {
    client: prisma, userId: participant.userId, resourceReleaseId,
  };
  const commercialPaper = await loadRepresentativeCommercialPaper(input);
  if (commercialPaper) return <CommercialPaperReview paper={commercialPaper} preview />;
  const supporting=await loadRepresentativeSupportingDocumentWithClient(input);
  if(supporting){const publication=supporting.publication;return <SupportingDocumentView
    title={publication.title} reference={publication.reference} version={publication.version} note={publication.disclosureNote}
    backHref={base} preview documentHref={`/api/admin/representative-program/participants/${encodeURIComponent(participantId)}/workspace-preview/resources/${encodeURIComponent(resourceReleaseId)}/supporting-document?mode=inline`} />;}
  const resource =
    await loadRepresentativeCommercialUtilityPackResourceWithClient(input);
  const institutional = resource ? null :
    await loadRepresentativeCommercialUtilityPackInstitutionalResourceWithClient(input);

  const navigation = (
    <nav className="px-6 py-4 text-sm" aria-label="Operator resource navigation">
      <p>Read-only operator preview · {participant.displayName}</p>
      <Link href={base} className="mt-2 inline-block underline underline-offset-4">
        Return to Workspace Preview
      </Link>
    </nav>
  );

  if (resource?.kind === "INSTITUTIONAL_PROFILE") {
    return <main className="min-h-screen bg-[#0c1d25] px-4 py-8 text-[#eee7da]">
      <div className="mx-auto max-w-7xl">
        {navigation}
        <ProfileUseControls
          resourceReleaseId={resourceReleaseId}
          readOnly
        />
        <FrenchWardInstitutionalProfileView
          profile={resource.content}
          packageReference={resource.packageReference}
        />
      </div>
    </main>;
  }


  if (resource?.kind === "OPERATING_BOUNDARIES") {
    const content = resource.content;
    return <main className={boundaries.page}>
      <div className={boundaries.frame}>
        {navigation}
        <article className={boundaries.record}>
          <h1 className={boundaries.title}>{content.title}</h1>
          <p className={boundaries.reference}>
            {content.reference} · Version {content.version}
          </p>
          <p className={boundaries.scope}>{content.scope}</p>
          <p className={boundaries.authority}>{content.authorityStatement}</p>
          {content.boundaries.map(boundary => <section
            key={boundary.key} className={boundaries.section}>
            <h2 className={boundaries.sectionTitle}>{boundary.title}</h2>
            <p className={boundaries.statement}>{boundary.statement}</p>
            <p className={boundaries.instruction}>
              {boundary.representativeInstruction}
            </p>
          </section>)}
        </article>
      </div>
    </main>;
  }

  if (institutional?.kind === "REPRESENTATIVE_PROGRAM_AGREEMENT") {
    redirect("/api/admin/representative-program/participants/" +
      encodeURIComponent(participantId) +
      "/workspace-preview/resources/" +
      encodeURIComponent(resourceReleaseId) + "/document?mode=inline");
  }

  if (institutional?.kind !== "SOURCE_AUTHORITY" ||
      institutional.presentation.audience !== "REPRESENTATIVE") notFound();

  const projection = institutional.presentation;
  const subject = projection.identity.subject;
  return <InstrumentShell
    eyebrow="Source Authority"
    classificationLabel="Governed Institutional Source Record"
    brandLabel={subject.displayName}
    title="Source Authority Instrument"
    subtitle={[subject.jurisdiction, subject.sector,
      subject.principalCommodityActivity.join(" · ")].join(" · ")}
    reference={projection.identity.instrumentReference}
    version={String(projection.identity.versionNumber)}
    status={projection.standing.replaceAll("_", " ")}
    movements={[]}
    showStatusRail={false}
    hideHero
    density="compact"
    surface="archival"
  >
    <div className="text-[#514333]">{navigation}</div>
    <SourceAuthorityPresentation projection={projection} />
  </InstrumentShell>;
}
