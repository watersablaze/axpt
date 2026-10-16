
import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";
import { escapeInstitutionalEmailHtml } from "@/infrastructure/email/institutionalEmail";
import { getRepresentativeOnboardingEmailMode } from "./emailMode";

export const JENS_ACCESS_INTAKE = "cmusi9eqz0001w0qfvic3532g";
const recipient = "juxtaport@gmail.com";
const communicationType =
  "ARP_ONBOARDING_WORKSPACE_ACCESS_" + JENS_ACCESS_INTAKE + "_V1";

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

  const subject = "Your French-Ward Representative Workspace Is Ready";
  const paragraphs = [
    "Hi Jens,",
    "Your French-Ward Representative Workspace is now ready, with your active appointment, signed Agreement, and Commercial Utility Pack organized in one place.",
    "Access your workspace: https://www.axpt.io/representative",
    "Sign in using juxtaport@gmail.com and enter the access code sent to that email address. No password is required.",
    "Your materials include French-Ward’s Institutional Profile, the Bafoula Source Authority Instrument, the Reseller Agreement, the Declaration of Trust, the Sanctions Screening Report, and your Operating Boundaries.",
    "When introducing a prospective buyer, you can select the approved materials and send one combined invitation from your workspace. You may also include Letter of Intent access, allowing the recipient to review the materials and submit their proposed transaction after signing in.",
    "The workspace records the permissions applicable to each material. Please use its invitation controls when sharing with buyers so access remains connected to the intended recipient and the official publications.",
    "We welcome your feedback as you begin using the workspace with your buyer group. It will help us continue shaping a practical, supportive working environment.",
    "Warm regards,\nJamal Ward\nFrench-Ward, Inc."
];
  const text = paragraphs.join("\n\n");
  const bodyMarkup = paragraphs.filter((_, index) => index !== 2).map((paragraph, index) => {
    const content = escapeInstitutionalEmailHtml(paragraph).replaceAll("\n", "<br>");
    return '<p style="margin:0 0 22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.8;color:' +
      (index === 0 ? '#ffffff' : '#cad6e2') + ';">' + content + '</p>';
  }).join("");
  const html = `<!doctype html>
<html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#070d16;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#070d16;">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#101f32;border:1px solid #283b50;">
<tr><td style="padding:28px 28px 24px;border-bottom:1px solid #344153;">
<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;color:#e2c78f;">FRENCH-WARD, INC.</p>
<p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:#aebfd0;">Authorized Representation Program</p>
</td></tr>
<tr><td style="padding:30px 28px 10px;">
<p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1.5px;color:#d7bd86;">PREPARED FOR JENS PETER THOMSEN</p>
<h1 style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:29px;line-height:1.25;font-weight:600;color:#ffffff;">Your workspace is ready.</h1>
<p style="margin:0 0 30px;"><a href="https://www.axpt.io/representative" style="display:inline-block;padding:14px 22px;background:#d8bd85;color:#101724;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;text-decoration:none;border-radius:3px;">Open Your Workspace →</a></p>
${bodyMarkup}
</td></tr>
<tr><td style="padding:22px 28px;border-top:1px solid #344153;">
<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.8;color:#aebfd0;">If the button does not open, visit<br><a href="https://www.axpt.io/representative" style="color:#e2c78f;overflow-wrap:anywhere;">https://www.axpt.io/representative</a></p>
<p style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.8;color:#aebfd0;">French-Ward, Inc. · Institutional environment via AXPT</p>
</td></tr></table></td></tr></table></body></html>`;
  const from = process.env.REPRESENTATIVE_ONBOARDING_FROM_EMAIL ||
    "French-Ward <french-ward@axpt.io>";
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
