import 'dotenv/config'; 
import crypto from 'crypto';
import prompts from 'prompts';
import fs from 'fs';
import path from 'path';
import { generateQRCode } from '../lib/generateQRCode';

const PARTNER_SECRET = process.env.PARTNER_SECRET;

if (!PARTNER_SECRET) {
  throw new Error('❌ Missing PARTNER_SECRET in environment variables.');
}

// 🔹 Sign the partner string into a secure token
function signPartnerString(partnerString: string): string {
  return crypto
    .createHmac('sha256', PARTNER_SECRET!)
    .update(partnerString)
    .digest('hex');
}

(async () => {
  const { partnerString } = await prompts({
    type: 'text',
    name: 'partnerString',
    message: '🔑 Enter the partner string to generate invite for:',
    validate: value => value ? true : 'Partner string cannot be empty.',
  });

  const signature = signPartnerString(partnerString);
  const fullToken = `${partnerString}:${signature}`;
  const accessUrl = `https://axpt.io/partner/whitepaper?token=${encodeURIComponent(fullToken)}`;

  // 🟢 Generate QR Code
  const qrDataUrl = await generateQRCode(accessUrl, { width: 400 });

  // 🛠 Create /invites folder if missing
  const invitesDir = path.join(process.cwd(), 'invites');
  if (!fs.existsSync(invitesDir)) {
    fs.mkdirSync(invitesDir);
    console.log('📁 /invites folder created.');
  }

  // 📜 Save Invite Text
  const inviteText = `
🎟️  AXPT.io Partner Portal Invitation
------------------------------------------------------------

Dear [Partner Name],

This invitation grants you access to the Axis Point Investments (AXPT.io) Partner Portal —
the gateway to our whitepaper and our next phase of evolution.

Your access token is individually created and intended for your sole use.
Please do not share this material outside of authorized channels.

Access Portal: ${accessUrl}
Token: ${fullToken}

Welcome to the Axis.

— AXPT Team
  `.trim();

  const textFilePath = path.join(invitesDir, `${partnerString}.txt`);
  fs.writeFileSync(textFilePath, inviteText);

  // 🖼 Save QR Code PNG
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
  const qrFilePath = path.join(invitesDir, `${partnerString}.png`);
  fs.writeFileSync(qrFilePath, qrBuffer);

  // ✅ Success Summary
  console.log(`\n✅ Invite and QR code saved to /invites/${partnerString}.txt and .png`);
  console.log(`✅ Ready to email from ProtonMail or embed QR.`);
})();