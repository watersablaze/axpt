#!/usr/bin/env node
import crypto from 'node:crypto';
import process from 'node:process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SALT = process.env.ACCESS_CODE_SALT || process.env.SIGNING_SECRET;
if (!SALT) {
  console.error('Missing ACCESS_CODE_SALT (or SIGNING_SECRET) in env.');
  process.exit(1);
}

const [,, partnerArg, tierArg = 'Investor', emailArg] = process.argv;
if (!partnerArg) {
  console.error('Usage: node scripts/issue-access-code.mjs <partner> [tier] [email]');
  process.exit(1);
}

const partner = String(partnerArg).trim();
const tier = String(tierArg).trim();
const email = emailArg ? String(emailArg).trim() : `${partner}@axpt.io`;

function randomChunk(len) {
  return crypto.randomBytes(Math.ceil(len/2)).toString('hex').slice(0, len).toUpperCase();
}
function makeHumanCode(p) {
  const slug = p.replace(/[^a-z0-9]/gi, '-').toUpperCase();
  return `AXPT-${slug}-${randomChunk(4)}-${randomChunk(2)}`;
}
function sha256WithSalt(code, salt) {
  return crypto.createHash('sha256').update(code + salt).digest('hex');
}

async function main() {
  const humanCode = makeHumanCode(partner);
  const codeHash = sha256WithSalt(humanCode, SALT);

  const rec = await prisma.accessCode.create({
    data: {
      codeHash,
      humanCode,
      partner,
      tier,
      email,
      docs: [],
      enabled: true,
      usedCount: 0,
      maxUses: 3,
    },
    select: { id: true, humanCode: true, partner: true, tier: true, email: true, createdAt: true },
  });

  console.log('✅ Access code created:');
  console.log(JSON.stringify(rec, null, 2));
  console.log('\nPaste this code into the TokenGate input:');
  console.log(rec.humanCode);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });