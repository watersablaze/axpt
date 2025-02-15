import { Contract, JsonRpcProvider, parseEther, Wallet } from "ethers";
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
  "function mintStablecoin() external payable",
];

const stablecoinContract = new Contract(contractAddress, contractABI, wallet);

async function mintStablecoin(ethAmount: number) {
  try {
    console.log(`🔄 Minting ${ethAmount} ETH worth of stablecoins...`);

    const tx = await stablecoinContract.mintStablecoin({ value: parseEther(ethAmount.toString()) });

    console.log("⏳ Waiting for transaction confirmation...");
    await tx.wait();

    console.log(`✅ Successfully minted ${ethAmount} GLDUSD!`);
  } catch (error) {
    console.error("❌ Minting failed:", error instanceof Error ? error.message : error);
  }
}

// ✅ Example Usage:
mintStablecoin(0.1).catch(console.error);