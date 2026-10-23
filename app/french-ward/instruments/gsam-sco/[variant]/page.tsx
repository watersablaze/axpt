import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/infrastructure/db/prisma";
import { resolveInstitutionalAccessWithClient } from "@/domains/institutional-access/resolveInstitutionalAccessWithClient";
import { getGenericProgramSco } from "@/domains/institutions/french-ward/genericProgramScoVariants";
import { getAuthorizedFrozenGsamDocument } from "@/domains/instruments/transaction-documents/gsamRecipientFrozenDocument";
import { GsamFrozenDocumentViewer } from "@/components/french-ward/gsam-sco/GsamFrozenDocumentViewer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = {
  title: "Growthcorp | Soft Corporate Offer",
  robots: { index: false, follow: false },
};

export default async function GrowthcorpRecipientDocument({
  params,
}: {
  params: Promise<{ variant: string }>;
}) {
  const { variant } = await params;

  if (variant !== "100-mt" && variant !== "1000-mt") notFound();

  if (
    process.env.GSAM_SCO_RECIPIENT_RELEASE !== "enabled" ||
    process.env.GSAM_SCO_FROZEN_EDITION_V2_READY !== "enabled"
  ) notFound();

  const principal = await getPrincipal();
  if (!principal?.userId || !principal?.email) {
    redirect(
      "/login?next=" +
      encodeURIComponent("/french-ward/instruments/gsam-sco")
    );
  }

  const program = getGenericProgramSco(
    variant === "100-mt" ? "gsam-100-mt" : "gsam-1000-mt"
  );

  if (!program || program.presenter !== "GROWTHCORP") notFound();

  const access = await resolveInstitutionalAccessWithClient({
    client: prisma,
    identity: { userId: principal.userId, email: principal.email },
    scope: "SUPPORTING_DOCUMENT_VIEW",
    action: "VIEW",
    resourceReference: program.reference,
    resourceVersion: 1,
  });

  if (!access.allowed) notFound();

  const doc = await getAuthorizedFrozenGsamDocument(variant, "html");
  if (!doc) notFound();

  return (
    <GsamFrozenDocumentViewer
      html={new TextDecoder().decode(doc.bytes)}
      quantityMt={program.quantityMt}
      returnUrl="/french-ward/instruments/gsam-sco"
    />
  );
}
