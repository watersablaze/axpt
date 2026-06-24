import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";
import { getTransactionIntakeEmailMode } from "./emailMode";

type IntakeConfirmationInput = {
  id: string;
  reference: string;
  submitterName: string;
  submitterEmail: string;
  program: string | null;
  transactionType: string | null;
  commodity: string | null;
  quantity: string | null;
  trialQuantity: string | null;
  monthlyQuantity: string | null;
  destination: string | null;
  referralCode: string | null;
  referredByName: string | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function display(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value.trim() : "Not provided";
}

function extractResendError(response: unknown) {
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

function extractResendMessageId(response: unknown) {
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

function getEmailStatus(response: unknown) {
  return extractResendError(response) ? "FAILED" : "SENT";
}

function buildPlainText(input: IntakeConfirmationInput) {
  return [
    `Transaction Intake Received: ${input.reference}`,
    "",
    `Hello ${input.submitterName},`,
    "",
    "Your transaction intake has been received and logged for review.",
    "",
    `Reference: ${display(input.reference)}`,
    `Program: ${display(input.program)}`,
    `Transaction Structure: ${display(input.transactionType)}`,
    `Commodity: ${display(input.commodity)}`,
    `Total Quantity: ${display(input.quantity)}`,
    `Trial Quantity: ${display(input.trialQuantity)}`,
    `Monthly Quantity: ${display(input.monthlyQuantity)}`,
    `Destination: ${display(input.destination)}`,
    `Referral Code: ${display(input.referralCode)}`,
    `Representative: ${display(input.referredByName)}`,
    "",
    "This confirmation only acknowledges receipt of your intake submission. It does not constitute acceptance, approval, a commercial commitment, or an obligation by AXPT, French-Ward, any seller, buyer, representative, or affiliated party.",
    "",
    "Please keep this reference number for future correspondence.",
    "",
    "AXPT Intake Desk",
  ].join("\n");
}

function buildHtml(input: IntakeConfirmationInput) {
  const rows = [
    ["Reference", input.reference],
    ["Program", display(input.program)],
    ["Transaction Structure", display(input.transactionType)],
    ["Commodity", display(input.commodity)],
    ["Total Quantity", display(input.quantity)],
    ["Trial Quantity", display(input.trialQuantity)],
    ["Monthly Quantity", display(input.monthlyQuantity)],
    ["Destination", display(input.destination)],
    ["Referral Code", display(input.referralCode)],
    ["Representative", display(input.referredByName)],
  ];

  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <p>Hello ${escapeHtml(input.submitterName)},</p>

      <p>Your transaction intake has been received and logged for review.</p>

      <table style="border-collapse: collapse; width: 100%; max-width: 640px;">
        ${rows
          .map(
            ([label, value]) => `
              <tr>
                <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: 700; width: 190px;">
                  ${escapeHtml(label)}
                </td>
                <td style="border: 1px solid #e5e7eb; padding: 8px;">
                  ${escapeHtml(value)}
                </td>
              </tr>
            `,
          )
          .join("")}
      </table>

      <p style="margin-top: 18px;">
        This confirmation only acknowledges receipt of your intake submission.
        It does not constitute acceptance, approval, a commercial commitment, or
        an obligation by AXPT, French-Ward, any seller, buyer, representative,
        or affiliated party.
      </p>

      <p>Please keep this reference number for future correspondence.</p>

      <p>AXPT Intake Desk</p>
    </div>
  `;
}

export async function sendTransactionIntakeConfirmation(
  input: IntakeConfirmationInput,
) {
  const from =
    process.env.TRANSACTION_INTAKE_FROM_EMAIL ||
    process.env.NOTIFY_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    "no-reply@axpt.io";

  const subject = `Transaction Intake Received: ${input.reference}`;
  const text = buildPlainText(input);
  const html = buildHtml(input);

  if (getTransactionIntakeEmailMode() === "log") {
    await prisma.emailLog.create({
      data: {
        type: "TRANSACTION_INTAKE_CONFIRMATION",
        from,
        to: input.submitterEmail,
        subject,
        messageId: null,
        status: "LOGGED_ONLY",
        rawPayload: {
          mode: "log",
          intakeId: input.id,
          reference: input.reference,
          note: "Email send skipped by TRANSACTION_INTAKE_EMAIL_MODE=log.",
        },
      },
    });

    return { ok: true, mode: "log" };
  }

  const response = await resend.emails.send({
    from,
    to: input.submitterEmail,
    subject,
    html,
    text,
  });

  const responseError = extractResendError(response);
  const messageId = extractResendMessageId(response);
  const status = getEmailStatus(response);

  await prisma.emailLog.create({
    data: {
      type: "TRANSACTION_INTAKE_CONFIRMATION",
      from,
      to: input.submitterEmail,
      subject,
      messageId,
      status,
      rawPayload: {
        response,
        error: responseError,
      },
    },
  });

  return response;
}
