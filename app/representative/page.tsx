import { redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import RepresentativeWorkspaceView from "./RepresentativeWorkspaceView";

export const dynamic = "force-dynamic";

export default async function RepresentativeWorkspacePage() {
  const principal = await getPrincipal();
  if (!principal) redirect("/login?next=/representative");
  return <RepresentativeWorkspaceView userId={principal.userId} />;
}
