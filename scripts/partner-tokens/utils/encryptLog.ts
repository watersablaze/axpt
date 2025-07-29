// 📁 app/scripts/partner-tokens/utils/encryptLog.ts

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { LOG_ENCRYPTION_KEY } from '@/lib/security/tokenSecrets';

const logFilePath = path.join(process.cwd(), 'token-log.json');
const algorithm = 'aes-256-cbc';

export function encryptLogEntry(entry: any): string {
  const iv = new Uint8Array(crypto.randomBytes(16)); // 👈 explicitly typed view
  const cipher = crypto.createCipheriv(algorithm, LOG_ENCRYPTION_KEY, iv);

  const json = JSON.stringify(entry);
  let encrypted = cipher.update(json, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${Buffer.from(iv).toString('hex')}:${encrypted}`;
}

export function appendEncryptedLog(entry: any) {
  const encryptedEntry = encryptLogEntry(entry);
  const logLine = encryptedEntry + '\n';
  fs.appendFileSync(logFilePath, logLine, 'utf8');
}