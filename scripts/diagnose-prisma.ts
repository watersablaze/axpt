#!/usr/bin/env tsx

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const prisma = new PrismaClient();

type Status = '✅' | '⚠️' | '❌';
type DiagnosticReport = {
  model: string;
  status: Status;
  count: number | null;
  fields: string[] | null;
  error?: string;
}[];

async function diagnosePrisma() {
  const report: DiagnosticReport = [];

  console.log(chalk.blue('\n🔍 AXPT Prisma Diagnostics\n'));

  for (const key of Object.keys(prisma)) {
    const model = (prisma as any)[key];

    // Skip non-model keys (e.g. `$connect`, `$disconnect`, etc.)
    if (typeof model !== 'object' || !model?.count) continue;

    try {
      const count = await model.count();
      const sample = await model.findFirst();

      const fields = sample ? Object.keys(sample) : [];

      const status: Status = count > 0 ? '✅' : '⚠️';

      report.push({ model: key, status, count, fields });
      console.log(`${status} ${chalk.bold(key)} — ${count} records`);
    } catch (error: any) {
      report.push({
        model: key,
        status: '❌',
        count: null,
        fields: null,
        error: error?.message || 'Unknown error',
      });
      console.log(`❌ ${chalk.red.bold(key)} — ${chalk.red('Error')} (${error.message})`);
    }
  }

  // Write report
  const outPath = path.join(process.cwd(), 'diagnostics.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(chalk.yellow(`\n📄 Report saved to diagnostics.json\n`));

  await prisma.$disconnect();
}

diagnosePrisma();