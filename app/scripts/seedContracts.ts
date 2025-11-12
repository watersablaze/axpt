import { prisma } from '@/lib/prisma';

async function main() {
  await prisma.smartContract.createMany({
    data: [
      {
        name: 'AXGToken',
        address: '0xA1B2C3D4E5F678901234567890ABCDEF12345678',
        network: 'Ethereum',
        purpose: 'Gold-backed stablecoin governing AXPT ecosystem',
        status: 'Live',
      },
      {
        name: 'AXGVault',
        address: '0xF9E8D7C6B5A40987654321FEDCBA098765432100',
        network: 'Ethereum',
        purpose: 'Collateral vault securing gold reserves and stablecoin ratio',
        status: 'Secured',
      },
      {
        name: 'AXGOracle',
        address: '0x7777777777777777777777777777777777777777',
        network: 'Ethereum',
        purpose: 'Chainlink oracle fetching live gold price feeds',
        status: 'Live',
      },
    ],
  });
  console.log('✅ Seeded initial contracts');
}

main()
  .catch((err) => console.error(err))
  .finally(async () => {
    await prisma.$disconnect();
  });