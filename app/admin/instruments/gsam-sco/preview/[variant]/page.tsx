import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { getAdminFrozenGsamDocument } from "@/domains/instruments/transaction-documents/gsamRecipientFrozenDocument";
import { GsamFrozenDocumentViewer } from "@/components/french-ward/gsam-sco/GsamFrozenDocumentViewer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = {
  title: "GSAM SCO · Administration Document Preview",
  robots: { index: false, follow: false },
};

export default async function GsamAdminDocumentPreview({
  params,
}: {
  params: Promise<{ variant: string }>;
}) {
  const principal = await getPrincipal();

  if (!principal) {
    redirect(
      "/login?next=" +
      encodeURIComponent("/admin/instruments/gsam-sco/preview")
    );
  }

  if (!isAdmin(principal)) notFound();

  const { variant } = await params;
  if (variant !== "100-mt" && variant !== "1000-mt") notFound();

  const doc = await getAdminFrozenGsamDocument(variant, "html");
  if (!doc) notFound();

  return (
    <GsamFrozenDocumentViewer
      html={new TextDecoder().decode(doc.bytes)}
      quantityMt={variant === "100-mt" ? 100 : 1000}
      returnUrl="/admin/instruments/gsam-sco/preview"
    />
  );
}
