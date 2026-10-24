import { GsamRecipientRoomView } from "@/components/french-ward/gsam-sco/GsamRecipientRoomView";
import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/infrastructure/db/prisma";
import { resolveInstitutionalAccessWithClient } from "@/domains/institutional-access/resolveInstitutionalAccessWithClient";
import { genericProgramScoVariants } from "@/domains/institutions/french-ward/genericProgramScoVariants";
import { GSAM_SCO_REFERENCES } from "@/domains/institutional-access/gsamScoAccessResources";

export const dynamic = "force-dynamic";
export const metadata = { title: "Growthcorp | Your Commercial Documents", robots: { index: false, follow: false } };

export default async function GrowthcorpDocumentRoom() {
  // This room must not expose live source as a released edition.
  if (process.env.GSAM_SCO_RECIPIENT_RELEASE !== "enabled" ||
      process.env.GSAM_SCO_FROZEN_EDITION_V2_READY !== "enabled") notFound();
  const principal = await getPrincipal();
  if (!principal?.userId || !principal?.email) {
    redirect(
      "/login?next=" +
      encodeURIComponent("/french-ward/instruments/gsam-sco")
    );
  }
  const variants = [
    { slug: "100-mt", record: genericProgramScoVariants["gsam-100-mt"] },
    { slug: "1000-mt", record: genericProgramScoVariants["gsam-1000-mt"] },
  ];
  const permitted = await Promise.all(variants.map(async item => ({
    ...item,
    access: await resolveInstitutionalAccessWithClient({
      client: prisma, identity: { userId: principal.userId, email: principal.email },
      scope: "SUPPORTING_DOCUMENT_VIEW", action: "VIEW",
      resourceReference: `GSAM-SCO-PROGRAM-${item.record.quantityMt}MT-2026-002` as keyof typeof GSAM_SCO_REFERENCES, resourceVersion: 1,
    }),
  })));
  if (!permitted.some(item => item.access.allowed)) notFound();
  return (
    <GsamRecipientRoomView
      documents={permitted.map(item => ({
        slug: item.slug,
        quantityMt: item.record.quantityMt,
        allowed: item.access.allowed,
        pdfUrl: `/api/french-ward/gsam-sco/${item.slug}/pdf`,
        htmlUrl: `/french-ward/instruments/gsam-sco/${item.slug}`,
      }))}
    />
  );
}
