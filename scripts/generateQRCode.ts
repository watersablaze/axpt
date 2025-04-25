import crypto from 'crypto';
import { generateTokenSignature } from '../lib/tokenUtils';
import QRCode from 'qrcode';
import readline from 'readline';
import fs from 'fs';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  const partnerName = await askQuestion('📝 Enter Partner Name for QR Code: ');
  const tokenBase = `${partnerName}-${crypto.randomUUID()}`;
  const signature = generateTokenSignature(tokenBase);
  const url = `https://yourdomain.com/partner/whitepaper?token=${encodeURIComponent(tokenBase)}&signature=${signature}`;

  console.log(`\n🔗 Generated URL: ${url}`);

  const outputDir = path.join(__dirname, '../qr-codes');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const qrPath = path.join(outputDir, `${partnerName.replace(/\s+/g, '_')}_whitepaper.png`);
  await QRCode.toFile(qrPath, url, {
    color: {
      dark: '#000',
      light: '#fff',
    },
  });

  console.log(`✅ QR code saved to: ${qrPath}`);
  rl.close();
}

main().catch((err) => {
  console.error('❌ Error generating QR code:', err);
  rl.close();
});