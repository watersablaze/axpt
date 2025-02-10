import { ethers, parseEther } from "ethers"; // ✅ Fix: Import `parseEther` separately
import dotenv from "dotenv";

dotenv.config();

// ✅ Fix: Correct provider syntax
const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const contractAddress = process.env.DEPLOYED_CONTRACT_ADDRESS!;
const contractABI = [
  "function mintStablecoin() external payable",
  "function redeemStablecoin(uint256 stablecoinAmount) external",
];

const stablecoinContract = new ethers.Contract(contractAddress, contractABI, wallet);

async function mintStablecoin(ethAmount: number) {
  console.log(`💰 Minting ${ethAmount} ETH worth of stablecoins...`);

  const tx = await stablecoinContract.mintStablecoin({ value: parseEther(ethAmount.toString()) });

  console.log("⏳ Waiting for transaction confirmation...");
  await tx.wait();

  console.log("✅ Minted stablecoin successfully!");
}

async function redeemStablecoin(amount: number) {
  console.log(`🔄 Redeeming ${amount} GLDUSD...`);

  const tx = await stablecoinContract.redeemStablecoin(parseEther(amount.toString()));

  console.log("⏳ Waiting for transaction confirmation...");
  await tx.wait();

  console.log("✅ Redeemed stablecoin successfully!");
}

// Example Usage:
mintStablecoin(0.1).catch(console.error);
redeemStablecoin(10).catch(console.error);