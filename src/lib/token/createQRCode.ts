// 📄 app/src/lib/token/createQRCode.ts

import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

export async function createQRCode(token: string, partner: string): Promise<string> {
  const outputDir = path.resolve('app/scripts/partner-tokens/logs');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const filePath = path.join(outputDir, `${partner}-qr.png`);
  await QRCode.toFile(filePath, token);
  return filePath;
}