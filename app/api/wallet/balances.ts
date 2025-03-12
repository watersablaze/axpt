import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // ✅ Mock wallet balances (Replace with real data later)
  const balances = {
    cryptoBalances: {
      ETH: 2.3456,
      BTC: 0.1234,
      SOL: 5.6789,
      BNB: 1.2345,
    },
    fiatBalance: 5000.0,
  };

  res.status(200).json({ balances });
}