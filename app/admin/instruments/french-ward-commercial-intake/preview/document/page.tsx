import {redirect, notFound} from "next/navigation";
import {getPrincipal} from "@/domains/auth/getPrincipal";
import {isAdmin} from "@/domains/auth/isAdmin";
import CommercialIntakePresentation from "../../../../../transaction-intake/CommercialIntakePresentation";
import styles from "../intake-preview.module.css";
export const dynamic = "force-dynamic";
export const metadata = {title:"French-Ward LOI · Read-only Preview",robots:{index:false,follow:false}};
export default async function IntakeDocumentPreview({searchParams}: {searchParams: Promise<{interactive?: string | string[]}>}) {
 const principal = await getPrincipal();
 if (!principal) redirect("/login?next=%2Fadmin%2Finstruments%2Ffrench-ward-commercial-intake%2Fpreview");
 if (!isAdmin(principal)) notFound();
 const query = await searchParams;
 const interactivePreview = query.interactive === "1";
 return <div className={styles.document}><CommercialIntakePresentation allowed readOnly interactivePreview={interactivePreview} showPreviewNotice={false} backHref="/admin/instruments/french-ward-commercial-intake/preview" /></div>;
}
