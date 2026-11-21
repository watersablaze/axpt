
import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";
import { escapeInstitutionalEmailHtml } from "@/infrastructure/email/institutionalEmail";
import { getRepresentativeOnboardingEmailMode } from "./emailMode";

export const JENS_ACCESS_INTAKE = "cmusi9eqz0001w0qfvic3532g";
const recipient = "juxtaport@gmail.com";
const communicationType =
  "ARP_ONBOARDING_WORKSPACE_ACCESS_" + JENS_ACCESS_INTAKE + "_CUP_TOV_UPDATE_20261022_V1";

export async function reviewJensWorkspaceAccess(intakeId: string) {
  if (intakeId !== JENS_ACCESS_INTAKE) {
    throw new Error("PREPARATION_NOT_AVAILABLE");
  }
  const intake = await prisma.representativeOnboardingIntake.findUnique({
    where: { id: intakeId },
    select: {
      id: true, candidateEmail: true, candidateDisplayName: true, status: true,
    },
  });
  if (!intake || intake.status !== "ADMITTED" ||
      intake.candidateEmail.trim().toLowerCase() !== recipient) {
    throw new Error("PREPARATION_NOT_AVAILABLE");
  }

  const subject = "CUP Update | Gold Supply & Transaction Overview";
  const paragraphs = [
    "Hi Jens,",
    "Your Commercial Utility Pack has been updated with the Gold Supply & Transaction Overview, identifying you as the Authorized Representative.",
    "Access your workspace: https://www.axpt.io/representative",
    "The document is available for presentation from your CUP. To share it with a prospective buyer, use Introduce a Buyer to select this document alongside any other approved materials. The system sends one combined access invitation, with you copied on the email. Commercial intake access may also be included when appropriate.",
    "Your workspace also includes French-Ward Communications, providing a direct channel to our team for questions, buyer coordination, and follow-up. You can keep these exchanges within the workspace alongside your representative materials.",
    "We’ve also improved the workspace layout and material organization to make it easier to navigate and use.",
    "Warm regards,\nFrench-Ward Administration\nFrench-Ward, Inc."
];
  const text = paragraphs.join("\n\n");
  const bodyMarkup = paragraphs.filter((_, index) => index !== 2).map((paragraph, index) => {
    const content = escapeInstitutionalEmailHtml(paragraph).replaceAll("\n", "<br>");
    return '<p style="margin:0 0 22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.8;color:' +
      (index === 0 ? '#30251f' : '#514333') + ';">' + content + '</p>';
  }).join("");
  const html = `<!doctype html>
<html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#eee6d8;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eee6d8;">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#fbf7ef;border:1px solid #d5c6b1;">
<tr><td style="padding:28px 28px 24px;background:#30251f;border-bottom:1px solid #684b36;">
<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;color:#ead8b8;">FRENCH-WARD, INC.</p>
<p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:#d9cbb8;">Authorized Representation Program</p>
</td></tr>
<tr><td style="padding:30px 28px 10px;">
<p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1.5px;color:#8b6943;">PREPARED FOR JENS PETER THOMSEN</p>
<h1 style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:29px;line-height:1.25;font-weight:600;color:#30251f;">Your CUP has been updated.</h1>
<p style="margin:0 0 30px;"><a href="https://www.axpt.io/representative" style="display:inline-block;padding:14px 22px;background:#684b36;color:#fff8ec;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;text-decoration:none;border-radius:3px;">Open Your Workspace →</a></p>
${bodyMarkup}
</td></tr>
<tr><td style="padding:22px 28px;border-top:1px solid #d5c6b1;">
<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.8;color:#786650;">If the button does not open, visit<br><a href="https://www.axpt.io/representative" style="color:#684b36;overflow-wrap:anywhere;">https://www.axpt.io/representative</a></p>
<p style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.8;color:#786650;">French-Ward, Inc. · Institutional environment via AXPT</p>
</td></tr></table></td></tr></table></body></html>`;
  const from = "French-Ward Administration <french-ward@axpt.io>";
  const replyTo = process.env.REPRESENTATIVE_ONBOARDING_REPLY_TO_EMAIL ||
    "french-ward@axpt.io";
  const mode = getRepresentativeOnboardingEmailMode();
  const reviewDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg", year: "numeric",
    month: "2-digit", day: "2-digit",
  }).format(new Date());
  const reviewHash = createHash("sha256").update(JSON.stringify({
    intakeId, to: recipient, from, replyTo, subject, text, html, mode, reviewDate,
  })).digest("hex");
  const last = await prisma.emailLog.findFirst({
    where: { type: communicationType },
    orderBy: { id: "desc" },
    select: { status: true, messageId: true, createdAt: true },
  });
  return {
    to: recipient, from, replyTo, subject, text, html,
    mode, reviewDate, reviewHash, last,
  };
}

export async function sendJensWorkspaceAccess(input: {
  intakeId: string; actorUserId: string; reviewHash: string;
}) {
  const review = await reviewJensWorkspaceAccess(input.intakeId);
  if (review.reviewHash !== input.reviewHash) {
    throw new Error("PREPARATION_REVIEW_CHANGED");
  }

  // A short transaction claims this correspondence before contacting the provider.
  const claim = await prisma.$transaction(async (tx: any) => {
    await tx.$queryRaw`
      SELECT pg_advisory_xact_lock(hashtext(${communicationType}))::text AS lock_result
    `;
    const previous = await tx.emailLog.findFirst({
      where: {
        type: communicationType,
        status: { in: ["PENDING", "SENT", "DELIVERY_UNKNOWN"] },
      },
      select: { id: true },
    });
    if (previous) throw new Error("PREPARATION_ALREADY_SENT_OR_PENDING");
    return tx.emailLog.create({
      data: {
        type: communicationType, from: review.from, to: review.to,
        subject: review.subject,
        status: review.mode === "send" ? "PENDING" : "LOGGED_ONLY",
        rawPayload: {
          actorUserId: input.actorUserId,
          reviewHash: review.reviewHash,
          reviewDate: review.reviewDate,
          mode: review.mode,
        },
      },
      select: { id: true },
    });
  }, { maxWait: 10000, timeout: 10000 });

  if (review.mode !== "send") {
    return { mode: "log", status: "LOGGED_ONLY", messageId: null };
  }

  try {
    const response = await resend.emails.send({
      from: review.from, to: review.to, replyTo: review.replyTo,
      subject: review.subject, text: review.text, html: review.html,
    });
    if (response.error || !response.data?.id) {
      throw new Error("PROVIDER_ACCEPTANCE_UNCONFIRMED");
    }
    const messageId = response.data.id;
    await prisma.emailLog.update({
      where: { id: claim.id },
      data: { status: "SENT", messageId },
    });
    return { mode: "send", status: "SENT", messageId };
  } catch {
    // An uncertain delivery is held for inspection, never automatically resent.
    await prisma.emailLog.updateMany({
      where: { id: claim.id, status: "PENDING" },
      data: { status: "DELIVERY_UNKNOWN" },
    });
    throw new Error("PREPARATION_DELIVERY_REQUIRES_INSPECTION");
  }
}
