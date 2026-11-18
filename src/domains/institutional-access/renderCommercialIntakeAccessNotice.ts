import {
  COMMERCIAL_INTAKE_RECIPIENT_SIGN_IN_URL,
} from "./manageCommercialIntakeAccessWithClient";

export const COMMERCIAL_INTAKE_ACCESS_URL =
  "https://www.axpt.io" + COMMERCIAL_INTAKE_RECIPIENT_SIGN_IN_URL;

function escapeHtml(input: string) {
  return input.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });
}

/**
 * Pure, non-sending correspondence template.
 * The operator delivery command must establish the current approved
 * LOI_INTAKE_ACCESS grant and durable delivery claim independently.
 */
export function renderCommercialIntakeAccessNotice(input: {
  recipientName: string;
}) {
  const name = input.recipientName.trim() || "Recipient";
  const safeName = escapeHtml(name);
  const subject = "French-Ward | Approved Commercial Intake Access";
  const text = [
    `Dear ${name},`,
    "",
    "Thank you for engaging French-Ward's commercial intake process.",
    "Your access request has been approved.",
    "",
    "Access the Letter of Intent and Transaction Intake:",
    COMMERCIAL_INTAKE_ACCESS_URL,
    "",
    "Sign in using the email address associated with your approved access request.",
    "Complete the intake with the information relevant to your proposed transaction structure, providing as much detail as is currently available.",
    "",
    "This intake is non-binding and serves to streamline commercial review, organize transaction information, and support efficient next-step coordination.",
    "Access approval does not constitute transaction acceptance.",
    "",
    "Regards,",
    "French-Ward, Inc.",
    "Commercial Coordination & Custodial Oversight",
  ].join("\n");
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;background:#f1eee7;color:#322a22;font-family:Arial,sans-serif">
  <div style="max-width:580px;margin:24px auto;background:#faf7f0;border:1px solid #cfbea8">
    <div style="background:#30261d;padding:22px 28px;color:#f5ece0">
      <div style="font-family:Georgia,serif;font-size:23px">French-Ward, Inc.</div>
      <div style="margin-top:6px;font-size:10px;letter-spacing:1.4px">COMMERCIAL CORRESPONDENCE</div>
    </div>
    <div style="padding:28px">
      <p>Dear ${safeName},</p>
      <p>Thank you for engaging French-Ward's commercial intake process. Your access request has been approved.</p>
      <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:normal">Commercial Intake Access</h1>
      <p><a href="${COMMERCIAL_INTAKE_ACCESS_URL}" style="display:inline-block;background:#382a1d;color:#fff;padding:14px 18px;text-decoration:none">Access LOI &amp; Transaction Intake</a></p>
      <p style="font-size:13px;line-height:1.6">Sign in using the email address associated with your approved access request.</p>
      <p style="font-size:13px;line-height:1.6">Complete the intake with the information relevant to your proposed transaction structure, providing as much detail as is currently available.</p>
      <p style="font-size:13px;line-height:1.6">This intake is <strong>non-binding</strong> and serves to streamline commercial review, organize transaction information, and support efficient next-step coordination.</p>
      <p style="font-size:12px;color:#746657">Access approval does not constitute transaction acceptance.</p>
      <p>Regards,<br><strong>French-Ward, Inc.</strong><br>Commercial Coordination &amp; Custodial Oversight</p>
    </div>
  </div>
</body></html>`;
  return { subject, text, html };
}
