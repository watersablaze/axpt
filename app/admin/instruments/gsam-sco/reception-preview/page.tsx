import Link from "next/link";
import { redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { PERMISSIONS } from "@/domains/auth/permissions";
import { GsamRecipientRoomView } from "@/components/french-ward/gsam-sco/GsamRecipientRoomView";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "GSAM · James Crawford Reception Preview",
  robots: { index: false, follow: false },
};

/**
 * Operator-only presentation preview. Does not assume a recipient session,
 * create grants, read protected document bytes, or mutate issuance state.
 */
export default async function GsamRecipientAdminPreview() {
  const principal = await getPrincipal();
  if (!principal) {
    redirect("/login?next=%2Fadmin%2Finstruments%2Fgsam-sco%2Freception-preview");
  }
  if (!principal.permissions.includes(PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE)) {
    return <main>Access denied</main>;
  }

  return (
    <>
      <div style={{maxWidth: 960, margin: "22px auto 0", padding: "0 24px"}}>
        <Link href="/admin/instruments/gsam-sco/delivery">
          ← Back to GSAM Delivery Control
        </Link>
      </div>
      <GsamRecipientRoomView
        preview
        documents={[
          {
            slug: "100-mt",
            quantityMt: 100,
            allowed: true,
            pdfUrl: "",
            htmlUrl: "",
          },
          {
            slug: "1000-mt",
            quantityMt: 1000,
            allowed: true,
            pdfUrl: "",
            htmlUrl: "",
          },
        ]}
      />
    </>
  );
}
