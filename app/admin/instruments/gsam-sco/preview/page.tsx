import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { GsamRecipientRoomView } from "@/components/french-ward/gsam-sco/GsamRecipientRoomView";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "GSAM Recipient Room · Administration Preview",
  robots: { index: false, follow: false },
};

export default async function GsamAdministrationPreview() {
  const principal = await getPrincipal();

  if (!principal) {
    redirect(
      "/login?next=%2Fadmin%2Finstruments%2Fgsam-sco%2Fpreview"
    );
  }

  if (!isAdmin(principal)) notFound();

  const documents = [
    { slug: "100-mt", quantityMt: 100 },
    { slug: "1000-mt", quantityMt: 1000 },
  ].map(item => ({
    ...item,
    allowed: true,
    pdfUrl: `/admin/instruments/gsam-sco/preview/${item.slug}/pdf`,
    htmlUrl: `/admin/instruments/gsam-sco/preview/${item.slug}/html`,
  }));

  return <GsamRecipientRoomView documents={documents} />;
}
