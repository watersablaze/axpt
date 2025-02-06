import { ethers } from "ethers";
import { NextResponse } from "next/server";
import dotenv from "dotenv";
dotenv.config();

// ✅ Ensure environment variables are loaded
if (!process.env.SEPOLIA_RPC_URL || !process.env.PRIVATE_KEY) {
  throw new Error("Missing environment variables: Check .env file");
}

// ✅ Set up provider and signer
const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// ✅ Define the contract address & ABI
const contractAddress = "0xYourStablecoinContractAddress"; // 🔹 Replace with actual contract address
const contractABI = [
  "function mintStablecoin() external payable",
];

const stablecoinContract = new ethers.Contract(contractAddress, contractABI, wallet);

export async function POST(req: Request) {
  try {
    const { userAddress, ethAmount } = await req.json();

    if (!userAddress || !ethAmount) {
      return NextResponse.json({ success: false, message: "Missing parameters" }, { status: 400 });
    }

    // ✅ Fix: Use correct ethers v5 syntax
    const tx = await stablecoinContract.mintStablecoin({ value: ethers.utils.parseEther(ethAmount.toString()) });
    await tx.wait();

    return NextResponse.json({ success: true, message: "Stablecoin minted successfully!" });
  } catch (error) {
    console.error("❌ Minting failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: "Minting failed" }, { status: 500 });
  }
}