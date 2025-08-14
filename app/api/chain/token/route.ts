import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import abi from '@/lib/chain/abis/protiumToken.json';

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const tokenAddress = process.env.PROTIUM_TOKEN_ADDRESS as string;

export async function GET() {
  try {
    if (!tokenAddress) {
      return NextResponse.json({ error: 'Token address not configured' }, { status: 500 });
    }

    const contract = new ethers.Contract(tokenAddress, abi, provider);

    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply()
    ]);

    return NextResponse.json({
      address: tokenAddress,
      name,
      symbol,
      decimals: Number(decimals),
      totalSupply: totalSupply.toString()
    });
  } catch (err: any) {
    console.error('Error fetching token metadata:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}