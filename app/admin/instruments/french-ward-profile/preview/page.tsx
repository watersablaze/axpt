import {redirect, notFound} from "next/navigation";
import {getPrincipal} from "@/domains/auth/getPrincipal";
import {isAdmin} from "@/domains/auth/isAdmin";
import {projectFrenchWardInstitutionalProfile} from "@/domains/institutions/french-ward/projectFrenchWardInstitutionalProfile";
import ProfilePreview from "./ProfilePreview";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = {title: "French-Ward Profile · Administration Preview", robots: {index: false, follow: false}};
export default async function ProfileAdministrationPreview() {
  const principal = await getPrincipal();
  if (!principal) redirect("/login?next=%2Fadmin%2Finstruments%2Ffrench-ward-profile%2Fpreview");
  if (!isAdmin(principal)) notFound();
  const profile = projectFrenchWardInstitutionalProfile();
  return <ProfilePreview reference={profile.reference} version={profile.version} />;
}
