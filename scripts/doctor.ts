#!/usr/bin/env tsx

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log("⟁ AXPT | Doctor Checkup\n");

const REQUIRED_NODE = "v20.11.1";
const REQUIRED_PNPM = "8.15.5";
const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "SIGNING_SECRET",
  "NEXT_PUBLIC_SITE_URL"
];

const result: Record<string, { status: "✅" | "⚠️" | "❌", detail?: string }> = {};
let passed = 0, warnings = 0, failed = 0;

const time = (label: string, fn: () => void) => {
  const start = Date.now();
  fn();
  const duration = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`🕒 ${label} completed in ${duration}s`);
};

const check = (label: string, fn: () => boolean | string) => {
  try {
    const output = fn();
    if (output === true || output === undefined) {
      console.log(`✅ ${label}`);
      result[label] = { status: "✅" };
      passed++;
    } else {
      console.log(`⚠️  ${label}: ${output}`);
      result[label] = { status: "⚠️", detail: output.toString() };
      warnings++;
    }
  } catch (e: any) {
    console.log(`❌ ${label}: ${e.message}`);
    result[label] = { status: "❌", detail: e.message };
    failed++;
  }
};

const projectName = path.basename(process.cwd());
console.log(`📁 Project: ${projectName}\n`);

// -- Diagnostics --
check("Node version", () => process.version === REQUIRED_NODE || `Expected ${REQUIRED_NODE}, got ${process.version}`);

check("PNPM version", () => {
  const v = execSync("pnpm -v").toString().trim();
  return v === REQUIRED_PNPM || `Expected ${REQUIRED_PNPM}, got ${v}`;
});

check(".env file presence", () => fs.existsSync(".env") || ".env file not found");

check("Required environment variables", () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  return missing.length === 0 || `Missing: ${missing.join(", ")}`;
});

check("Prisma schema present", () => fs.existsSync("prisma/schema.prisma") || "schema.prisma not found");
check("Prisma client generated", () => fs.existsSync("node_modules/.prisma/client") || "Prisma client not generated");
check("Can run `pnpm prisma generate`", () => { execSync("pnpm prisma generate", { stdio: "ignore" }); return true; });

check("TypeScript passes", () => {
  time("TypeScript check", () => execSync("pnpm tsc --noEmit", { stdio: "ignore" }));
  return true;
});

check("Build compiles", () => {
  time("Build", () => execSync("pnpm build", { stdio: "ignore" }));
  return true;
});

check("CLI: token.ts exists", () => fs.existsSync("cli/token.ts") || "Missing cli/token.ts");

check("envsync.ts present", () => fs.existsSync("app/scripts/envsync.ts") || "Missing app/scripts/envsync.ts");

// -- Git Context --
let gitBranch = "unknown";
let gitCommit = "unknown";
try {
  gitBranch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
  gitCommit = execSync("git rev-parse --short HEAD").toString().trim();
  console.log(`🧭 Git: ${gitBranch} @ ${gitCommit}`);
} catch {
  console.log("⚠️  Git info not available.");
}

const overallStatus = failed > 0 ? "❌" : warnings > 0 ? "⚠️" : "✅";
const report = {
  summary: { status: overallStatus, passed, warnings, failed },
  timestamp: new Date().toISOString(),
  node: process.version,
  pnpm: execSync("pnpm -v").toString().trim(),
  git: { branch: gitBranch, commit: gitCommit },
  result
};

const diagnosticsPath = path.join(process.cwd(), "diagnostics.json");
fs.writeFileSync(diagnosticsPath, JSON.stringify(report, null, 2));

console.log(`\n📄 Report saved to diagnostics.json`);
try {
  execSync(`code "${diagnosticsPath}"`);
} catch {
  console.log("⚠️  Could not open diagnostics.json in VS Code.");
}

console.log("🧘🏾 AXPT Doctor Complete.\n");