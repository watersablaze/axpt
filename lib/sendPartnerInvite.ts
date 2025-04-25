import { generateQRCode } from "@/lib/qrHelper";
import { generateEmailBody } from "@/lib/emailContent";

interface SendPartnerInviteProps {
  partnerEmail: string;
  token: string;
}

export async function sendPartnerInvite({ partnerEmail, token }: SendPartnerInviteProps) {
  const verificationUrl = `https://your-domain.com/partner/verify?token=${token}`;

  // Generate QR Code as a Data URI
  const qrDataUri = await generateQRCode(verificationUrl);

  // Generate the email body with QR + link
  const emailBody = generateEmailBody({
    partnerEmail,
    token,
    url: verificationUrl,
    qrDataUri,
  });

  // Output the result to the terminal for manual copy-paste
  console.log("\n===== PARTNER INVITE EMAIL =====\n");
  console.log(`TO: ${partnerEmail}`);
  console.log("\nEMAIL CONTENT:\n");
  console.log(emailBody);
  console.log("\n===== END OF EMAIL =====\n");
}

// Example usage:
// sendPartnerInvite({ partnerEmail: "partner@example.com", token: "abc123xyz" });
