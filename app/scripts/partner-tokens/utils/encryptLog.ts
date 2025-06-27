// app/scripts/partner-tokens/utils/encryptLog.ts
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getEnv } from './readEnv';

const logFilePath = path.join(process.cwd(), 'token-log.json');
const algorithm = 'aes-256-cbc';
const key = crypto.createHash('sha256').update(getEnv('LOG_SECRET')).digest();
const iv = crypto.randomBytes(16);

export function encryptLogEntry(entry: any): string {
  const json = JSON.stringify(entry);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(json, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function appendEncryptedLog(entry: any) {
  const encryptedEntry = encryptLogEntry(entry);
  const logLine = encryptedEntry + '\n';
  fs.appendFileSync(logFilePath, logLine, 'utf8');
}