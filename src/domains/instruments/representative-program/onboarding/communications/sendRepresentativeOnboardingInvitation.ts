import "server-only";

import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";
import {
  escapeInstitutionalEmailHtml,
} from "@/infrastructure/email/institutionalEmail";

import {
  getRepresentativeOnboardingContinuityProfile,
} from "../continuityProfile";

import {
  getRepresentativeOnboardingEmailMode,
} from "./emailMode";

export type RepresentativeOnboardingInvitationInput = {
  intakeId: string;
  reference: string;
  candidateDisplayName: string;
  candidateEmail: string;
  accessUrl: string | null;
  deliveryKey?: string;
};

function firstName(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return "Representative";
  }

  const first =
    normalized.split(/\s+/)[0];

  return (
    first.charAt(0).toUpperCase() +
    first.slice(1).toLowerCase()
  );
}

export function renderRepresentativeOnboardingInvitation(
  input: RepresentativeOnboardingInvitationInput,
) {
  const continuity =
    getRepresentativeOnboardingContinuityProfile(
      input.reference,
    );

  const name =
    escapeInstitutionalEmailHtml(
      input.candidateDisplayName,
    );

  const greeting =
    escapeInstitutionalEmailHtml(
      firstName(input.candidateDisplayName),
    );

  const reference =
    escapeInstitutionalEmailHtml(
      input.reference,
    );

  const accessMarkup =
    input.accessUrl
      ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0 14px;">
          <tr>
            <td>
              <a
                href="${escapeInstitutionalEmailHtml(input.accessUrl)}"
                style="
                  display:inline-block;
                  background:#181714;
                  color:#F4EFE3;
                  text-decoration:none;
                  font-family:Arial,Helvetica,sans-serif;
                  font-size:10px;
                  font-weight:700;
                  letter-spacing:1.8px;
                  text-transform:uppercase;
                  padding:14px 20px;
                "
              >
                Open Private Representative Intake
              </a>
            </td>
          </tr>
        </table>

        <p
          style="
            margin:10px 0 0;
            font-family:Arial,Helvetica,sans-serif;
            font-size:10px;
            line-height:1.6;
            color:#777066;
            word-break:break-all;
          "
        >
          Private link:
          <a
            href="${escapeInstitutionalEmailHtml(input.accessUrl)}"
            style="color:#514D45;text-decoration:underline;"
          >
            ${escapeInstitutionalEmailHtml(input.accessUrl)}
          </a>
        </p>
      `
      : `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0 14px;">
          <tr>
            <td
              style="
                display:inline-block;
                background:#181714;
                color:#F4EFE3;
                font-family:Arial,Helvetica,sans-serif;
                font-size:10px;
                font-weight:700;
                letter-spacing:1.8px;
                text-transform:uppercase;
                padding:14px 20px;
              "
            >
              Open Private Representative Intake
            </td>
          </tr>
        </table>
      `;

  const continuityText =
    continuity.kind ===
    "EXISTING_EXECUTED_MASTER_AGREEMENT"
      ? "This digital intake reconciles your existing French-Ward engagement into the Authorized Representation Program record. Your previously executed Master Agreement remains part of that continuity."
      : "This private intake establishes the candidate record used for French-Ward review before Program admission, appointment, mandate, or authority is established.";

  const workspaceText =
    continuity.kind ===
    "EXISTING_EXECUTED_MASTER_AGREEMENT"
      ? "As this record is completed and reconciled, French-Ward is also preparing your private Representative Workspace within AXPT. That environment will become the continuing point of access for your representative record, applicable instruments, communications, and future program activity as they are made available to you."
      : null;

  const subject =
    "French-Ward — Private Representative Program Intake";

  const text = [
    "FRENCH-WARD, INC.",
    "AUTHORIZED REPRESENTATION PROGRAM",
    "",
    `Prepared for: ${input.candidateDisplayName}`,
    `Reference: ${input.reference}`,
    "",
    `${firstName(input.candidateDisplayName)},`,
    "",
    "French-Ward has prepared your private Authorized Representation Program intake.",
    "",
    continuityText,
    ...(workspaceText ? ["", workspaceText] : []),
    "",
    "Use your private link below to open and complete the intake:",
    "",
    input.accessUrl ??
      "[Private representative intake link]",
    "",
    "This access is personal to your candidate record and should not be forwarded.",
    "",
    "French-Ward, Inc.",
    "Institutional environment via AXPT",
  ].join("\n");

  const html = `<!doctype html>
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
                        Private Candidate Intake
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
              <td style="padding:34px 34px 0;">
                <div style="font-family:Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#8A8377;">
                  Prepared For
                </div>

                <div style="margin-top:9px;font-family:Georgia,'Times New Roman',serif;font-size:23px;line-height:1.35;color:#181714;">
                  ${name}
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:30px 34px 34px;">
                <div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:2.2px;text-transform:uppercase;color:#857E72;">
                  Representative Intake &amp; Qualification
                </div>

                <h1 style="margin:12px 0 22px;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.1;font-weight:400;color:#181714;">
                  Before representation, there is recognition.
                </h1>

                <p style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:19px;line-height:1.45;color:#181714;">
                  ${greeting},
                </p>

                <p style="margin:0 0 18px;font-family:Arial,sans-serif;font-size:14px;line-height:1.75;color:#514D45;">
                  French-Ward has prepared your private Authorized Representation Program intake.
                </p>

                <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;line-height:1.75;color:#514D45;">
                  ${escapeInstitutionalEmailHtml(continuityText)}
                </p>

                ${
                  workspaceText
                    ? `
                <p style="margin:18px 0 0;font-family:Arial,sans-serif;font-size:14px;line-height:1.75;color:#514D45;">
                  ${escapeInstitutionalEmailHtml(workspaceText)}
                </p>
                `
                    : ""
                }

                ${accessMarkup}

                <div style="margin-top:28px;background:#EAE4D8;border-top:1px solid #C9C1B2;padding:20px 22px;">
                  <div style="font-family:Arial,sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#80796D;">
                    Private Access
                  </div>

                  <p style="margin:10px 0 0;font-family:Arial,sans-serif;font-size:12px;line-height:1.7;color:#5D574F;">
                    This credential is personal to your candidate record and should not be forwarded.
                  </p>
                </div>
              </td>
            </tr>

            <tr>
              <td style="border-top:1px solid #C9C1B2;padding:18px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-family:Arial,sans-serif;font-size:9px;letter-spacing:1.6px;text-transform:uppercase;color:#8A8377;">
                      Controlled Candidate Instrument
                    </td>

                    <td align="right" style="font-family:Arial,sans-serif;font-size:9px;letter-spacing:1.6px;text-transform:uppercase;color:#8A8377;">
                      Institutional environment via AXPT
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

  return {
    subject,
    text,
    html,
  };
}

function extractError(response: unknown) {
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

function extractMessageId(response: unknown) {
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

export async function sendRepresentativeOnboardingInvitation(
  input: RepresentativeOnboardingInvitationInput & {
    accessUrl: string;
    deliveryKey: string;
  },
) {
  const mode =
    getRepresentativeOnboardingEmailMode();

  const from =
    process.env.REPRESENTATIVE_ONBOARDING_FROM_EMAIL ||
    "French-Ward <french-ward@axpt.io>";

  const rendered =
    renderRepresentativeOnboardingInvitation(
      input,
    );

  const type =
    `ARP_ONBOARDING_INVITATION_${input.intakeId}_${input.deliveryKey}`;

  const safePayload = {
    mode,
    intakeId: input.intakeId,
    reference: input.reference,
    candidateDisplayName:
      input.candidateDisplayName,
  };

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
      text: rendered.text,
      html: rendered.html,
    });

  const error =
    extractError(response);

  const messageId =
    extractMessageId(response);

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
      "[ARP_ONBOARDING_INVITATION_SEND_FAILED]",
    );
  }

  return {
    ok: true as const,
    mode: "send" as const,
    status: "SENT" as const,
    messageId,
  };
}
