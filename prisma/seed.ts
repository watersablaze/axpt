// app/scripts/seed.ts
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AXPT schema...');

  // 1. Create User
  const user = await prisma.user.create({
    data: {
      username: 'jamal',
      email: 'jamal@example.com',
      password: 'securehashedpassword',
      isAdmin: true,
    },
  });

  // 2. Create Wallet
  const wallet = await prisma.wallet.create({
    data: {
      userId: user.id,
      address: '0xABCDEF1234567890',
      balance: 0,
    },
  });

  // 3. Create Transaction
  await prisma.transaction.create({
    data: {
      userId: user.id,
      walletId: wallet.id,
      type: 'deposit',
      amount: 1000,
      tokenType: 'AXG',
    },
  });

  // 4. Optional Stake
  await prisma.stake.create({
    data: {
      userId: user.id,
      amount: 500,
      apy: 10,
      type: 'longterm',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      isActive: true,
    },
  });

  // 5. Optional Partner
  await prisma.partner.create({
    data: {
      name: 'Crown Temple',
      slug: 'crown-temple',
      tier: 'Investor',
      email: 'crown@example.com',
      docs: ['AXPT-Whitepaper.pdf'],
      token: 'sample-token-123',
    },
  });

  console.log('✅ Done seeding.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });