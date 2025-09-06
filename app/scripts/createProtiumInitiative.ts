import { prisma } from '@/lib/prisma';

async function main() {
  const slug = 'protium';
  const data = {
    title: 'Protium – Hydrogen Auction Pilot',
    slug,
    category: 'ENERGY',      // adjust to your enum/category set
    status: 'ACTIVE',        // must match your Prisma enum (e.g., ACTIVE)
    summary:
      'Pilot initiative to test on-chain priority auctions for hydrogen supply using PRT balance as bidding cap.',
  };

  // if you allow duplicates by slug in your schema, prefer update+create
  const existing = await prisma.initiative.findUnique({ where: { slug } });
  const record = existing
    ? await prisma.initiative.update({ where: { slug }, data })
    : await prisma.initiative.create({ data });

  console.log('✅ Initiative ready:', { id: record.id, slug: record.slug, status: record.status });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });