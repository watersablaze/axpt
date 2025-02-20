import { NextResponse } from "next/server";
import { stablecoinContract } from "@/lib/ethers";
import { ethers } from "ethers"; // ✅ Ensure ethers is imported

export async function POST(req: Request) {
  try {
    // ✅ Parse JSON input
    const { sender, recipient, amount } = await req.json();

    // ✅ Validate required parameters
    if (!sender || !recipient || !amount) {
      return NextResponse.json(
        { success: false, message: "Missing parameters" },
        { status: 400 }
      );
    }

    // ✅ Ensure correct ethers usage for amount conversion
    const parsedAmount = ethers.parseUnits(amount.toString(), 18);

    // ✅ Call smart contract transfer function
    const tx = await stablecoinContract.transfer(recipient, parsedAmount);
    await tx.wait();

    return NextResponse.json({
      success: true,
      txHash: tx.hash,
      message: "Funds transferred successfully!",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}