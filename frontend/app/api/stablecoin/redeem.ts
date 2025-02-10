import { Contract, JsonRpcProvider, parseUnits, Wallet } from "ethers";
import dotenv from "dotenv";
dotenv.config();

// ✅ Ensure environment variables are set
if (!process.env.SEPOLIA_RPC_URL || !process.env.PRIVATE_KEY || !process.env.DEPLOYED_CONTRACT_ADDRESS) {
  throw new Error("❌ Missing environment variables. Check .env file.");
}

// ✅ Provider and Wallet
const provider = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new Wallet(process.env.PRIVATE_KEY, provider);

// ✅ Define Contract ABI & Address
const contractAddress = process.env.DEPLOYED_CONTRACT_ADDRESS!;
const contractABI = [
  "function redeemStablecoin(uint256 stablecoinAmount) external",
];

const stablecoinContract = new Contract(contractAddress, contractABI, wallet);

async function redeemStablecoin(amount: number) {
  try {
    console.log(`🔄 Redeeming ${amount} GLDUSD...`);

    const tx = await stablecoinContract.redeemStablecoin(parseUnits(amount.toString(), 18));

    console.log("⏳ Waiting for transaction confirmation...");
    await tx.wait();

    console.log(`✅ Successfully redeemed ${amount} GLDUSD!`);
  } catch (error) {
    console.error("❌ Redemption failed:", error instanceof Error ? error.message : error);
  }
}

// ✅ Example Usage:
redeemStablecoin(10).catch(console.error);