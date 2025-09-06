import 'dotenv/config';
import { prisma } from '@/lib/prisma';

async function main() {
  const initiative = await prisma.initiative.findUnique({ where: { slug: 'protium' } });
  if (!initiative) throw new Error('No initiative with slug "protium"');

  const u = await prisma.initiativeUpdate.create({
    data: {
      initiativeId: initiative.id,
      title: 'Kickoff',
      body:
        'Protium auction pilot initiated. Smart contracts deployed to Sepolia, PRT minted to council wallet.',
    },
  });

  console.log('✅ Created update:', u.id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});