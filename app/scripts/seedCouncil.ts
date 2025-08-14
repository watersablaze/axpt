// app/scripts/seedCouncil.ts
import 'dotenv/config';
import { prisma } from '@/lib/prisma';

type ElderSpec = { email: string; title?: string };

function parseArgs(argv: string[]): ElderSpec[] {
  // Usage: pnpm tsx app/scripts/seedCouncil.ts --elders "a@b.com:Elder of Treasury" "c@d.com:Earth Works"
  const idx = argv.indexOf('--elders');
  if (idx === -1 || !argv[idx + 1]) return [];
  const specs: ElderSpec[] = [];
  for (let i = idx + 1; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) break;
    const [email, ...titleParts] = token.split(':');
    specs.push({ email: email.trim(), title: titleParts.join(':').trim() || undefined });
  }
  return specs;
}

async function ensureCoreToken(symbol: string, name: string) {
  const existing = await prisma.token.findUnique({ where: { symbol } });
  if (existing) return existing;

  return prisma.token.create({
    data: {
      symbol,
      name,
      isCore: true,
      status: 'active',
      decimals: symbol === 'USD' ? 2 : 2, // adjust if needed
      totalSupply: 0,
      metadata: {},
    },
  });
}

async function ensureCoreTokens() {
  await Promise.all([
    ensureCoreToken('AXG', 'Axis Gold'),
    ensureCoreToken('NMP', 'Nommo Mint Particle'),
    ensureCoreToken('USD', 'US Dollar (Peg)'),
  ]);
}

async function ensureUser(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) return user;

  // Minimal creation to satisfy your schema (username unique, passwordHash present)
  return prisma.user.create({
    data: {
      email,
      username: email,
      passwordHash: '', // Using PIN-first flow; can be set later
      isAdmin: false,
      name: email.split('@')[0],
      tier: 'Elder',
      viewedDocs: [],
    },
  });
}

async function ensureElder(userId: string, title?: string) {
  const existing = await prisma.councilElder.findUnique({ where: { userId } });
  if (existing) {
    if (title && existing.title !== title) {
      return prisma.councilElder.update({
        where: { userId },
        data: { title },
      });
    }
    return existing;
  }
  return prisma.councilElder.create({
    data: { userId, title },
  });
}

async function main() {
  const elders = parseArgs(process.argv);
  if (elders.length === 0) {
    console.log('Usage:');
    console.log('  pnpm tsx app/scripts/seedCouncil.ts --elders "elder1@axpt.io:Elder of Treasury" "elder2@axpt.io:Elder of Earth Works"');
    process.exit(1);
  }

  console.log('🔮 Seeding Council Elders...');
  await ensureCoreTokens();
  console.log('🪙 Core tokens ensured: AXG, NMP, USD');

  for (const spec of elders) {
    try {
      const user = await ensureUser(spec.email);
      const elder = await ensureElder(user.id, spec.title);
      console.log(`✅ Elder ensured: ${spec.email} ${spec.title ? `(${spec.title})` : ''}  [userId=${user.id}] [elderId=${elder.id}]`);
    } catch (e) {
      console.error(`❌ Failed to ensure elder for ${spec.email}:`, e);
      process.exitCode = 1;
    }
  }

  console.log('✨ Council seeding complete.');
}

main()
  .catch((err) => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });