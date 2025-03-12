import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 30 });
const COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price";
const COINS = ["ethereum", "bitcoin", "solana", "binancecoin"];

export async function GET() {
  try {
    console.log("🔄 Fetching wallet details...");

    // ✅ Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error("🚨 Unauthorized access attempt.");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log(`✅ User authenticated: ${session.user.email}`);

    // ✅ Fetch user details from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        name: true,
        email: true,
        walletAddress: true,
        walletBalance: true, // Stored fiat balance
        avatar: true,
      },
    });

    if (!user) {
      console.error("❌ User not found in database.");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Check for cached balances
    const cachedBalances = cache.get("wallet_balances");
    if (cachedBalances) {
      return NextResponse.json({ success: true, user, balances: cachedBalances });
    }

    // ✅ Fetch real-time balances from CoinGecko
    const response = await fetch(
      `${COINGECKO_API_URL}?ids=${COINS.join(",")}&vs_currencies=usd`,
      { headers: { "Content-Type": "application/json" } }
    );
    if (!response.ok) throw new Error("Failed to fetch from CoinGecko");
    const data = await response.json();

    const cryptoBalances = {
      ETH: data.ethereum.usd,
      BTC: data.bitcoin.usd,
      SOL: data.solana.usd,
      BNB: data.binancecoin.usd,
    };

    const balances = { cryptoBalances, fiatBalance: user.walletBalance };

    // ✅ Cache balances for 30 seconds
    cache.set("wallet_balances", balances);

    return NextResponse.json({ success: true, user, balances });
  } catch (error) {
    console.error("❌ Error fetching balances:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
