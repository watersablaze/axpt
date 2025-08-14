import { NextResponse } from 'next/server';
import { getProtiumToken } from '@/lib/chain/contracts';
import { isAddress, formatUnits } from 'ethers';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = (searchParams.get('address') || '').trim();

    if (!isAddress(address)) {
      return NextResponse.json({ ok: false, error: 'Invalid address' }, { status: 400 });
    }

    const token = getProtiumToken(true);
    const [decimals, bal] = await Promise.all([token.decimals(), token.balanceOf(address)]);
    const balance = bal?.toString?.() ?? String(bal);
    const balanceFormatted = formatUnits(bal, decimals);

    return NextResponse.json({
      ok: true,
      address,
      balance,
      balanceFormatted,
      decimals,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error' }, { status: 500 });
  }
}