'use client';

import { useState } from 'react';

type Props = {
  caseId: string;
};

export function PortalLinkIssuer({ caseId }: Props) {
  const [sellerUrl, setSellerUrl] = useState<string | null>(null);
  const [buyerUrl, setBuyerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<null | 'SELLER' | 'BUYER'>(null);

  async function issue(role: 'SELLER' | 'BUYER') {
    setLoading(role);

    const res = await fetch('/api/axpt/portal-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId, role }),
    });

    const data = await res.json();

    if (data?.url) {
      role === 'SELLER' ? setSellerUrl(data.url) : setBuyerUrl(data.url);
    }

    setLoading(null);
  }

  return (
    <section className="border border-white/10 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-medium">Party Portal Access</h3>

      <p className="text-xs text-white/60 max-w-xl">
        Issue time-limited document portals for the seller and buyer.
        These links expose only the active verification gate.
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => issue('SELLER')}
          disabled={loading !== null}
          className="text-xs px-3 py-2 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
        >
          {loading === 'SELLER' ? 'Issuing…' : 'Issue Seller Portal Link'}
        </button>

        <button
          onClick={() => issue('BUYER')}
          disabled={loading !== null}
          className="text-xs px-3 py-2 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
        >
          {loading === 'BUYER' ? 'Issuing…' : 'Issue Buyer Portal Link'}
        </button>
      </div>

      {(sellerUrl || buyerUrl) && (
        <div className="pt-2 space-y-2 text-xs">
          {sellerUrl && (
            <div>
              <div className="text-white/50">Seller Portal</div>
              <input
                readOnly
                value={sellerUrl}
                className="w-full bg-black border border-white/10 rounded px-2 py-1 text-white/80"
                onFocus={(e) => e.target.select()}
              />
            </div>
          )}

          {buyerUrl && (
            <div>
              <div className="text-white/50">Buyer Portal</div>
              <input
                readOnly
                value={buyerUrl}
                className="w-full bg-black border border-white/10 rounded px-2 py-1 text-white/80"
                onFocus={(e) => e.target.select()}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}