import "server-only";
import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";
import { GSAM_SCO_REFERENCES } from "./gsamScoAccessResources";

export const GSAM_EMAIL = "james.crawfordgcsam@protonmail.com";
export const GSAM_URL = "https://www.axpt.io/login?next=%2Ffrench-ward%2Finstruments%2Fgsam-sco";
export const GSAM_DELIVERY_KEY = "GSAM-SCO-JAMES-2026-001";
const subject = "French-Ward | Gold Soft Corporate Offer Documents";
const escape = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

export function renderGsamEmail() {
 const body = "French-Ward Administration is pleased to provide access to the Gold Soft Corporate Offer documents prepared for Growthcorp Solutions Asset Management Limited. The 100 Metric Ton and 1,000 Metric Ton program editions are available for your institutional review.";
 const text = ["Dear Mr. Crawford,", "", body, "", "Access Secure Document Room:", GSAM_URL, "", "Sign in using this email address and request a one-time verification code. Your existing document access requires no additional request.", "", "Please advise us if you experience any difficulty accessing the materials.", "", "Respectfully,", "French-Ward Administration", "French-Ward, Inc."].join("\n");
 const href = escape(GSAM_URL);
 const html = `<!doctype html><html lang="en"><body style="margin:0;padding:0;background:#11110f;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#11110f"><tr><td align="center" style="padding:32px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#f4efe3;border:1px solid #5c5342"><tr><td style="background:#1b1915;padding:27px 30px;border-top:3px solid #c9a45e"><p style="margin:0;color:#d3b477;font-size:10px;letter-spacing:2px;text-transform:uppercase">French-Ward · Institutional Correspondence</p><h1 style="color:#f4efe3;font-family:Georgia,serif;font-weight:400;font-size:27px;line-height:1.3;margin:14px 0 0">Gold Soft Corporate Offer Documents</h1></td></tr><tr><td style="padding:30px;color:#28251f"><p style="margin:0 0 14px;font-size:14px">Dear Mr. Crawford,</p><p style="font-size:14px;line-height:1.75">${escape(body)}</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #c9bfae;border-bottom:1px solid #c9bfae;margin:22px 0"><tr><td style="padding:16px 0;font-size:13px;line-height:2">100 Metric Tons<br>1,000 Metric Tons</td></tr></table><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#b99657"><a href="${href}" style="display:inline-block;color:#151713;text-decoration:none;font-size:12px;font-weight:bold;padding:16px 20px">Access Secure Document Room</a></td></tr></table><p style="font-size:12px;line-height:1.7;margin-top:23px">Sign in with this email address and request your one-time verification code. Your document access has already been arranged.</p><p style="font-size:11px;line-height:1.6;word-break:break-all">If the button does not work, open: <a style="color:#5d5235" href="${href}">${href}</a></p><p style="font-size:13px;line-height:1.7">Please advise us if you experience any difficulty accessing the materials.</p><p style="font-size:13px;line-height:1.7">Respectfully,<br><strong>French-Ward Administration</strong></p></td></tr><tr><td style="background:#1b1915;padding:16px 30px;color:#c2b7a4;font-size:11px">French-Ward, Inc. · Institutional environment via AXPT</td></tr></table></td></tr></table></body></html>`;
 return {subject,text,html};
}

export async function verifyGsamDeliveryGrants() {
 const references = Object.entries(GSAM_SCO_REFERENCES);
 const now = new Date();
 const grants = await prisma.institutionalAccessGrant.findMany({where:{recipientEmail:GSAM_EMAIL,scope:"SUPPORTING_DOCUMENT_VIEW",revokedAt:null,issuedAt:{lte:now},expiresAt:{gt:now},recipient:{email:GSAM_EMAIL},request:{status:"APPROVED",requesterEmail:GSAM_EMAIL}},select:{id:true,recipientUserId:true,resourceReference:true,resourceVersion:true,request:{select:{requesterName:true,institutionalAffiliation:true,resourceReference:true,resourceVersion:true,scope:true}}}});
 const matched = references.map(([ref,version])=>grants.find((g: { id: string; recipientUserId: string; resourceReference: string; resourceVersion: number; request: { resourceReference: string; resourceVersion: number; scope: string; requesterName: string; institutionalAffiliation: string } })=>g.resourceReference===ref && g.resourceVersion===version && g.request.resourceReference===ref && g.request.resourceVersion===version && g.request.scope==="SUPPORTING_DOCUMENT_VIEW" && g.request.requesterName.trim().toLowerCase()==="james crawford" && g.request.institutionalAffiliation.trim().toLowerCase()==="growthcorp solutions asset management limited"));
 if(matched.some(g=>!g) || new Set(matched.map(g=>g?.recipientUserId)).size!==1) throw new Error("GSAM_RECIPIENT_GRANTS_NOT_READY");
 return matched.map(g=>g!.id);
}

export async function sendGsamInvitation(actorUserId:string) {
 const grantIds = await verifyGsamDeliveryGrants();
 // Database unique key is the durable one-time delivery claim. Never release claim automatically on uncertain provider outcomes.
 let delivery;
 try {
   delivery=await prisma.gsamEmailDelivery.create({data:{key:GSAM_DELIVERY_KEY,recipientEmail:GSAM_EMAIL,grantIds,actorUserId,status:"SENDING"}});
 } catch(error) {
   const existing=await prisma.gsamEmailDelivery.findUnique({where:{key:GSAM_DELIVERY_KEY}});
   if(existing) return {status:existing.status,messageId:existing.messageId,alreadyAttempted:true};
   throw error;
 }
 const {subject,text,html}=renderGsamEmail();
 const from=process.env.DSI_FROM_EMAIL || process.env.FRENCH_WARD_EMAIL_FROM || process.env.RESEND_FROM_EMAIL;
 if(!from || !process.env.RESEND_API_KEY){
   await prisma.gsamEmailDelivery.update({where:{id:delivery.id},data:{status:"FAILED",error:"MAIL_CONFIGURATION_UNAVAILABLE"}});
   throw new Error("MAIL_CONFIGURATION_UNAVAILABLE");
 }
 let status="DELIVERY_UNKNOWN",messageId:string|null=null,error:string|null=null;
 try {
   const response=await resend.emails.send({from,to:GSAM_EMAIL,replyTo:"french-ward@axpt.io",subject,text,html,headers:{"Idempotency-Key":GSAM_DELIVERY_KEY}});
   if(response.error){status="FAILED";error="PROVIDER_REJECTED";} else if(response.data?.id){status="ACCEPTED";messageId=response.data.id;} else {error="PROVIDER_OUTCOME_UNKNOWN";}
 } catch {error="PROVIDER_OUTCOME_UNKNOWN";}
 await prisma.$transaction(async (tx: Pick<typeof prisma, "gsamEmailDelivery" | "emailLog" | "domainEvent">)=>{
   await tx.gsamEmailDelivery.update({where:{id:delivery.id},data:{status,messageId,error}});
   await tx.emailLog.create({data:{type:"GSAM_SCO_INVITATION",from,to:GSAM_EMAIL,subject,status,messageId,rawPayload:{deliveryKey:GSAM_DELIVERY_KEY,grantIds,error}}});
   await tx.domainEvent.create({data:{streamType:"GsamEmailDelivery",streamId:delivery.id,eventType:"GSAM_INVITATION_DISPATCH_RECORDED",payload:{deliveryKey:GSAM_DELIVERY_KEY,status,messageId,error,grantIds,actorUserId}}});
 });
 return {status,messageId,alreadyAttempted:false};
}
