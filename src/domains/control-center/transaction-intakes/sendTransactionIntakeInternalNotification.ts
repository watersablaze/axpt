import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";

type IntakeInternalNotificationInput = {
  id: string;
  reference: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string | null;
  submitterCompany: string | null;
  submitterRole: string;
  buyerName: string | null;
  program: string | null;
  transactionType: string | null;
  commodity: string | null;
  quantity: string | null;
  trialQuantity: string | null;
  monthlyQuantity: string | null;
  origin: string | null;
  destination: string | null;
  deliveryTerms: string | null;
  settlementMethod: string | null;
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

function getRecipients() {
  return (
    process.env.TRANSACTION_INTAKE_ADMIN_EMAILS ||
    process.env.COUNCIL_EMAILS ||
    ""
  )
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://axpt.io"
  ).replace(/\/$/, "");
}

function buildPlainText(
  input: IntakeInternalNotificationInput,
  reviewUrl: string,
) {
  return [
    `New Transaction Intake: ${input.reference}`,
    "",
    `Reference: ${input.reference}`,
    `Review Link: ${reviewUrl}`,
    "",
    `Submitter: ${input.submitterName}`,
    `Email: ${input.submitterEmail}`,
    `Phone: ${display(input.submitterPhone)}`,
    `Company: ${display(input.submitterCompany)}`,
    `Role: ${input.submitterRole}`,
    `Buyer: ${display(input.buyerName)}`,
    "",
    `Program: ${display(input.program)}`,
    `Structure: ${display(input.transactionType)}`,
    `Commodity: ${display(input.commodity)}`,
    `Total Quantity: ${display(input.quantity)}`,
    `Trial Quantity: ${display(input.trialQuantity)}`,
    `Monthly Quantity: ${display(input.monthlyQuantity)}`,
    `Origin: ${display(input.origin)}`,
    `Destination: ${display(input.destination)}`,
    `Delivery Terms: ${display(input.deliveryTerms)}`,
    `Settlement Method: ${display(input.settlementMethod)}`,
    "",
    `Referral Code: ${display(input.referralCode)}`,
    `Representative: ${display(input.referredByName)}`,
  ].join("\n");
}

function buildHtml(input: IntakeInternalNotificationInput, reviewUrl: string) {
  const rows = [
    ["Reference", input.reference],
    ["Review Link", reviewUrl],
    ["Submitter", input.submitterName],
    ["Email", input.submitterEmail],
    ["Phone", display(input.submitterPhone)],
    ["Company", display(input.submitterCompany)],
    ["Role", input.submitterRole],
    ["Buyer", display(input.buyerName)],
    ["Program", display(input.program)],
    ["Structure", display(input.transactionType)],
    ["Commodity", display(input.commodity)],
    ["Total Quantity", display(input.quantity)],
    ["Trial Quantity", display(input.trialQuantity)],
    ["Monthly Quantity", display(input.monthlyQuantity)],
    ["Origin", display(input.origin)],
    ["Destination", display(input.destination)],
    ["Delivery Terms", display(input.deliveryTerms)],
    ["Settlement Method", display(input.settlementMethod)],
    ["Referral Code", display(input.referralCode)],
    ["Representative", display(input.referredByName)],
  ];

  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <h2>New Transaction Intake</h2>
      <p>A new buyer-side transaction intake has been submitted.</p>

      <p>
        <a href="${escapeHtml(reviewUrl)}" style="color: #1d4ed8; font-weight: 700;">
          Open Admin Review
        </a>
      </p>

      <table style="border-collapse: collapse; width: 100%; max-width: 760px;">
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
    </div>
  `;
}

export async function sendTransactionIntakeInternalNotification(
  input: IntakeInternalNotificationInput,
) {
  const recipients = getRecipients();

  if (recipients.length === 0) {
    await prisma.emailLog.create({
      data: {
        type: "TRANSACTION_INTAKE_INTERNAL_NOTIFICATION",
        from: null,
        to: null,
        subject: `New Transaction Intake: ${input.reference}`,
        status: "SKIPPED_NO_RECIPIENTS",
        rawPayload: {
          intakeId: input.id,
          reference: input.reference,
        },
      },
    });

    return { ok: false, reason: "No internal recipients configured" };
  }

  const from =
    process.env.TRANSACTION_INTAKE_FROM_EMAIL ||
    process.env.NOTIFY_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    "no-reply@axpt.io";

  const reviewUrl = `${getBaseUrl()}/admin/transaction-intakes/${input.id}`;
  const subject = `New Transaction Intake: ${input.reference}`;
  const text = buildPlainText(input, reviewUrl);
  const html = buildHtml(input, reviewUrl);

  const response = await resend.emails.send({
    from,
    to: recipients,
    subject,
    html,
    text,
  });

  const responseError =
    typeof response === "object" &&
    response !== null &&
    "error" in response &&
    response.error
      ? response.error
      : null;

  const messageId =
    typeof response === "object" &&
    response !== null &&
    "data" in response &&
    response.data &&
    typeof response.data === "object" &&
    "id" in response.data
      ? String(response.data.id)
      : null;

  await prisma.emailLog.create({
    data: {
      type: "TRANSACTION_INTAKE_INTERNAL_NOTIFICATION",
      from,
      to: recipients.join(","),
      subject,
      messageId,
      status: responseError ? "FAILED" : "SENT",
      rawPayload: response as object,
    },
  });

  return response;
}
