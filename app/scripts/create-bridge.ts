// scripts/create-bridge.ts

/**
 * 🛠 AXPT create-bridge.ts
 * -------------------------
 * Creates a dual-layer API route structure:
 * - Edge route (app/api/[name]/route.ts)
 * - Lambda handler (app/api-lambda/[name]/route.ts)
 * 
 * Usage:
 *   pnpm tsx scripts/create-bridge.ts save-profile
 * 
 * This will generate:
 *   - app/api/save-profile/route.ts
 *   - app/api-lambda/save-profile/route.ts
 * 
 * NOTE: Will not overwrite existing files.
 */

import fs from 'fs';
import path from 'path';

const name = process.argv[2];
if (!name) {
  console.error('❌ Please provide a route name. Example: pnpm tsx scripts/create-bridge.ts save-profile');
  process.exit(1);
}

// File paths
const edgePath = path.join('app', 'api', name, 'route.ts');
const lambdaPath = path.join('app', 'api-lambda', name, 'route.ts');

// Template content
const edgeTemplate = `
// app/api/${name}/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { ${camel(name)}Handler } from '@/api-lambda/${name}/route';

export async function POST(req: Request) {
  return ${camel(name)}Handler(req);
}
`.trimStart();

const lambdaTemplate = `
// app/api-lambda/${name}/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function ${camel(name)}Handler(req: Request) {
  // TODO: implement business logic for ${name}
  return NextResponse.json({ success: true });
}
`.trimStart();

// Check and write files
function writeIfNotExists(filePath: string, content: string) {
  if (fs.existsSync(filePath)) {
    console.log(`⚠️  Skipped: ${filePath} already exists`);
  } else {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Created: ${filePath}`);
  }
}

function camel(input: string): string {
  return input.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

// Run
writeIfNotExists(edgePath, edgeTemplate);
writeIfNotExists(lambdaPath, lambdaTemplate);