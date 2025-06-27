#!/usr/bin/env tsx
/**
 * upgrade-to-bridge.ts
 * ---------------------
 * Converts a set of existing API routes into a dual-architecture format:
 *   - `handler.ts` for core logic
 *   - `route.ts` as a thin Edge shim exporting runtime + handler
 *
 * Supports `--dry-run` and writes to `bridge-progress.json`
 */

import fs from 'fs';
import path from 'path';

const routesToBridge = [
  'app/api/save-profile/route.ts',
  'app/api/auth/request-pin/route.ts',
  'app/api/auth/signup/route.ts',
  'app/api/auth/logout/route.ts',
  'app/api/auth/login/route.ts',
  'app/api/admin/logs/route.ts',
  'app/api/admin/tokens/revoke/route.ts',
  'app/api/admin/tokens/issue/route.ts',
  'app/api/admin/tokens/route.ts',
  'app/api/admin/tokens/history/route.ts',
  'app/api/admin/tokens/create/route.ts',
  'app/api/logout/route.ts',
  'app/api/get-profile/route.ts',
  'app/api/docs/[doc]/route.ts',
  'app/api/partner/verify-token/route.ts',
  'app/api/bridge-account/upgrade/route.ts',
  'app/api/bridge-account/route.ts',
  'app/api/users/set-secret/route.ts',
  'app/api/users/create-from-token/route.ts',
  'app/api/users/set-password/route.ts',
  'app/api/wallet/balance/route.ts',
  'app/api/wallet/create/route.ts',
  'app/api/account/logout/route.ts',
  'app/api/account/session/route.ts',
];

const dryRun = process.argv.includes('--dry-run');
const progress: Record<string, string> = {};

routesToBridge.forEach((routePath) => {
  const fullPath = path.resolve(routePath);
  const routeName = routePath.replace(/^app\/api\//, '');
  const dir = path.dirname(fullPath);
  const handlerPath = path.join(dir, 'handler.ts');
  const backupPath = fullPath.replace('/route.ts', '/route.backup.ts');

  if (!fs.existsSync(fullPath)) {
    console.warn(`❌ File not found: ${routePath}`);
    progress[routeName] = 'missing';
    return;
  }

  const original = fs.readFileSync(fullPath, 'utf8');

  // Infer method: default to POST if unsure
  const method = original.includes('GET') ? 'GET' : 'POST';

  const edgeShim = `import { handler } from './handler';
export const runtime = 'edge';
export const ${method} = handler;
`;

  if (dryRun) {
    console.log(`[dry-run] Would split ${routePath}`);
    progress[routeName] = 'dry-run';
    return;
  }

  // Backup route
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  fs.copyFileSync(fullPath, backupPath);

  // Move original logic to handler.ts
  fs.writeFileSync(handlerPath, original, 'utf8');

  // Replace route.ts with edge shim
  fs.writeFileSync(fullPath, edgeShim, 'utf8');

  progress[routeName] = 'converted';
});

// Write progress report
fs.writeFileSync(
  'bridge-progress.json',
  JSON.stringify(progress, null, 2),
  'utf8'
);

console.log(
  dryRun
    ? '✅ Dry-run complete. No files were changed.'
    : '✅ upgrade-to-bridge.ts complete. Use --dry-run to simulate.'
);