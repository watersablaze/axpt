import { Contract, JsonRpcProvider, formatUnits } from "ethers";
import dotenv from "dotenv";

dotenv.config();

// ✅ Fix: Correct provider syntax
const provider = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
const contractAddress = process.env.DEPLOYED_CONTRACT_ADDRESS!;
const contractABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function getGoldPrice() external view returns (uint256)",
];

const stablecoinContract = new Contract(contractAddress, contractABI, provider);

async function fetchContractData(userAddress: string) {
  try {
    console.log(`📊 Fetching data for: ${userAddress}`);

    const balance = await stablecoinContract.balanceOf(userAddress);
    const goldPrice = await stablecoinContract.getGoldPrice();

    console.log(`💰 User Balance: ${formatUnits(balance, 18)} GLDUSD`);
    console.log(`🟡 Current Gold Price: ${formatUnits(goldPrice, 18)} USD`);
  } catch (error) {
    console.error("❌ Error fetching contract data:", error);
  }
}

// Example Usage:
fetchContractData("0xYourWalletAddress").catch(console.error);