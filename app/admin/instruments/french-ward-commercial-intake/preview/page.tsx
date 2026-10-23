import {redirect, notFound} from "next/navigation";
import {getPrincipal} from "@/domains/auth/getPrincipal";
import {isAdmin} from "@/domains/auth/isAdmin";
import IntakePreview from "./IntakePreview";
import {FRENCH_WARD_COMMERCIAL_INTAKE} from "@/domains/institutions/french-ward/commercial";
export const dynamic = "force-dynamic";
export const metadata = {title:"French-Ward LOI · Administration Preview",robots:{index:false,follow:false}};
export default async function IntakeAdministrationPreview() {
 const principal = await getPrincipal();
 if (!principal) redirect("/login?next=%2Fadmin%2Finstruments%2Ffrench-ward-commercial-intake%2Fpreview");
 if (!isAdmin(principal)) notFound();
 return <IntakePreview reference={FRENCH_WARD_COMMERCIAL_INTAKE.reference} version={FRENCH_WARD_COMMERCIAL_INTAKE.version} />;
}
