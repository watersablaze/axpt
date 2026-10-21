import Link from "next/link";
import styles from "./email-preview.module.css";
import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import { renderRepresentativeBuyerDossierMessage } from "@/domains/instruments/representative-program/commercial-utility-pack/application/deliverRepresentativeBuyerDossierWithClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function BuyerInvitationEmailPreview({searchParams}: {
  searchParams:Promise<{participantId?:string; channel?:string; loi?:string; width?:string}>;
}) {
  const principal=await getPrincipal();
  if(!principal) redirect("/login");
  if(!isAdmin(principal)) notFound();
  const query=await searchParams;
  if(!query.participantId || query.participantId.length>191) notFound();
  const participant=await prisma.representativeProgramParticipant.findUnique({
    where:{id:query.participantId},select:{displayName:true,user:{select:{email:true}}},
  });
  if(!participant?.user?.email) notFound();
  const channel=query.channel==="admin"?"admin":"recipient";
  const includeLoi=query.loi==="1";
  const mode=process.env.REPRESENTATIVE_BUYER_DOSSIER_EMAIL_MODE ??
    process.env.REPRESENTATIVE_PROFILE_INVITATION_EMAIL_MODE ??
    process.env.REPRESENTATIVE_ONBOARDING_EMAIL_MODE ?? "log";
  const safeMode=mode==="send"?"send":mode==="log"?"log":"invalid (sending blocked)";
  const from=process.env.FRENCH_WARD_EMAIL_FROM || process.env.REPRESENTATIVE_ONBOARDING_FROM_EMAIL || "French-Ward <french-ward@axpt.io>";
  const replyTo=process.env.REPRESENTATIVE_ONBOARDING_REPLY_TO_EMAIL || "french-ward@axpt.io";
  const message=renderRepresentativeBuyerDossierMessage({from,replyTo},{
    id:"PREVIEW-NOT-A-GRANT",participant,actor:{email:participant.user.email},
    recipientName:"Sample Buyer",recipientEmail:"buyer-preview@example.invalid",
    recipientOrganization:"Sample Buyer Organization",purpose:"Internal purpose example — not included in the buyer email.",
    expiresAt:new Date(Date.now()+7*86400000),
    loiAccessGrantId:includeLoi?"PREVIEW-NOT-A-GRANT":null,
    adminRecipients:(process.env.REPRESENTATIVE_PROFILE_ADMIN_EMAILS || "connect@axpt.io").split(","),
    items:[{label:"Gold Supply & Transaction Overview",resourceReference:"FW-TOV-2026-001",resourceVersion:1}],
  },channel);
  const mobile=query.width==="mobile";
  const link=(nextChannel:string,nextLoi:boolean,nextWidth=mobile?"mobile":"desktop")=>"?"+new URLSearchParams({participantId:query.participantId!,channel:nextChannel,loi:nextLoi?"1":"0",width:nextWidth}).toString();
  return <main className={styles.page}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>Correspondence review</p><h1>Buyer invitation</h1></div>
      <Link href="/admin/representative-program" className={styles.back}>Back to ARP</Link>
      <nav className={styles.navigation} aria-label="Email previews">
        <div>
          <Link href={link("recipient",includeLoi)} aria-current={channel==="recipient"?"page":undefined}>Buyer email</Link>
          <Link href={link("admin",includeLoi)} aria-current={channel==="admin"?"page":undefined}>Admin notification</Link>
        </div>
        <div>
          <Link href={link(channel,includeLoi,"desktop")} aria-current={!mobile?"page":undefined}>Desktop</Link>
          <Link href={link(channel,includeLoi,"mobile")} aria-current={mobile?"page":undefined}>Mobile</Link>
          <Link href={link(channel,!includeLoi)}>{includeLoi?"LOI included · Remove":"Include LOI"}</Link>
        </div>
      </nav>
      <div className={styles.status}><span>Read only · Sample buyer · Nothing sent</span><span>This runtime: {safeMode}</span></div>
      <details className={styles.details}><summary>Envelope and plain text</summary><div>
        <p>From: {message.from}</p><p>To: {message.to.join(", ")}</p><p>CC: {message.cc?.join(", ") || "None"}</p><p>Reply-to: {message.replyTo}</p>
        <pre>{message.text}</pre>
      </div></details>
    </header>
    <div className={styles.stage}>
      <section className={mobile?styles.mobile:styles.desktop} aria-label="Email presentation">
        <p className={styles.subject}><span>Subject</span> {message.subject}</p>
        <iframe title={channel==="recipient"?"Buyer invitation email":"Admin notification email"} sandbox="" srcDoc={message.html} />
      </section>
    </div>
  </main>;
}
