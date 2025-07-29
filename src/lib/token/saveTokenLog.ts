// 📄 app/src/lib/token/saveTokenLog.ts

import fs from 'fs';
import path from 'path';
import { TokenPayload } from './tokenSchema';

const logPath = path.resolve('app/scripts/partner-tokens/logs/token-log.json');

export async function saveTokenLog(token: string, payload: TokenPayload): Promise<void> {
  const newEntry = {
    ...payload,
    token,
    iat: Math.floor(Date.now() / 1000),
  };

  const existing = fs.existsSync(logPath)
    ? JSON.parse(fs.readFileSync(logPath, 'utf-8'))
    : [];

  existing.push(newEntry);

  fs.writeFileSync(logPath, JSON.stringify(existing, null, 2));
}