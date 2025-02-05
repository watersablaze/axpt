import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

// ✅ Set up provider and signer
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

// ✅ Contract details
const contractAddress = "0xYourStablecoinContractAddress"; // Replace with actual deployed contract address
const contractABI = [
  // Replace with actual ABI for GoldPeggedStablecoin contract
  "function redeemStablecoin(uint256 stablecoinAmount) external",
];

const stablecoinContract = new ethers.Contract(contractAddress, contractABI, wallet);

async function redeemStablecoin(amount: number) {
  try {
    console.log(`🔄 Redeeming ${amount} GLDUSD...`);

    // ✅ Call `redeemStablecoin` function on the contract
    const tx = await stablecoinContract.redeemStablecoin(ethers.parseUnits(amount.toString(), 18));

    console.log("⏳ Waiting for transaction confirmation...");
    await tx.wait();

    console.log(`✅ Successfully redeemed ${amount} GLDUSD!`);
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Redemption failed:", error.message);
    } else {
      console.error("❌ Redemption failed with unknown error:", error);
    }
  }
}

// ✅ Call the function with an example amount
redeemStablecoin(10).catch(console.error);