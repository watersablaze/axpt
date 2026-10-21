import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { commercialPapers } from "@/domains/instruments/representative-program/commercial-utility-pack/commercial-papers/catalog";
import CommercialPaperReview from "../../../../representative/CommercialPaperReview";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function CommercialPaperPreview({params, searchParams}: {
  params: Promise<{key: string}>; searchParams: Promise<{hash?: string | string[]}>;
}) {
  const principal = await getPrincipal();
  if (!principal) redirect("/login?next=" + encodeURIComponent("/admin/representative-program"));
  if (!isAdmin(principal)) notFound();
  const {key} = await params, {hash} = await searchParams;
  const paper = commercialPapers().find(candidate => candidate.key === key);
  if (!paper || typeof hash !== "string" || hash !== paper.contentHash) notFound();
  return <CommercialPaperReview paper={paper} preview />;
}
