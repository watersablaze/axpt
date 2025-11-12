// scripts/syncContracts.ts
import { ethers } from 'ethers';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

async function main() {
  const rpc = process.env.SEPOLIA_RPC_URL || process.env.RPC_URL_MAINNET || process.env.NEXT_PUBLIC_PROVIDER_URL;
  if (!rpc) throw new Error('No RPC URL found in env');

  const provider = new ethers.JsonRpcProvider(rpc);
  const networkName = process.env.CHAIN_NETWORK || 'sepolia';
  const buildDir = path.resolve('./contracts/out');
  const deploymentDir = path.resolve(`./deployments/${networkName}`);

  if (!fs.existsSync(buildDir)) throw new Error(`Build dir not found: ${buildDir}`);

  const files = fs.readdirSync(buildDir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const name = file.replace('.json', '');
    const artifact = JSON.parse(fs.readFileSync(path.join(buildDir, file), 'utf8'));
    const addressFile = path.join(deploymentDir, `${name}.json`);
    if (!fs.existsSync(addressFile)) {
      console.warn(`No deployment file for ${name}`);
      continue;
    }
    const { address } = JSON.parse(fs.readFileSync(addressFile, 'utf8'));
    if (!address) continue;
    const code = await provider.getCode(address);
    if (code === '0x') {
      console.warn(`${name} not on-chain at ${address}`);
      continue;
    }
    await prisma.smartContract.upsert({
      where: { address },
      update: {
        name,
        abi: artifact.abi ?? null,
        network: networkName,
        description: artifact.metadata?.output?.devdoc?.title || artifact?.description || null,
        status: 'Live',
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        name,
        address,
        abi: artifact.abi ?? null,
        network: networkName,
        description: artifact.metadata?.output?.devdoc?.title || artifact?.description || null,
        status: 'Live',
        isActive: true,
      },
    });
    console.log(`Synced ${name} @ ${address}`);
  }
  await prisma.$disconnect();
  console.log('Contract sync complete');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});