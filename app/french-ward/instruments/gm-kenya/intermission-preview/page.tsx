import { notFound } from "next/navigation";

import { GlobalMotherIntermission } from "@/components/french-ward/gm/GlobalMotherIntermission";

export const dynamic = "force-dynamic";

export default function GlobalMotherIntermissionPreviewPage() {
  if (process.env.VERCEL_ENV === "production") {
    notFound();
  }

  return (
    <GlobalMotherIntermission
      recipientName="Chief Jamarú Wata Falkhan · Jamal James Ward"
    />
  );
}
