import { generateQRCode } from './generateQRCode';

export interface PartnerInviteOptions {
  partnerName: string;
  tokenSecret: string;
  tokenLink: string;
}

export async function sendPartnerInvite({
  partnerName,
  tokenSecret,
  tokenLink,
}: PartnerInviteOptions): Promise<string> {
  const qrCodeDataURL = await generateQRCode(tokenLink);

  const border = '============================================';

  const emailContent = `
${border}
💌 Invite Email for: ${partnerName}
${border}

Hello ${partnerName},

You are invited to access the AXPT.io partner whitepaper.

🔗 Click the link below to begin:
${tokenLink}

🔒 Your key/password:
${tokenSecret}

📲 Or simply scan this QR code to open the link directly:
<img src="${qrCodeDataURL}" alt="QR Code" style="width:200px;height:200px;"/>

⚠️ This link is private and intended solely for your use.
Please do not forward or share.

With respect and anticipation,  
— The AXPT.io Team
${border}
✅ Email content ready. Copy and paste into Proton Mail.
${border}
`;

  return emailContent;
}