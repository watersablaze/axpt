import "server-only";
import { resend } from "@/infrastructure/email/client";

export async function sendGlobalMotherRecipientPin(email: string, pin: string) {
  const result = await resend.emails.send({
    from: process.env.AUTH_EMAIL_FROM ?? process.env.RESEND_FROM_EMAIL ??
      process.env.EMAIL_FROM ?? "AXPT <connect@axpt.io>",
    to: email,
    subject: "Your AXPT Framework verification code",
    text: [
      "AXPT · Private Institutional Framework", "",
      `Your one-time verification code is: ${pin}`, "",
      "Enter this code in the browser where you opened your private Framework link.",
      "It expires in 10 minutes. Verification opens your recipient access.",
      "If you did not request this code, no action is required.",
    ].join("\n"),
  });
  if (result.error) throw new Error("GM_PIN_DELIVERY_FAILED");
}
