import { notFound } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import ExternalImportWorkspace from "./ExternalImportWorkspace";

export const dynamic = "force-dynamic";

export default async function ExternalImportPage() {
  const principal = await getPrincipal();

  if (
    !principal?.roles.includes("ADMIN_PLATFORM") ||
    !principal.permissions.includes("ADMIN_SURFACE_ACCESS")
  ) {
    notFound();
  }

  return <ExternalImportWorkspace />;
}
