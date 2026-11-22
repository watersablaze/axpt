import { TovPublicationView } from "@/components/french-ward/transaction-overview/TovPublicationView";
import { SupportingDocumentView } from "../../../../../representative/SupportingDocumentView";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/infrastructure/db/prisma";
import { loadRecipientBuyerDossierWithClient } from "@/domains/instruments/representative-program/commercial-utility-pack/application/loadRecipientBuyerDossierWithClient";
import { FrenchWardInstitutionalProfileView } from "@/components/french-ward/profile/FrenchWardInstitutionalProfileView";
import { InstrumentShell } from "@/components/instruments/InstrumentShell";
import { SourceAuthorityPresentation } from "@/components/instruments/source-authority/SourceAuthorityPresentation";
import styles from "../../../dossier.module.css";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata: Metadata = { title: "French-Ward — Publication", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function BuyerPublicationPage({ params }: { params: Promise<{ dossierId: string; itemId: string }> }) {
  const { dossierId, itemId } = await params;
  if (!itemId || itemId.length > 191) notFound();
  const principal = await getPrincipal();
  if (!principal) redirect("/login?next=" + encodeURIComponent(`/french-ward/dossiers/${encodeURIComponent(dossierId)}/publications/${encodeURIComponent(itemId)}`));
  const dossier = await loadRecipientBuyerDossierWithClient({ client: prisma, dossierId, userId: principal.userId, email: principal.email });
  const item = dossier?.items.find(entry => entry.id === itemId);
  if (!dossier || !item?.available || !item.publication) notFound();
  const publication = item.publication;
  const back = <nav className={styles.navigation} aria-label="Document navigation"><Link href={`/french-ward/dossiers/${encodeURIComponent(dossier.id)}`}>← Your documents</Link><span>{item.reference} · Edition {item.version}</span></nav>;
  if (publication.kind === "TRANSACTION_OVERVIEW") return <main className={styles.profile}>{back}<TovPublicationView html={publication.content.html} publicationRevision={publication.content.publicationRevision} /></main>;
  if (publication.kind === "INSTITUTIONAL_PROFILE") return <main className={styles.profile}>
    {back}<FrenchWardInstitutionalProfileView profile={publication.content} />
  </main>;
  if (publication.kind !== "SOURCE_AUTHORITY") {
    const content=publication.content;
    return <SupportingDocumentView title={content.title} reference={content.reference} version={content.version}
      note={content.disclosureNote} backHref={`/french-ward/dossiers/${encodeURIComponent(dossier.id)}`}
      documentHref={`/api/french-ward/dossiers/${encodeURIComponent(dossier.id)}/publications/${encodeURIComponent(item.id)}/document?mode=inline`} />;
  }
  const projection = publication.content;
  const subject = projection.identity.subject;
  return <InstrumentShell eyebrow="Source Authority" classificationLabel="Governed Institutional Source Record"
    brandLabel={subject.displayName} title="Source Authority Instrument"
    subtitle={[subject.jurisdiction, subject.sector, subject.principalCommodityActivity.join(" · ")].filter(Boolean).join(" · ")}
    reference={projection.identity.instrumentReference} version={String(projection.identity.versionNumber)}
    status={projection.standing.replaceAll("_", " ")} movements={[]} showStatusRail={false}
    hideHero density="compact" surface="archival">
    {back}<SourceAuthorityPresentation projection={projection} />
  </InstrumentShell>;
}
