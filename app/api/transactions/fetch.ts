import { NextResponse } from "next/server";

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const WALLET_ADDRESS = process.env.NEXT_PUBLIC_WALLET_ADDRESS;
const ALCHEMY_URL = `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}/`;

export async function GET() {
  try {
    if (!ALCHEMY_API_KEY || !WALLET_ADDRESS) {
      console.warn("⚠️ Missing Alchemy API Key or Wallet Address in environment variables.");
      return NextResponse.json({ error: "Missing API credentials" }, { status: 500 });
    }

    const response = await fetch(ALCHEMY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "alchemy_getAssetTransfers",
        params: [
          {
            fromBlock: "0x0",
            toAddress: WALLET_ADDRESS,
            category: ["external", "internal", "erc20", "erc721"],
            maxCount: "0x10", // Limits the number of transactions
            order: "desc",
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("❌ Alchemy API request failed:", response.statusText);
      return NextResponse.json({ error: "Alchemy API request failed" }, { status: response.status });
    }

    const data = await response.json();

    if (!data || !data.result || !data.result.transfers) {
      console.error("❌ Unexpected response format from Alchemy API:", data);
      return NextResponse.json({ error: "Unexpected response format" }, { status: 500 });
    }

    return NextResponse.json(data.result.transfers);

  } catch (error) {
    console.error("❌ Error fetching transactions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}