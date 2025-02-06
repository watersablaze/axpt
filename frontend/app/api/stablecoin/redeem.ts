import { ethers } from "ethers";
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
  "function redeemStablecoin(uint256 stablecoinAmount) external",
];

const stablecoinContract = new ethers.Contract(contractAddress, contractABI, wallet);

async function redeemStablecoin(amount: number) {
  try {
    console.log(`🔄 Redeeming ${amount} GLDUSD...`);

    // ✅ Fix: Correct ethers v5 syntax for parsing units
    const tx = await stablecoinContract.redeemStablecoin(ethers.utils.parseUnits(amount.toString(), 18));

    console.log("⏳ Waiting for transaction confirmation...");
    await tx.wait();

    console.log(`✅ Successfully redeemed ${amount} GLDUSD!`);
  } catch (error) {
    console.error("❌ Redemption failed:", error instanceof Error ? error.message : error);
  }
}

// ✅ Run an example redemption (Redeems 10 GLDUSD)
redeemStablecoin(10).catch(console.error);