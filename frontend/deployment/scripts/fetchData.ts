import { ethers, formatUnits } from "ethers"; // ✅ Fix: Import `formatUnits` separately
import dotenv from "dotenv";

dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
const contractAddress = process.env.DEPLOYED_CONTRACT_ADDRESS!;
const contractABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function getGoldPrice() external view returns (uint256)",
];

const stablecoinContract = new ethers.Contract(contractAddress, contractABI, provider);

async function fetchContractData(userAddress: string) {
  console.log(`📊 Fetching data for: ${userAddress}`);

  const balance = await stablecoinContract.balanceOf(userAddress);
  const goldPrice = await stablecoinContract.getGoldPrice();

  console.log(`💰 User Balance: ${formatUnits(balance, 18)} GLDUSD`);
  console.log(`🟡 Current Gold Price: ${formatUnits(goldPrice, 18)} USD`);
}

// Example Usage:
fetchContractData("0xYourWalletAddress").catch(console.error);