import { Contract, JsonRpcProvider, Wallet, parseEther } from "ethers";
import dotenv from "dotenv";

dotenv.config();

// ✅ Fix: Use `JsonRpcProvider`
const provider = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
const wallet = new Wallet(process.env.PRIVATE_KEY!, provider);

const contractAddress = process.env.DEPLOYED_CONTRACT_ADDRESS!;
const contractABI = [
  "function mintStablecoin() external payable",
  "function redeemStablecoin(uint256 stablecoinAmount) external",
];

const stablecoinContract = new Contract(contractAddress, contractABI, wallet);

async function mintStablecoin(amount: number) {
  try {
    console.log(`🔄 Minting ${amount} GLDUSD...`);

    const tx = await stablecoinContract.mintStablecoin({ value: parseEther(amount.toString()) });

    console.log("⏳ Waiting for transaction confirmation...");
    await tx.wait();

    console.log(`✅ Successfully minted ${amount} GLDUSD!`);
  } catch (error) {
    console.error("❌ Minting failed:", error);
  }
}

async function redeemStablecoin(amount: number) {
  try {
    console.log(`🔄 Redeeming ${amount} GLDUSD...`);

    const tx = await stablecoinContract.redeemStablecoin(amount); // ✅ No `parseEther`

    console.log("⏳ Waiting for transaction confirmation...");
    await tx.wait();

    console.log(`✅ Successfully redeemed ${amount} GLDUSD!`);
  } catch (error) {
    console.error("❌ Redemption failed:", error);
  }
}

// Example Usage:
mintStablecoin(0.1).catch(console.error);
redeemStablecoin(10).catch(console.error);