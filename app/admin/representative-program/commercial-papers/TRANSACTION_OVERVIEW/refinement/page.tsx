import Link from "next/link";
import {headers} from "next/headers";
import {notFound,redirect} from "next/navigation";
import {getPrincipal} from "@/domains/auth/getPrincipal";
import {isAdmin} from "@/domains/auth/isAdmin";
import {prisma} from "@/infrastructure/db/prisma";
import {renderTovRepresentativeCopy} from "@/domains/institutions/french-ward/tovRepresentativeCopy";
import {reviewTovRepresentativeRevision} from "@/domains/instruments/representative-program/commercial-utility-pack/commercial-papers/reviseTovRepresentativeCopy";
import TovRevisionDecision from "./TovRevisionDecision";
export const dynamic="force-dynamic";export const runtime="nodejs";
export default async function TovRefinementPreview({searchParams}:{searchParams:Promise<{resourceReleaseId?:string}>}){
 const principal=await getPrincipal();if(!principal)redirect("/login");if(!isAdmin(principal))notFound();
 const {resourceReleaseId}=await searchParams;if(!resourceReleaseId||resourceReleaseId.length>191)notFound();
 const host=(await headers()).get("host")??"";const recordingEnabled=process.env.NODE_ENV==="production"&&["www.axpt.io","axpt.io"].includes(host);
 const review=await reviewTovRepresentativeRevision({client:prisma,resourceReleaseId}).catch(()=>null);if(!review)notFound();
 return <main className="fixed inset-0 z-[200] flex flex-col bg-[#0c151c] text-slate-200">
 <header className="flex max-h-[45dvh] shrink-0 flex-wrap items-center justify-between gap-2 overflow-auto border-b border-slate-500/40 px-4 py-2 text-xs">
 <p>TOV · Edition 01 · Publication revision 02 · {review.alreadyCurrent?"Recorded copy":"Review before adoption"}</p><Link href="/admin/representative-program" className="underline underline-offset-4">Back to ARP</Link>
 <details className="w-full text-[10px] text-slate-400"><summary>Publication identity</summary><p className="break-all">Currently released copy: {review.current.publicationHash}</p><p className="break-all">Reviewed representative copy: {review.copy.publicationHash}</p><p>Commercial content unchanged. Previous publication retained. Release and permissions remain separately governed.</p></details>
 <TovRevisionDecision resourceReleaseId={resourceReleaseId} reviewHash={review.reviewHash} publicationHash={review.copy.publicationHash} alreadyCurrent={review.alreadyCurrent} blocked={review.activeBuyerInvitations} recordingEnabled={recordingEnabled} />
 </header><iframe title="Reviewed TOV representative copy" sandbox="" srcDoc={renderTovRepresentativeCopy(review.copy.displayName)} className="min-h-0 w-full flex-1 border-0" /></main>;
}
