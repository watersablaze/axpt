import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { loadRepresentativeWorkspace } from "@/domains/instruments/representative-program/application/loadRepresentativeWorkspace";
import CommercialIntakePresentation from "../../transaction-intake/CommercialIntakePresentation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function RepresentativeLoiPreview() {
  const principal = await getPrincipal();
  if (!principal) redirect("/login?next=%2Frepresentative%2Floi");
  const workspace = await loadRepresentativeWorkspace(principal.userId);
  if (!workspace) notFound();
  return <CommercialIntakePresentation allowed readOnly backHref="/representative" />;
}
