import { NextResponse } from "next/server";
import { stablecoinContract } from "@/lib/ethers";

export async function POST(req: Request) {
  const { sender, recipient, amount } = await req.json();

  if (!sender || !recipient || !amount) {
    return NextResponse.json({ success: false, message: "Missing parameters" }, { status: 400 });
  }

  try {
    // Call smart contract transfer function
    const tx = await stablecoinContract.transfer(recipient, ethers.parseUnits(amount.toString(), 18));
    await tx.wait();

    return NextResponse.json({ success: true, message: "Funds transferred successfully!" });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}