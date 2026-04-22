import 'dotenv/config';
import { prisma } from '@/infrastructure/db/prisma';
import bcrypt from 'bcryptjs';

async function ensureResident({ name, email, password }: {name:string;email:string;password:string}) {
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name, email, passwordHash: await bcrypt.hash(password, 10), tier: 'RESIDENT',
        wallets: { create: {} },
      },
    });
    await prisma.wallet.create({
      data: {
        userId: user.id,
        balances: { create: { tokenType: 'AXG', amount: 1000 } },
        blockchainWallet: { create: { address: `0x${Math.random().toString(16).slice(2, 10).padEnd(40, '0')}` } },
      },
    });
    console.log(`✨ Created ${email} + credited 1000 AXG`);
    return;
  }

  // ensure wallet & axg balance exist
  let wallet = await prisma.wallet.findFirst({ where: { userId: user.id } });
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId: user.id,
        balances: { create: { tokenType: 'AXG', amount: 1000 } },
        blockchainWallet: { create: { address: `0x${Math.random().toString(16).slice(2, 10).padEnd(40, '0')}` } },
      },
    });
    console.log(`✅ Added wallet for ${email} and credited 1000 AXG`);
  } else {
    const axg = await prisma.balance.findFirst({
      where: { walletId: wallet.id, tokenType: 'AXG' },
    });
    if (!axg) {
      await prisma.balance.create({ data: { walletId: wallet.id, userId: user.id, tokenType: 'AXG', amount: 1000 } });
      console.log(`✅ Credited 1000 AXG to ${email} (new AXG balance row)`);
    } else if (axg.amount < 1000) {
      await prisma.balance.update({ where: { id: axg.id }, data: { amount: 1000 } });
      console.log(`🔁 Topped up ${email} to 1000 AXG`);
    } else {
      console.log(`✅ ${email} already has ${axg.amount} AXG`);
    }
  }
}

async function main() {
  await ensureResident({ name: 'Resident A', email: 'resident.a@example.com', password: 'passwordA123' });
  await ensureResident({ name: 'Resident B', email: 'resident.b@example.com', password: 'passwordB123' });
  console.log('🌱 Residents ready');
}

main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});