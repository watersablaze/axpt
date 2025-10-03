import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { getAxgContract } from '@/lib/eth/contracts';
import { parseUnits, formatUnits } from 'ethers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const axgStr = searchParams.get('axg');

  if (!axgStr || isNaN(Number(axgStr))) {
    return NextResponse.json({ error: 'Invalid or missing ?axg= param' }, { status: 400 });
  }

  try {
    const axgWei = parseUnits(axgStr, 18);
    const token = getAxgContract();

    const [ethOutWei, feeBps] = await Promise.all([
      token.previewRedeemOut(axgWei),
      token.redeemFeeBps(),
    ]);

    const fee = ethOutWei.mul(feeBps).div(10_000);
    const ethAfterFee = ethOutWei.sub(fee);
    const minOutSuggestion = ethAfterFee.mul(9950).div(10_000);

    return NextResponse.json({
      axgInput: axgStr,
      ethOut: formatUnits(ethOutWei, 18),
      fee: formatUnits(fee, 18),
      ethAfterFee: formatUnits(ethAfterFee, 18),
      minOutSuggestion: formatUnits(minOutSuggestion, 18),
    });
  } catch (err: any) {
    console.error('Preview redeem error:', err);
    return NextResponse.json({ error: 'Preview failed', details: err.message }, { status: 500 });
  }
}