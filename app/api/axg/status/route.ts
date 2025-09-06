import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ERC20_ABI = [
  'function totalSupply() view returns (uint256)',
  'function symbol() view returns (string)',
  'function reserveRatioBps() view returns (uint256)',
  'function requiredEthForTarget() view returns (uint256)',
] as const;

function isAddr(a?: string | null): a is `0x${string}` {
  return !!a && /^0x[a-fA-F0-9]{40}$/.test(a);
}

const safe = (o: any) => JSON.parse(JSON.stringify(o, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

export async function GET() {
  try {
    const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.RPC_URL;
    const axg = process.env.AXG_TOKEN_ADDRESS;

    if (!rpcUrl) return NextResponse.json({ ok: false, error: 'SEPOLIA_RPC_URL missing' }, { status: 500 });
    if (!isAddr(axg)) return NextResponse.json({ ok: false, error: 'AXG_TOKEN_ADDRESS missing/invalid' }, { status: 500 });

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const c = new ethers.Contract(axg, ERC20_ABI, provider);

    const [symbol, totalSupplyWei, ratioBps, requiredEthWei, contractEthWei] = await Promise.all([
      c.symbol() as Promise<string>,
      c.totalSupply() as Promise<bigint>,
      c.reserveRatioBps() as Promise<bigint>,
      c.requiredEthForTarget() as Promise<bigint>,
      provider.getBalance(axg) as Promise<bigint>,
    ]);

    const ratioFloatApprox = Number(ratioBps) / 10000;
    const healthy = Number(ratioBps) >= 10000;

    return NextResponse.json(
      safe({
        ok: true,
        address: axg,
        symbol,
        totalSupplyWei,
        contractEthBalanceWei: contractEthWei,
        requiredRedeemEthWei: requiredEthWei,
        collateralRatioBps: ratioBps,
        reserve: { ratioFloatApprox, healthy },
      })
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error' }, { status: 500 });
  }
}