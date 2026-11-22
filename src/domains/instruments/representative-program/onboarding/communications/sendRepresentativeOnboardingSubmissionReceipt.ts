import "server-only";

import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";

import {
  getRepresentativeOnboardingContinuityProfile,
} from "../continuityProfile";

import {
  getRepresentativeOnboardingEmailMode,
} from "./emailMode";

export type RepresentativeSubmissionReceiptInput = {
  intakeId: string;
  reference: string;
  candidateDisplayName: string;
  candidateEmail: string;
  submittedAt: Date | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function firstName(displayName: string) {
  const normalized = displayName.trim();

  if (!normalized) {
    return "Representative";
  }

  const first = normalized.split(/\s+/)[0];

  return first.charAt(0).toUpperCase() +
    first.slice(1).toLowerCase();
}

function buildPlainText(
  input: RepresentativeSubmissionReceiptInput,
) {
  const continuity =
    getRepresentativeOnboardingContinuityProfile(
      input.reference,
    );

  const greeting = firstName(
    input.candidateDisplayName,
  );

  if (
    continuity.kind ===
    "EXISTING_EXECUTED_MASTER_AGREEMENT"
  ) {
    return [
      "FRENCH-WARD, INC.",
      "AUTHORIZED REPRESENTATION PROGRAM",
      "",
      "Submission received.",
      "",
      `${greeting},`,
      "",
      "Your Representative Program submission has been received by French-Ward.",
      "",
      "Because your engagement with French-Ward is already underway and your Master Agreement has previously been executed, our team will now reconcile your submitted information with the existing agreement and corresponding representative record within AXPT.",
      "",
      "No additional agreement action is required from you at this stage unless French-Ward contacts you directly.",
      "",
      "Your private Representative / Mandate Workspace is also being prepared. Once activated, it will provide a continuing AXPT environment for your appointment, authorized materials, communications, and representative activity.",
      "",
      "We will provide your AXPT access instructions when that environment is ready.",
      "",
      `Reference: ${input.reference}`,
      "",
      "French-Ward, Inc.",
      "Authorized Representation Program",
    ].join("\n");
  }

  return [
    "FRENCH-WARD, INC.",
    "AUTHORIZED REPRESENTATION PROGRAM",
    "",
    "Submission received.",
    "",
    `${greeting},`,
    "",
    "Your Representative Program submission has been received by French-Ward and entered for review.",
    "",
    "Submission does not itself establish Program admission, appointment, mandate, or delegated authority. French-Ward will contact you as the review progresses.",
    "",
    `Reference: ${input.reference}`,
    "",
    "French-Ward, Inc.",
    "Authorized Representation Program",
  ].join("\n");
}

function buildHtml(
  input: RepresentativeSubmissionReceiptInput,
) {
  const continuity =
    getRepresentativeOnboardingContinuityProfile(
      input.reference,
    );

  const greeting = escapeHtml(
    firstName(input.candidateDisplayName),
  );

  const reference = escapeHtml(
    input.reference,
  );

  const continuityBody =
    continuity.kind ===
    "EXISTING_EXECUTED_MASTER_AGREEMENT"
      ? `
        <p style="margin:0 0 18px;font-size:15px;line-height:1.75;color:#514D45;">
          Because your engagement with French-Ward is already underway and your
          Master Agreement has previously been executed, our team will now
          reconcile your submitted information with the existing agreement and
          corresponding representative record within AXPT.
        </p>

        <div style="margin:28px 0 0;border-top:1px solid #C9C1B2;border-bottom:1px solid #C9C1B2;padding:22px 0;">
          <div style="font-family:Arial,sans-serif;font-size:10px;line-height:1.4;letter-spacing:2.2px;text-transform:uppercase;color:#80796D;">
            Continuity
          </div>

          <div style="margin-top:10px;font-family:Georgia,'Times New Roman',serif;font-size:23px;line-height:1.25;color:#181714;">
            Your existing engagement is being reconciled into AXPT.
          </div>

          <p style="margin:14px 0 0;font-size:14px;line-height:1.75;color:#514D45;">
            No additional agreement action is required from you at this stage
            unless French-Ward contacts you directly.
          </p>
        </div>

        <div style="margin:28px 0 0;background:#1B1915;padding:26px 24px;">
          <div style="font-family:Arial,sans-serif;font-size:10px;line-height:1.4;letter-spacing:2.2px;text-transform:uppercase;color:#BDB5A6;">
            Preparing Next
          </div>

          <div style="margin-top:10px;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.25;color:#F4EFE3;">
            Representative / Mandate Workspace
          </div>

          <p style="margin:14px 0 0;font-size:14px;line-height:1.75;color:#D7D0C4;">
            Your private workspace is being prepared. Once activated, it will
            provide a continuing AXPT environment for your appointment,
            authorized materials, communications, and representative activity.
          </p>

          <p style="margin:14px 0 0;font-size:14px;line-height:1.75;color:#D7D0C4;">
            We will provide your AXPT access instructions when that environment
            is ready.
          </p>
        </div>
      `
      : `
        <p style="margin:0 0 18px;font-size:15px;line-height:1.75;color:#514D45;">
          Your Representative Program submission has been received by
          French-Ward and entered for review.
        </p>

        <div style="margin:28px 0 0;border-top:1px solid #C9C1B2;padding-top:22px;">
          <p style="margin:0;font-size:13px;line-height:1.7;color:#6D675D;">
            Submission does not itself establish Program admission,
            appointment, mandate, or delegated authority. French-Ward will
            contact you as the review progresses.
          </p>
        </div>
      `;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#181714;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#181714;">
      <tr>
        <td align="center" style="padding:30px 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:680px;background:#F4EFE3;border:1px solid #38342E;">
            <tr>
              <td style="background:#1B1915;padding:22px 28px;border-bottom:1px solid #4A453D;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td valign="top">
                      <div style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#F4EFE3;">
                        French-Ward, Inc.
                      </div>

                      <div style="margin-top:7px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:1.8px;text-transform:uppercase;color:#9E978C;">
                        Authorized Representation Program
                      </div>
                    </td>

                    <td valign="top" align="right">
                      <div style="font-family:Arial,sans-serif;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#807A70;">
                        Candidate Record
                      </div>

                      <div style="margin-top:7px;font-family:'Courier New',monospace;font-size:10px;color:#C8C0B3;">
                        ${reference}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:38px 34px 34px;">
                <div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:2.2px;text-transform:uppercase;color:#857E72;">
                  Representative Intake &amp; Qualification
                </div>

                <h1 style="margin:12px 0 22px;font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.08;font-weight:400;color:#181714;">
                  Submission received.
                </h1>

                <p style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.45;color:#181714;">
                  ${greeting},
                </p>

                <p style="margin:0 0 18px;font-family:Arial,sans-serif;font-size:15px;line-height:1.75;color:#514D45;">
                  Your Representative Program submission has been received by
                  French-Ward.
                </p>

                ${continuityBody}
              </td>
            </tr>

            <tr>
              <td style="border-top:1px solid #C9C1B2;padding:18px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-family:Arial,sans-serif;font-size:9px;letter-spacing:1.6px;text-transform:uppercase;color:#8A8377;">
                      Controlled Representative Communication
                    </td>

                    <td align="right" style="font-family:Arial,sans-serif;font-size:9px;letter-spacing:1.6px;text-transform:uppercase;color:#8A8377;">
                      French-Ward, Inc.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function extractResendError(
  response: unknown,
) {
  if (
    typeof response === "object" &&
    response !== null &&
    "error" in response &&
    response.error
  ) {
    return response.error;
  }

  return null;
}

function extractResendMessageId(
  response: unknown,
) {
  if (
    typeof response === "object" &&
    response !== null &&
    "data" in response &&
    response.data &&
    typeof response.data === "object" &&
    "id" in response.data
  ) {
    return String(response.data.id);
  }

  return null;
}

export function renderRepresentativeOnboardingSubmissionReceipt(
  input: RepresentativeSubmissionReceiptInput,
) {
  return {
    subject:
      "French-Ward Representative Program — Submission Received",
    text: buildPlainText(input),
    html: buildHtml(input),
  };
}

function extractRepresentativeReceiptError(
  response: unknown,
) {
  if (
    typeof response === "object" &&
    response !== null &&
    "error" in response &&
    response.error
  ) {
    return response.error;
  }

  return null;
}

function extractRepresentativeReceiptMessageId(
  response: unknown,
) {
  if (
    typeof response === "object" &&
    response !== null &&
    "data" in response &&
    response.data &&
    typeof response.data === "object" &&
    "id" in response.data
  ) {
    return String(response.data.id);
  }

  return null;
}

export async function sendRepresentativeOnboardingSubmissionReceipt(
  input: RepresentativeSubmissionReceiptInput & {
    deliveryKey: string;
  },
) {
  const from =
    process.env.REPRESENTATIVE_ONBOARDING_FROM_EMAIL ||
    "French-Ward <french-ward@axpt.io>";

  const rendered =
    renderRepresentativeOnboardingSubmissionReceipt(
      input,
    );

  const mode =
    getRepresentativeOnboardingEmailMode();

  const type =
    `ARP_ONBOARDING_SUBMISSION_RECEIPT_${input.intakeId}_${input.deliveryKey}`;

  const safePayload = {
    mode,
    intakeId: input.intakeId,
    reference: input.reference,
    continuity:
      getRepresentativeOnboardingContinuityProfile(
        input.reference,
      ).kind,
  };

  const successfulStatus =
    mode === "send"
      ? "SENT"
      : "LOGGED_ONLY";

  const existing =
    await prisma.emailLog.findFirst({
      where: {
        type,
        to: input.candidateEmail,
        subject: rendered.subject,
        status: successfulStatus,
      },
      select: {
        messageId: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  if (existing) {
    return {
      ok: true as const,
      mode,
      status: successfulStatus,
      messageId: existing.messageId,
      alreadyDelivered: true,
    };
  }

  if (mode === "log") {
    await prisma.emailLog.create({
      data: {
        type,
        from,
        to: input.candidateEmail,
        subject: rendered.subject,
        messageId: null,
        status: "LOGGED_ONLY",
        rawPayload: safePayload,
      },
    });

    return {
      ok: true as const,
      mode: "log" as const,
      status: "LOGGED_ONLY" as const,
      messageId: null,
      alreadyDelivered: false,
    };
  }

  const response =
    await resend.emails.send({
      from,
      to: input.candidateEmail,
      replyTo:
        process.env.REPRESENTATIVE_ONBOARDING_REPLY_TO_EMAIL ||
        "french-ward@axpt.io",
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

  const error =
    extractRepresentativeReceiptError(
      response,
    );

  const messageId =
    extractRepresentativeReceiptMessageId(
      response,
    );

  await prisma.emailLog.create({
    data: {
      type,
      from,
      to: input.candidateEmail,
      subject: rendered.subject,
      messageId,
      status:
        error
          ? "FAILED"
          : "SENT",
      rawPayload: {
        ...safePayload,
        response,
        error,
      },
    },
  });

  if (error) {
    throw new Error(
      "[ARP_ONBOARDING_SUBMISSION_RECEIPT_SEND_FAILED]",
    );
  }

  return {
    ok: true as const,
    mode: "send" as const,
    status: "SENT" as const,
    messageId,
    alreadyDelivered: false,
  };
}
