
import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";
import { escapeInstitutionalEmailHtml } from "@/infrastructure/email/institutionalEmail";
import { getRepresentativeOnboardingEmailMode } from "./emailMode";

export const JENS_PREPARATION_INTAKE = "cmusi9eqz0001w0qfvic3532g";
const recipient = "juxtaport@gmail.com";
const communicationType =
  "ARP_ONBOARDING_WORKSPACE_PREPARATION_" + JENS_PREPARATION_INTAKE + "_V1";

export async function reviewJensWorkspacePreparation(intakeId: string) {
  if (intakeId !== JENS_PREPARATION_INTAKE) {
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

  const subject = "Your French-Ward Representative Workspace";
  const paragraphs = [
    "Hi Jens,",
    "We’re completing the final checks on your first French-Ward Representative Workspace and expect to send your access details later today.",
    "Thank you for your patience as we bring this first workspace together.",
    "It brings your signed Agreement, French-Ward’s Institutional Profile, the Bafoula Source Authority Instrument, and your Operating Boundaries into one organized place, with your appointment and permissions clearly recorded.",
    "This is the foundation of your working environment with French-Ward. It will grow as official instruments, tools, and processes are introduced.",
    "Once inside, the interface and welcoming guide will help you get acquainted, review your materials, and follow the appointment acceptance steps. Permissions to present or share materials will be confirmed separately.",
    "We look forward to your feedback as you settle in. It will help us shape a practical workspace for our representatives and strengthen how we support responsible engagement in the field, protecting the relationships and work entrusted to our care.",
    "Warm regards,\nFrench-Ward Administration\nFrench-Ward, Inc.",
  ];
  const text = paragraphs.join("\n\n");


  const bodyMarkup = paragraphs.map((paragraph, index) => {
    if (index === paragraphs.length - 1) {
      return '<div style="margin-top:26px;padding-top:20px;border-top:1px solid #D8D0C2;">' +
        '<p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#514D45;">Warm regards,</p>' +
        '<p style="margin:0;font-family:Georgia,serif;font-size:17px;line-height:1.5;color:#181714;">French-Ward Administration</p>' +
        '<p style="margin:4px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1px;color:#857E72;">French-Ward, Inc.</p>' +
        "</div>";
    }
    const greeting = index === 0;
    return '<p style="margin:0 0 18px;font-family:' +
      (greeting ? "Georgia,serif;font-size:19px;color:#181714;"
        : "Arial,Helvetica,sans-serif;font-size:14px;color:#514D45;") +
      'line-height:1.75;">' +
      escapeInstitutionalEmailHtml(paragraph) +
      "</p>";
  }).join("");

  const html = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#181714;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#181714;">
<tr><td align="center" style="padding:30px 14px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:680px;background:#F4EFE3;border:1px solid #38342E;">
<tr><td style="background:#1B1915;padding:24px 28px;border-bottom:1px solid #4A453D;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#F4EFE3;">French-Ward, Inc.</div>
<div style="margin-top:7px;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:1.8px;text-transform:uppercase;color:#9E978C;">Authorized Representation Program</div>
</td></tr>
<tr><td style="padding:30px 28px 0;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#8A8377;">Prepared for</div>
<div style="margin-top:9px;font-family:Georgia,serif;font-size:23px;line-height:1.35;color:#181714;">Jens Peter Thomsen</div>
</td></tr>
<tr><td style="padding:28px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#857E72;">Representative Workspace</div>
<h1 style="margin:12px 0 26px;font-family:Georgia,serif;font-size:30px;line-height:1.15;font-weight:400;color:#181714;">Your working foundation<br>with French-Ward.</h1>
${bodyMarkup}
</td></tr>
<tr><td style="border-top:1px solid #C9C1B2;padding:18px 28px;">
<div style="text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:1.8;letter-spacing:1.4px;text-transform:uppercase;color:#8A8377;">French-Ward, Inc.<br><span style="font-size:8px;letter-spacing:1px;">Institutional environment via AXPT</span></div>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
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

export async function sendJensWorkspacePreparation(input: {
  intakeId: string; actorUserId: string; reviewHash: string;
}) {
  const review = await reviewJensWorkspacePreparation(input.intakeId);
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
