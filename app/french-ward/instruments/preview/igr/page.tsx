import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function InderakshTransactionPreviewPage() {
  redirect(
    "/french-ward/instruments/__preview__?previewMode=buyer&version=2",
  );
}
