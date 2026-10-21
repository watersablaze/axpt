import PublicationReview from "../PublicationReview";
import { FrenchWardTransactionOverviewView } from "@/components/french-ward/transaction-overview/FrenchWardTransactionOverviewView";
import { TOV_PUBLICATION } from "@/domains/institutions/french-ward/tovPublication";
import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { commercialPapers } from "@/domains/instruments/representative-program/commercial-utility-pack/commercial-papers/catalog";
import CommercialPaperReview from "../../../../representative/CommercialPaperReview";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function CommercialPaperPreview({params, searchParams}: {
  params: Promise<{key: string}>; searchParams: Promise<{hash?: string | string[]; publicationHash?: string | string[]}>;
}) {
  const principal = await getPrincipal();
  if (!principal) redirect("/login?next=" + encodeURIComponent("/admin/representative-program"));
  if (!isAdmin(principal)) notFound();
  const {key} = await params, {hash, publicationHash} = await searchParams;
  const paper = commercialPapers().find(candidate => candidate.key === key);
  if (!paper || typeof hash !== "string" || hash !== paper.contentHash) notFound();
  if (paper.publicationHash && publicationHash !== paper.publicationHash) notFound();
  if (paper.key !== "TRANSACTION_OVERVIEW") return <CommercialPaperReview paper={paper} preview />;
  return <PublicationReview title={paper.title} reference={paper.reference} version={paper.version}
    status={paper.status} referenceStatus={paper.referenceStatus} contentHash={paper.contentHash} publicationHash={paper.publicationHash!}
    html={TOV_PUBLICATION.html}>
    <FrenchWardTransactionOverviewView />
  </PublicationReview>;
}
