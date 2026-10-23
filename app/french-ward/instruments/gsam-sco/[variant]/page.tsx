import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/infrastructure/db/prisma";
import { resolveInstitutionalAccessWithClient } from "@/domains/institutional-access/resolveInstitutionalAccessWithClient";
import { getGenericProgramSco } from "@/domains/institutions/french-ward/genericProgramScoVariants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Growthcorp | Soft Corporate Offer", robots: { index: false, follow: false } };

/** Preserve the existing View Online URL, but never render the live mutable canvas. */
export default async function GrowthcorpRecipientDocument({ params }: { params: Promise<{variant:string}> }) {
  const { variant } = await params;
  if (variant !== "100-mt" && variant !== "1000-mt") notFound();
  if (process.env.GSAM_SCO_RECIPIENT_RELEASE !== "enabled" ||
      process.env.GSAM_SCO_FROZEN_EDITION_V2_READY !== "enabled") notFound();
  const principal = await getPrincipal();
  if (!principal?.userId || !principal?.email) notFound();
  const program = getGenericProgramSco(variant === "100-mt" ? "gsam-100-mt" : "gsam-1000-mt");
  if (!program || program.presenter !== "GROWTHCORP") notFound();
  const access = await resolveInstitutionalAccessWithClient({
    client: prisma,
    identity: { userId: principal.userId, email: principal.email },
    scope: "SUPPORTING_DOCUMENT_VIEW", action: "VIEW",
    resourceReference: program.reference, resourceVersion: 1,
  });
  if (!access.allowed) notFound();
  redirect(`/api/french-ward/gsam-sco/${variant}/html`);
}
