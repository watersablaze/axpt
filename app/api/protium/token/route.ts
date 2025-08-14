import { NextResponse } from 'next/server';
import { getProtiumToken } from '@/lib/chain/contracts';
import { requireAddress } from '@/lib/chain/addresses';
import { formatUnits } from 'ethers';

export async function GET() {
  try {
    const token = getProtiumToken(true);
    const [name, symbol, decimals, totalSupplyBN] = await Promise.all([
      token.name(),
      token.symbol(),
      token.decimals(),
      token.totalSupply(),
    ]);

    const address = requireAddress('token');
    const totalSupply = totalSupplyBN?.toString?.() ?? String(totalSupplyBN);
    const totalSupplyFormatted = formatUnits(totalSupplyBN, decimals);

    return NextResponse.json({
      ok: true,
      token: {
        address,
        name,
        symbol,
        decimals,
        totalSupply,
        totalSupplyFormatted,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error' }, { status: 500 });
  }
}