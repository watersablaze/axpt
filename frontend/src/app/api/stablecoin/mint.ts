import { NextResponse } from "next/server";
import { stablecoinContract } from "../../../lib/ethers";

export async function POST(req: Request) {
  try {
    const { userAddress, ethAmount } = await req.json();

    if (!userAddress || !ethAmount) {
      return NextResponse.json({ success: false, message: "Missing parameters" }, { status: 400 });
    }

    const tx = await stablecoinContract.mintStablecoin({ value: ethers.utils.parseEther(ethAmount) });
    await tx.wait();

    return NextResponse.json({ success: true, message: "Stablecoin minted successfully!" });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}