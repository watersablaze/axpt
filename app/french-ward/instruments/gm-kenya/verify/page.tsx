import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/infrastructure/db/prisma";
import { resolveGlobalMotherRecipient } from "@/domains/instruments/access/globalMotherRecipientAuth";
import { GM_PENDING_COOKIE } from "@/domains/instruments/access/globalMotherRecipientPolicy";
import { RecipientVerification } from "./RecipientVerification";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verify recipient access · AXPT", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function Page() {
  const token = (await cookies()).get(GM_PENDING_COOKIE)?.value;
  const access = token ? await resolveGlobalMotherRecipient(prisma, token) : null;
  if (!access) notFound();
  const [local, domain] = access.user.email.split("@");
  const emailHint = `${local.slice(0, 1)}•••@${domain}`;
  return <main className={styles.surface}>
    <section className={styles.card} aria-labelledby="recipient-title">
      <span className={styles.inscription}>AXPT · Private Institutional Framework</span>
      <h1 id="recipient-title">Framework of Royal Custodianship,<br />Restoration &amp; Global Trade</h1>
      <div className={styles.prepared}>
        <span>Prepared for</span>
        <h2>{access.grant.recipientName ?? access.user.displayName ?? "the named recipient"}</h2>
        <p className={styles.capacity}>{access.grant.representedInstitution}<br />{access.grant.representativeCapacity}</p>
      </div>
      <p className={styles.invitation}>You are formally invited to review the Framework.<br />Verify your access to enter the private chamber.</p>
      <RecipientVerification emailHint={emailHint} />
      <small>Private recipient access · Responses are submitted inside the chamber.</small>
    </section>
  </main>;
}
