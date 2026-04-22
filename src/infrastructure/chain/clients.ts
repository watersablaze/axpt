import { JsonRpcProvider, Wallet } from 'ethers';

export function getProvider(): JsonRpcProvider {
  const url =
    process.env.SEPOLIA_RPC_URL ||
    process.env.ETHEREUM_RPC_URL;
  if (!url) throw new Error('No RPC URL configured (set SEPOLIA_RPC_URL or ETHEREUM_RPC_URL)');
  return new JsonRpcProvider(url);
}

export function getCouncilSigner(): Wallet {
  const pk = process.env.COUNCIL_SIGNER_PRIVATE_KEY;
  if (!pk) throw new Error('No council signer key configured (COUNCIL_SIGNER_PRIVATE_KEY)');
  return new Wallet(pk, getProvider());
}