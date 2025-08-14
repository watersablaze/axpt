import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import abi from '@/lib/chain/abis/protiumToken.json';

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const tokenAddress = process.env.PROTIUM_TOKEN_ADDRESS as string;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const account = searchParams.get('account');

    if (!account) {
      return NextResponse.json({ error: 'Missing account parameter' }, { status: 400 });
    }
    if (!ethers.isAddress(account)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }
    if (!tokenAddress) {
      return NextResponse.json({ error: 'Token address not configured' }, { status: 500 });
    }

    const contract = new ethers.Contract(tokenAddress, abi, provider);
    const [balance, decimals, symbol] = await Promise.all([
      contract.balanceOf(account),
      contract.decimals(),
      contract.symbol()
    ]);

    return NextResponse.json({
      account,
      balance: balance.toString(),
      formatted: ethers.formatUnits(balance, decimals),
      symbol
    });
  } catch (err: any) {
    console.error('Error fetching balance:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}