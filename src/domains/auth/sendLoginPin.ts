import { resend } from "@/infrastructure/email/client";
import {
  renderAxptAccessCodeEmail,
} from "@/infrastructure/email/institutionalEmail";

type SendLoginPinInput = {
  email: string;
  pin: string;
  expiresInMinutes: number;
};

function getSender() {
  return (
    process.env.AUTH_EMAIL_FROM ??
    process.env.RESEND_FROM_EMAIL ??
    process.env.EMAIL_FROM ??
    "AXPT <connect@axpt.io>"
  );
}

export async function sendLoginPin({
  email,
  pin,
  expiresInMinutes,
}: SendLoginPinInput) {
  const subject =
    "AXPT — Secure access verification code";

  const rendered =
    renderAxptAccessCodeEmail({
      pin,
      expiresInMinutes,
      contextLabel:
        "Institutional Session",
      heading:
        "Verification code",
      instruction:
        "Use this one-time code in the AXPT access window where you requested authentication.",
      securityNote:
        "This code confirms only this authentication event. It does not change your account, role, standing, appointment, or authority. If you did not request access, no action is required.",
    });

  const response =
    await resend.emails.send({
      from: getSender(),
      to: email,
      subject,
      html: rendered.html,
      text: rendered.text,
    });

  if (response.error) {
    throw new Error(
      `AUTH_PIN_EMAIL_FAILED:${response.error.message}`,
    );
  }

  return response;
}
