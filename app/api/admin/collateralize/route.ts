// app/api/admin/axg/collateralize/route.ts
import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { requireElderServer } from '@/lib/auth/requireElderServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ERC20_MINT_ABI = [
  'function mint(address to, uint256 amount) external',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

const AGG_ABI = [
  'function decimals() view returns (uint8)',
  'function latestRoundData() view returns (uint80,int256,uint256,uint256,uint80)',
] as const;
const AXG_ABI = [
  'function goldPriceFeed() view returns (address)',
  'function ethPriceFeed() view returns (address)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
] as const;

function err(message: string, code = 500) {
  return NextResponse.json({ ok: false, error: message }, { status: code });
}
function isAddr(a: string) { return /^0x[a-fA-F0-9]{40}$/.test(a); }

export async function POST(req: Request) {
  try {
    // Elder-gated, but allow dev-bypass header just like your mint endpoints.
    try { await requireElderServer(); } catch {
      if (process.env.NODE_ENV === 'development' && req.headers.get('x-dev-bypass') === '1') {
        // ok
      } else {
        throw new Error('Unauthorized');
      }
    }

    if (process.env.DEV_COLLATERALIZE_MINT !== '1') {
      return err('DEV_COLLATERALIZE_MINT flag must be 1 for this temporary endpoint', 403);
    }

    const body = await req.json().catch(() => ({}));
    const to = String(body?.to || '').trim();
    const ethAmount = Number(body?.ethAmount ?? 0);
    if (!isAddr(to)) return err('Invalid `to` address', 400);
    if (!Number.isFinite(ethAmount) || ethAmount <= 0) return err('Invalid `ethAmount`', 400);

    const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.RPC_URL;
    const pk = process.env.COUNCIL_SIGNER_PRIVATE_KEY || process.env.PRIVATE_KEY;
    const axgAddr = process.env.AXG_TOKEN_ADDRESS;

    if (!rpcUrl) return err('SEPOLIA_RPC_URL missing');
    if (!pk) return err('COUNCIL_SIGNER_PRIVATE_KEY missing');
    if (!axgAddr || !isAddr(axgAddr)) return err('AXG_TOKEN_ADDRESS missing/invalid');

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Read prices exactly like preview
    const axg = new ethers.Contract(axgAddr, AXG_ABI, provider);
    const [goldFeedAddr, ethFeedAddr, axgDec, axgSym] = await Promise.all([
      axg.goldPriceFeed(), axg.ethPriceFeed(), axg.decimals(), axg.symbol()
    ]);

    const goldFeed = new ethers.Contract(goldFeedAddr, AGG_ABI, provider);
    const ethFeed  = new ethers.Contract(ethFeedAddr,  AGG_ABI, provider);
    const [gDec, eDec] = await Promise.all([goldFeed.decimals(), ethFeed.decimals()]);
    const [, gAnswer] = await goldFeed.latestRoundData();
    const [, eAnswer] = await ethFeed.latestRoundData();
    if (gAnswer <= 0n || eAnswer <= 0n) return err('Invalid feed data', 502);

    const goldUsd = Number(ethers.formatUnits(gAnswer, gDec));
    const ethUsd  = Number(ethers.formatUnits(eAnswer,  eDec));
    const axgOut  = (ethAmount * ethUsd) / goldUsd;
    const axgWei  = ethers.parseUnits(String(axgOut), axgDec);

    // DEV surrogate: mint using owner key
    const signer = new ethers.Wallet(pk, provider);
    const token  = new ethers.Contract(axgAddr, ERC20_MINT_ABI, signer);
    const tx = await token.mint(to, axgWei);
    const receipt = await tx.wait();

    return NextResponse.json({
      ok: true,
      to,
      ethAmount,
      prices: { goldUsd, ethUsd },
      axg: { symbol: axgSym, decimals: axgDec, out: axgOut, outWei: axgWei.toString() },
      txHash: tx.hash,
      blockNumber: receipt?.blockNumber ?? null,
      txUrl: `https://sepolia.etherscan.io/tx/${tx.hash}`,
      devNote: 'Temporary DEV flow: minted with owner. Replace with on-chain collateral when ready.',
    });
  } catch (e: any) {
    return err(e?.message || 'Collateralize failed');
  }
}