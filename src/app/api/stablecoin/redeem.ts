import { NextResponse } from "next/server";
import { stablecoinContract } from "@/lib/ethers";
import { ethers } from "ethers";

export async function POST(req: Request) {
  try {
    const { userAddress, stablecoinAmount } = await req.json();

    if (!userAddress || !stablecoinAmount) {
      return NextResponse.json({ success: false, message: "Missing parameters" }, { status: 400 });
    }

    const tx = await stablecoinContract.redeemStablecoin(ethers.utils.parseUnits(stablecoinAmount, 18));
    await tx.wait();

    return NextResponse.json({ success: true, message: "Stablecoin redeemed for ETH!" });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}